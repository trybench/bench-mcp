import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

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

let authServer: Server;
let authkitDomain: string;
let signKey: CryptoKey;
let mcpServer: Server;
let mcpUrl: URL;

beforeEach(async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
  signKey = privateKey;
  const jwk = { ...(await exportJWK(publicKey)), kid: "test-key", alg: "RS256", use: "sig" };

  // Stand-in for AuthKit: serves only the JWKS document.
  const { createServer: createHttp } = await import("node:http");
  authServer = createHttp((req, res) => {
    if (req.url === "/oauth2/jwks") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => authServer.listen(0, resolve));
  authkitDomain = `http://127.0.0.1:${(authServer.address() as AddressInfo).port}`;

  upstreamCalls.length = 0;
  exchangeStatus = 200;
  mcpServer = createHttpTransportServer({
    baseUrl: "https://api.test.invalid",
    timeoutMs: 5000,
    port: 0,
    oauth: { authkitDomain, resourceUrl: RESOURCE_URL },
    fetchImpl: async (input, init) => {
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
        return new Response(JSON.stringify({ token: BENCH_TOKEN, expires_in: 3600 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
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
} = {}): Promise<string> {
  return new SignJWT({ scope: "openid profile", email: "user@example.com" })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setSubject("user_01ABC")
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
      expect(call.auth).toBe(`Bearer ${BENCH_TOKEN}`);
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
