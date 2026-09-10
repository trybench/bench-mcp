import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createHttpTransportServer } from "../src/http.js";
import { protectedResourceMetadata, readOAuthConfig } from "../src/oauth.js";

/**
 * These run a real JWKS endpoint and sign real tokens, rather than
 * stubbing the verifier. The whole value of this code is that it rejects
 * tokens it should reject, and a stubbed verifier would assert nothing
 * about that.
 */

const RESOURCE_URL = "https://mcp.test.invalid";
/** What bench-api hands back in exchange for a verified access token. */
const BENCH_TOKEN = "bench-issued-session-token";

const upstreamCalls: Array<{ path: string; auth: string | null }> = [];
let exchangeStatus = 200;
/** How long the fake bench-api says its token lasts, in seconds. */
let exchangeExpiresIn = 3600;
/** Bumped per exchange so a renewal is distinguishable from the first mint. */
let mintCount = 0;
/** How many times a client spent its refresh token at the fake AuthKit. */
let refreshGrants = 0;
/** Audience the fake AuthKit stamps on tokens it issues at the token endpoint. */
let refreshAudience = "";

let authServer: Server;
let authkitDomain: string;
let signKey: CryptoKey;
let mcpServer: Server;
let mcpUrl: URL;

/** Stands in for bench-api: records every call, and mints exchange tokens. */
const benchApiStub: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input.toString());
  const auth = new Headers(init?.headers).get("Authorization");
  upstreamCalls.push({ path: url.pathname, auth });
  if (url.pathname === "/api/auth/mcp-token") {
    if (exchangeStatus !== 200) {
      return new Response(
        JSON.stringify({ error: { code: "mcp_requires_growth", message: "Upgrade to Growth." } }),
        { status: exchangeStatus, headers: { "Content-Type": "application/json" } },
      );
    }
    mintCount += 1;
    return new Response(
      JSON.stringify({ token: `${BENCH_TOKEN}-${mintCount}`, expires_in: exchangeExpiresIn }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

beforeEach(async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
  signKey = privateKey;
  const jwk = { ...(await exportJWK(publicKey)), kid: "test-key", alg: "RS256", use: "sig" };

  // Stand-in for AuthKit: serves only the JWKS document.
  const { createServer: createHttp } = await import("node:http");
  authServer = createHttp((req, res) => {
    const path = (req.url ?? "").split("?")[0];
    if (path === "/oauth2/jwks") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    // Enough of an authorization server for a client to discover the
    // token endpoint and spend a refresh token at it.
    if (path === "/.well-known/oauth-authorization-server") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          issuer: authkitDomain,
          authorization_endpoint: `${authkitDomain}/oauth2/authorize`,
          token_endpoint: `${authkitDomain}/oauth2/token`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"],
          code_challenge_methods_supported: ["S256"],
        }),
      );
      return;
    }
    if (path === "/oauth2/token" && req.method === "POST") {
      refreshGrants += 1;
      void (async () => {
        const fresh = await mintToken({ audience: refreshAudience });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            access_token: fresh,
            token_type: "Bearer",
            expires_in: 300,
            refresh_token: "refresh-token",
          }),
        );
      })();
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => authServer.listen(0, resolve));
  authkitDomain = `http://127.0.0.1:${(authServer.address() as AddressInfo).port}`;

  upstreamCalls.length = 0;
  exchangeStatus = 200;
  exchangeExpiresIn = 3600;
  mintCount = 0;
  refreshGrants = 0;
  refreshAudience = RESOURCE_URL;
  mcpServer = createHttpTransportServer({
    baseUrl: "https://api.test.invalid",
    timeoutMs: 5000,
    port: 0,
    oauth: { authkitDomain, resourceUrl: RESOURCE_URL },
    fetchImpl: benchApiStub,
  });
  await new Promise<void>((resolve) => mcpServer.listen(0, resolve));
  mcpUrl = new URL(`http://127.0.0.1:${(mcpServer.address() as AddressInfo).port}`);
});

afterEach(async () => {
  await new Promise<void>((resolve) => mcpServer.close(() => resolve()));
  await new Promise<void>((resolve) => authServer.close(() => resolve()));
});

async function mintToken(overrides: {
  audience?: string;
  issuer?: string;
  expiresIn?: string;
  subject?: string;
} = {}): Promise<string> {
  return new SignJWT({ scope: "openid profile", email: "user@example.com" })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setSubject(overrides.subject ?? "user_01ABC")
    .setIssuer(overrides.issuer ?? authkitDomain)
    .setAudience(overrides.audience ?? RESOURCE_URL)
    .setIssuedAt()
    .setExpirationTime(overrides.expiresIn ?? "1h")
    .sign(signKey);
}

function initializeBody(): string {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } },
  });
}

async function initialize(token?: string): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(new URL("/mcp", mcpUrl), { method: "POST", headers, body: initializeBody() });
}

describe("protected resource metadata", () => {
  it("serves the RFC 9728 document unauthenticated", async () => {
    const res = await fetch(new URL("/.well-known/oauth-protected-resource", mcpUrl));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      resource: RESOURCE_URL,
      authorization_servers: [authkitDomain],
      bearer_methods_supported: ["header"],
      scopes_supported: ["openid", "profile", "email"],
    });
  });

  it("points an unauthenticated client at that document", async () => {
    const res = await initialize();

    expect(res.status).toBe(401);
    // Without this the client has no way to discover where to
    // authenticate — a bare 401 is a dead end.
    expect(res.headers.get("WWW-Authenticate")).toContain(
      `resource_metadata="${RESOURCE_URL}/.well-known/oauth-protected-resource"`,
    );
  });
});

describe("token verification", () => {
  it("accepts a correctly issued and audienced token", async () => {
    const res = await initialize(await mintToken());

    expect(res.status).toBe(200);
    expect(res.headers.get("mcp-session-id")).toBeTruthy();
  });

  // The confused-deputy case the MCP spec names explicitly: a genuine
  // token from the same authorization server, issued for a DIFFERENT
  // resource, must not be replayable here.
  it("rejects a valid token issued for another resource", async () => {
    const res = await initialize(await mintToken({ audience: "https://someone-else.example.com" }));

    expect(res.status).toBe(401);
  });

  it("rejects a token from a different issuer", async () => {
    const res = await initialize(await mintToken({ issuer: "https://evil.example.com" }));

    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const res = await initialize(await mintToken({ expiresIn: "-1h" }));

    expect(res.status).toBe(401);
  });

  it("rejects a garbage token", async () => {
    const res = await initialize("not-a-jwt");

    expect(res.status).toBe(401);
  });

  it("does not leak why verification failed", async () => {
    const res = await initialize(await mintToken({ audience: "https://someone-else.example.com" }));
    const body = (await res.json()) as { error?: { message?: string } };

    // "wrong audience" vs "expired" vs "bad signature" is useful to an
    // attacker and not to a client, whose only move either way is to
    // re-authenticate.
    expect(body.error?.message).toBe("Invalid or expired access token.");
  });

  it("still accepts a Bench API key when OAuth is enabled", async () => {
    // OAuth is how a person connects; keys remain the scripted path.
    const res = await initialize("bench_sk_stillworks");

    expect(res.status).toBe(200);
  });
});

describe("configuration", () => {
  it("is off unless both settings are present", () => {
    expect(readOAuthConfig({})).toBeUndefined();
    expect(readOAuthConfig({ BENCH_MCP_AUTHKIT_DOMAIN: "https://x.authkit.app" })).toBeUndefined();
    expect(readOAuthConfig({ BENCH_MCP_RESOURCE_URL: "https://mcp.example.com" })).toBeUndefined();
  });

  it("strips trailing slashes, which would break issuer and audience comparison", () => {
    const config = readOAuthConfig({
      BENCH_MCP_AUTHKIT_DOMAIN: "https://x.authkit.app/",
      BENCH_MCP_RESOURCE_URL: "https://mcp.example.com/",
    });

    expect(config).toEqual({
      authkitDomain: "https://x.authkit.app",
      resourceUrl: "https://mcp.example.com",
    });
  });

  it("builds metadata a client can consume directly", () => {
    expect(
      protectedResourceMetadata({
        authkitDomain: "https://x.authkit.app",
        resourceUrl: "https://mcp.example.com",
      }),
    ).toEqual({
      resource: "https://mcp.example.com",
      authorization_servers: ["https://x.authkit.app"],
      bearer_methods_supported: ["header"],
      scopes_supported: ["openid", "profile", "email"],
    });
  });
});

describe("without oauth configured", () => {
  it("404s the metadata document rather than advertising a server it has none of", async () => {
    const plain = createHttpTransportServer({
      baseUrl: "https://api.test.invalid",
      timeoutMs: 5000,
      port: 0,
      fetchImpl: async () => new Response("{}", { status: 200 }),
    });
    await new Promise<void>((resolve) => plain.listen(0, resolve));
    const url = new URL(`http://127.0.0.1:${(plain.address() as AddressInfo).port}`);

    const res = await fetch(new URL("/.well-known/oauth-protected-resource", url));

    expect(res.status).toBe(404);
    await new Promise<void>((resolve) => plain.close(() => resolve()));
  });
});


describe("token exchange", () => {
  // The requirement that drove this design: the MCP spec forbids
  // forwarding the client's token to an upstream API, because it is
  // audienced for this server and bench-api would be honouring a
  // credential never issued for it.
  it("never uses the client's access token as a credential at bench-api", async () => {
    const token = await mintToken();

    await initialize(token);

    // Presenting it AT the exchange endpoint is the point; using it
    // anywhere else would be the passthrough the spec forbids.
    const resourceCalls = upstreamCalls.filter((c) => c.path !== "/api/auth/mcp-token");
    expect(upstreamCalls.some((c) => c.path === "/api/auth/mcp-token")).toBe(true);
    for (const call of resourceCalls) {
      expect(call.auth).not.toContain(token);
    }
  });

  it("exchanges the access token and uses what bench-api returns", async () => {
    await initialize(await mintToken());

    const exchange = upstreamCalls.find((c) => c.path === "/api/auth/mcp-token");
    expect(exchange).toBeDefined();
    // Everything after the exchange authenticates with bench-api's own
    // token, not the one the client presented.
    const others = upstreamCalls.filter((c) => c.path !== "/api/auth/mcp-token");
    for (const call of others) {
      expect(call.auth).toBe(`Bearer ${BENCH_TOKEN}-1`);
    }
  });

  it("does not exchange for an API key, which is already a bench credential", async () => {
    await initialize("bench_sk_stillworks");

    expect(upstreamCalls.find((c) => c.path === "/api/auth/mcp-token")).toBeUndefined();
  });

  // Authenticated but not entitled — no Bench account, or a plan without
  // editor access. Signing in again will not fix it, so 403 not 401.
  it("reports a refused exchange as forbidden, surfacing bench-api's reason", async () => {
    exchangeStatus = 403;

    const res = await initialize(await mintToken());

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: { message?: string } };
    expect(body.error?.message).toContain("Upgrade to Growth");
  });
});


describe("scope advertisement", () => {
  // The bug this fixes: without scopes_supported a client omits the scope
  // parameter entirely, the authorization server issues a token with no
  // email claim, and the exchange rejects it — after the user has already
  // signed in successfully, which makes it look like an auth failure when
  // authentication actually worked.
  it("asks for email, which the exchange needs to identify the account", async () => {
    const res = await fetch(new URL("/.well-known/oauth-protected-resource", mcpUrl));
    const doc = (await res.json()) as { scopes_supported?: string[] };

    expect(doc.scopes_supported).toContain("email");
  });

  it("also states the scopes in the challenge, which a client treats as authoritative", async () => {
    const res = await initialize();

    expect(res.headers.get("WWW-Authenticate")).toContain('scope="openid profile email"');
  });
});


/**
 * A hosted session outliving its bench-api token is the ordinary case,
 * not an edge one: bench-api's MCP tokens last an hour and a session
 * polling an evaluation stays open for as long as the run takes. These
 * drive real tool calls over an established session rather than
 * inspecting the credential object, because the bug was that the tool
 * calls kept sending a token nobody had renewed.
 */
describe("credential renewal", () => {
  /** Opens a session and returns its id, as a client's handshake does. */
  async function openSession(token: string): Promise<string> {
    const res = await initialize(token);
    const sessionId = res.headers.get("mcp-session-id");
    if (!sessionId) throw new Error(`no session id (status ${res.status})`);
    await res.text();
    // The transport will not serve requests until the handshake finishes.
    const ack = await fetch(new URL("/mcp", mcpUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "mcp-session-id": sessionId,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    });
    await ack.text();
    return sessionId;
  }

  /**
   * Calls a read-only tool on an established session, as a poll would.
   *
   * The body is read to the end on purpose: the response is an SSE
   * stream whose headers arrive before the handler has called bench-api,
   * so asserting on upstream calls without draining it is a race.
   */
  async function callWhoami(
    sessionId: string,
    token: string,
  ): Promise<{ status: number; body: string }> {
    const res = await fetch(new URL("/mcp", mcpUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "mcp-session-id": sessionId,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "bench_whoami", arguments: {} },
      }),
    });
    return { status: res.status, body: await res.text() };
  }

  const upstreamAuth = (): Array<string | null> =>
    upstreamCalls.filter((c) => c.path === "/api/auth/me").map((c) => c.auth);

  it("keeps using the first token while it is still fresh", async () => {
    const token = await mintToken();
    const sessionId = await openSession(token);

    await callWhoami(sessionId, token);
    await callWhoami(sessionId, token);

    expect(upstreamAuth()).toEqual([`Bearer ${BENCH_TOKEN}-1`, `Bearer ${BENCH_TOKEN}-1`]);
    expect(mintCount).toBe(1);
  });

  // The reported failure: a session polling a long run passed the
  // one-hour mark and every call after it came back unauthorized.
  it("renews the bench-api token once it lapses, instead of failing the call", async () => {
    exchangeExpiresIn = 1;
    const token = await mintToken();
    const sessionId = await openSession(token);

    await new Promise((resolve) => setTimeout(resolve, 1100));
    const res = await callWhoami(sessionId, token);

    expect(res.status).toBe(200);
    expect(mintCount).toBe(2);
    expect(upstreamAuth()).toEqual([`Bearer ${BENCH_TOKEN}-2`]);
  });

  // A client refreshes with the authorization server on its own schedule,
  // so by renewal time the token it presents is not the one the session
  // opened with. Renewing from the stale one would exchange an expired
  // token.
  it("renews from the access token on the live request, not the one it opened with", async () => {
    exchangeExpiresIn = 1;
    const original = await mintToken();
    const sessionId = await openSession(original);
    const refreshed = await mintToken({ expiresIn: "2h" });
    expect(refreshed).not.toBe(original);

    await new Promise((resolve) => setTimeout(resolve, 1100));
    await callWhoami(sessionId, refreshed);

    const exchanges = upstreamCalls.filter((c) => c.path === "/api/auth/mcp-token");
    expect(exchanges).toHaveLength(2);
    expect(exchanges[1]?.auth).toBe(`Bearer ${refreshed}`);
  });

  // A session is bound to whoever opened it. Renewing from someone else's
  // token would hand their account to this session.
  it("refuses to renew onto a different account", async () => {
    exchangeExpiresIn = 1;
    const token = await mintToken();
    const sessionId = await openSession(token);
    const somebodyElse = await mintToken({ subject: "user_02XYZ" });

    await new Promise((resolve) => setTimeout(resolve, 1100));
    const res = await callWhoami(sessionId, somebodyElse);

    expect(res.body).toContain("different Bench account");
    expect(mintCount).toBe(1);
    expect(upstreamAuth()).toEqual([]);
  });

  // A plan lapsing mid-session is not an authentication problem, and
  // answering it with a 401 would send the client round the sign-in loop
  // to arrive back at the same refusal.
  it("reports a renewal refused on entitlement as forbidden, not unauthorized", async () => {
    exchangeExpiresIn = 1;
    const token = await mintToken();
    const sessionId = await openSession(token);
    exchangeStatus = 403;

    await new Promise((resolve) => setTimeout(resolve, 1100));
    const res = await callWhoami(sessionId, token);

    expect(res.status).toBe(403);
    expect(res.body).toContain("Upgrade to Growth");
  });

  // An API key on an OAuth session is not a credential a renewal can use;
  // storing it would destroy the access token the renewal needs.
  it("ignores an API key presented on an OAuth session", async () => {
    exchangeExpiresIn = 1;
    const token = await mintToken();
    const sessionId = await openSession(token);

    await new Promise((resolve) => setTimeout(resolve, 1100));
    const res = await callWhoami(sessionId, "bench_sk_notatoken");

    expect(res.status).toBe(200);
    const exchanges = upstreamCalls.filter((c) => c.path === "/api/auth/mcp-token");
    expect(exchanges[1]?.auth).toBe(`Bearer ${token}`);
  });
});


/**
 * The recovery this design turns on.
 *
 * An MCP client refreshes its access token when it is challenged with a
 * 401, and not before — `_commonHeaders` simply reads whatever the auth
 * provider has stored. So a session whose bench-api token has lapsed
 * cannot renew from the token on the wire, because that one is stale
 * too. Issuing the challenge is what makes the client produce a usable
 * token, and it replays the request afterwards.
 *
 * This drives the real SDK client against a real (if small) authorization
 * server rather than asserting on status codes, because the claim being
 * made is that a stuck session heals with nobody touching it.
 */
describe("session recovery", () => {
  // Its own MCP server, listening on the address it also calls itself, so
  // the resource_metadata URL in the challenge is one the client can
  // actually fetch. The shared harness uses a fictional hostname, which
  // is fine for asserting on headers and fatal for a real OAuth client.
  let recoveryServer: Server;
  let recoveryUrl: URL;
  let recoveryResource: string;

  beforeEach(async () => {
    const port = await freePort();
    recoveryResource = `http://127.0.0.1:${port}`;
    refreshAudience = recoveryResource;
    recoveryUrl = new URL(`${recoveryResource}/mcp`);
    recoveryServer = createHttpTransportServer({
      baseUrl: "https://api.test.invalid",
      timeoutMs: 5000,
      port,
      oauth: { authkitDomain, resourceUrl: recoveryResource },
      fetchImpl: benchApiStub,
    });
    await new Promise<void>((resolve) => recoveryServer.listen(port, resolve));
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => recoveryServer.close(() => resolve()));
  });

  it("challenges a session it cannot renew, and the client heals it unaided", async () => {
    exchangeExpiresIn = 1;
    // Expires almost immediately, so by renewal time the token the client
    // has stored is as stale as a real one would be.
    const stale = await mintToken({ audience: recoveryResource, expiresIn: "2s" });

    let stored = stale;
    let redirected = false;
    const authProvider = {
      redirectUrl: "http://localhost/callback",
      clientMetadata: { redirect_uris: ["http://localhost/callback"] },
      clientInformation: () => ({ client_id: "test-client" }),
      tokens: () => ({ access_token: stored, token_type: "Bearer", refresh_token: "refresh-token" }),
      saveTokens: (t: { access_token: string }) => {
        stored = t.access_token;
      },
      redirectToAuthorization: () => {
        // Falling back to the browser would mean the refresh never
        // happened — recovery is supposed to be invisible to the user.
        redirected = true;
      },
      saveCodeVerifier: () => undefined,
      codeVerifier: () => "verifier",
    };

    const client = new Client({ name: "recovery-test", version: "0.0.0" });
    const transport = new StreamableHTTPClientTransport(recoveryUrl, {
      // The SDK's provider interface is wider than this stub needs.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authProvider: authProvider as any,
    });
    await client.connect(transport);

    // Outlive the bench-api token, as polling a run does.
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const result = await client.callTool({ name: "bench_whoami", arguments: {} });

    expect(result.isError).toBeFalsy();
    expect(redirected).toBe(false);
    // The client refreshed, and the session renewed off what that produced.
    expect(refreshGrants).toBeGreaterThan(0);
    expect(stored).not.toBe(stale);
    expect(mintCount).toBe(2);
    const resourceCalls = upstreamCalls.filter((c) => c.path === "/api/auth/me");
    expect(resourceCalls.at(-1)?.auth).toBe(`Bearer ${BENCH_TOKEN}-2`);

    await client.close();
  });
});

/** An unused localhost port, so a server can be told its own address up front. */
async function freePort(): Promise<number> {
  const { createServer: createHttp } = await import("node:http");
  const probe = createHttp();
  await new Promise<void>((resolve) => probe.listen(0, resolve));
  const port = (probe.address() as AddressInfo).port;
  await new Promise<void>((resolve) => probe.close(() => resolve()));
  return port;
}
