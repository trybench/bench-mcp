import { randomUUID } from "node:crypto";
import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import type { AuthMode, CredentialSource } from "./client/http.js";
import { API_KEY_PREFIX, type BaseConfig } from "./config.js";
import {
  exchangeForBenchToken,
  type OAuthConfig,
  PROTECTED_RESOURCE_PATH,
  protectedResourceMetadata,
  RefreshingCredential,
  TokenVerifier,
  type VerifiedToken,
  wwwAuthenticate,
} from "./oauth.js";
import { createServer } from "./server.js";

/**
 * The hosted transport.
 *
 * The important difference from stdio is tenancy. Over stdio there is one
 * user per process and one key in the environment. Hosted, this process
 * serves many users at once, so the credential arrives per-connection in
 * the Authorization header and each session gets its own McpServer with
 * its own BenchClient built from that key.
 *
 * There is deliberately no ambient fallback key: a request that arrives
 * without a credential is rejected, never served as somebody else.
 */

const MCP_PATH = "/mcp";
const SESSION_HEADER = "mcp-session-id";

/** One client's connection: its transport, its server, and its identity. */
interface Session {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  /** Last time this session was touched, for idle expiry. */
  lastSeen: number;
  /**
   * Present for OAuth sessions only. It needs the access token from each
   * live request to renew, so the request path hands it one; an API-key
   * session has a credential that never expires and no such need.
   */
  credential?: RefreshingCredential;
}

/**
 * How long a session may sit idle before it is closed.
 *
 * A hosted server cannot rely on clients terminating cleanly: the SDK's
 * client `close()` does not send a DELETE, and clients crash, lose the
 * network, or are simply killed. Without expiry every abandoned session
 * keeps an McpServer and a user's API key in memory for the life of the
 * process.
 */
const DEFAULT_SESSION_TTL_MS = 30 * 60_000;
const SWEEP_INTERVAL_MS = 60_000;

export interface HttpServerOptions extends BaseConfig {
  port: number;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  /**
   * Hostnames the transport will answer to. Set in production to the
   * public hostname; DNS-rebinding protection is otherwise off, which is
   * correct for a private ALB target but not for a public origin.
   */
  allowedHosts?: string[];
  /**
   * When set, the server also accepts OAuth access tokens from this
   * authorization server, and advertises it at
   * /.well-known/oauth-protected-resource. Bench API keys keep working
   * either way — OAuth is how a user connects without handling a
   * credential, not a replacement for scripted access.
   */
  oauth?: OAuthConfig;
  /** Idle session lifetime. Exposed so tests can use a short one. */
  sessionTtlMs?: number;
  /** How often to sweep for idle sessions. */
  sweepIntervalMs?: number;
}

export function createHttpTransportServer(opts: HttpServerOptions): Server {
  const sessions = new Map<string, Session>();
  const ttlMs = opts.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
  const verifier = opts.oauth ? new TokenVerifier(opts.oauth) : undefined;

  function dropSession(id: string): void {
    const session = sessions.get(id);
    if (!session) return;
    sessions.delete(id);
    void session.server.close().catch(() => undefined);
    void session.transport.close().catch(() => undefined);
  }

  const sweep = setInterval(() => {
    const cutoff = Date.now() - ttlMs;
    for (const [id, session] of sessions) {
      if (session.lastSeen < cutoff) dropSession(id);
    }
  }, opts.sweepIntervalMs ?? SWEEP_INTERVAL_MS);
  // Must not keep the process alive on its own.
  sweep.unref();

  const httpServer = createHttpServer((req, res) => {
    void handle(req, res).catch((error: unknown) => {
      // A throw here means the handler itself failed, not the MCP call.
      if (!res.headersSent) {
        writeJson(res, 500, {
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
      console.error("bench-mcp: unhandled request error:", error);
    });
  });

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    // Unauthenticated on purpose: the ALB health check has no credential,
    // and this reveals nothing.
    if (url.pathname === "/healthz") {
      writeJson(res, 200, { status: "ok", sessions: sessions.size });
      return;
    }

    // RFC 9728: how a client discovers where to authenticate. Served
    // unauthenticated by definition — it is what an unauthenticated
    // client reads first.
    if (url.pathname === PROTECTED_RESOURCE_PATH) {
      if (!opts.oauth) {
        writeJson(res, 404, { error: "oauth is not enabled on this server" });
        return;
      }
      writeJson(res, 200, protectedResourceMetadata(opts.oauth));
      return;
    }

    if (url.pathname !== MCP_PATH) {
      writeJson(res, 404, { error: "not found" });
      return;
    }

    const sessionId = headerValue(req, SESSION_HEADER);

    // An established session: the credential was checked at initialize
    // and is bound to this session's server.
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (!session) {
        writeJson(res, 404, {
          jsonrpc: "2.0",
          error: { code: -32001, message: "Unknown or expired session. Reconnect to start a new one." },
          id: null,
        });
        return;
      }
      session.lastSeen = Date.now();
      // The client refreshes its own access token and sends the current
      // one on every request. Capturing it here is what lets the session
      // renew its bench-api token later, instead of dying with the first
      // one an hour in.
      const live = bearerToken(req);
      if (live) session.credential?.observe(live);
      await session.transport.handleRequest(req, res);
      return;
    }

    // No session id: only an initialize may open one.
    if (req.method !== "POST") {
      writeJson(res, 400, {
        jsonrpc: "2.0",
        error: { code: -32000, message: `${SESSION_HEADER} header is required` },
        id: null,
      });
      return;
    }

    const body = await readJsonBody(req);
    if (!isInitializeRequest(body)) {
      writeJson(res, 400, {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Expected an initialize request to open a session." },
        id: null,
      });
      return;
    }

    // A credential is either a Bench API key or, when OAuth is enabled, an
    // access token from the configured authorization server. The token is
    // verified here so an invalid one fails immediately with the 401 the
    // MCP spec requires, and is then forwarded to bench-api, which does
    // its own authorization — bench-mcp holds no policy of its own.
    const credential = bearerToken(req);
    const unauthorized = (message: string): void => {
      res.setHeader(
        "WWW-Authenticate",
        opts.oauth ? wwwAuthenticate(opts.oauth) : 'Bearer realm="bench"',
      );
      writeJson(res, 401, {
        jsonrpc: "2.0",
        error: { code: -32001, message },
        id: null,
      });
    };

    if (!credential) {
      unauthorized(
        opts.oauth
          ? "Authorization required. Authenticate with Bench, or supply a Bench API key."
          : "Missing Authorization header. Connect with a Bench API key generated in your account settings.",
      );
      return;
    }

    // What the session's tools will actually authenticate to bench-api
    // with. For an API key that is the key itself; for an OAuth token it
    // is a *different* credential obtained by exchange, because the spec
    // forbids forwarding the client's token to an upstream API.
    let upstreamCredential: CredentialSource = credential;
    let authMode: AuthMode = "api_key";
    let refreshing: RefreshingCredential | undefined;

    if (!credential.startsWith(API_KEY_PREFIX)) {
      if (!verifier) {
        unauthorized(`Not a Bench API key — it should start with "${API_KEY_PREFIX}".`);
        return;
      }
      let verified: VerifiedToken;
      try {
        verified = await verifier.verify(credential);
      } catch {
        // Deliberately not echoing the verification error: it
        // distinguishes expired from wrong-audience from bad-signature,
        // which is useful to an attacker and not to a client, whose only
        // move either way is to re-authenticate.
        unauthorized("Invalid or expired access token.");
        return;
      }

      try {
        const minted = await exchangeForBenchToken(
          opts.baseUrl,
          credential,
          opts.fetchImpl ?? globalThis.fetch,
        );
        const renewable = new RefreshingCredential(
          {
            verifier,
            baseUrl: opts.baseUrl,
            fetchImpl: opts.fetchImpl ?? globalThis.fetch,
            subject: verified.subject,
          },
          credential,
          minted,
        );
        refreshing = renewable;
        upstreamCredential = () => renewable.get();
        authMode = "oauth";
      } catch (error) {
        // A verified token that cannot be exchanged means the person is
        // authenticated but not entitled — no Bench account, or a plan
        // without editor access. That is a 403, not a 401: signing in
        // again will not change it, and bench-api's message says why.
        writeJson(res, 403, {
          jsonrpc: "2.0",
          error: {
            code: -32002,
            message: error instanceof Error ? error.message : "could not authorize with Bench",
          },
          id: null,
        });
        return;
      }
    }

    // One server per session, holding only this user's credential.
    const server = createServer({
      baseUrl: opts.baseUrl,
      apiKey: upstreamCredential,
      authMode,
      timeoutMs: opts.timeoutMs,
      ...(opts.fetchImpl !== undefined ? { fetchImpl: opts.fetchImpl } : {}),
    });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        sessions.set(id, {
          transport,
          server,
          lastSeen: Date.now(),
          ...(refreshing !== undefined ? { credential: refreshing } : {}),
        });
      },
      onsessionclosed: (id) => {
        dropSession(id);
      },
      ...(opts.allowedHosts !== undefined
        ? { allowedHosts: opts.allowedHosts, enableDnsRebindingProtection: true }
        : {}),
    });

    // Closing the transport must drop the session, or a long-lived
    // process accumulates dead sessions holding user credentials.
    transport.onclose = () => {
      if (transport.sessionId) dropSession(transport.sessionId);
    };

    // The SDK types the transport's own `onclose` as `(() => void) |
    // undefined` while the Transport interface declares it optional,
    // which `exactOptionalPropertyTypes` treats as incompatible. The
    // cast is to that mismatch only — keeping the strict setting, which
    // has already caught a real bug in this codebase, is worth more than
    // avoiding one narrow cast.
    await server.connect(transport as unknown as Parameters<typeof server.connect>[0]);
    // The body is already consumed, so hand it back rather than letting
    // the transport try to read the stream a second time.
    await transport.handleRequest(req, res, body);
  }

  httpServer.on("close", () => {
    clearInterval(sweep);
    for (const id of [...sessions.keys()]) dropSession(id);
  });

  return httpServer;
}

function headerValue(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers[name];
  return Array.isArray(raw) ? raw[0] : raw;
}

function bearerToken(req: IncomingMessage): string | undefined {
  const header = headerValue(req, "authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  const token = header.slice("Bearer ".length).trim();
  return token || undefined;
}

function writeJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/** Reads and parses a JSON body, capped so a bad client can't exhaust memory. */
const MAX_BODY_BYTES = 4 * 1024 * 1024;

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    total += buf.length;
    if (total > MAX_BODY_BYTES) throw new Error("request body too large");
    chunks.push(buf);
  }
  if (total === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return undefined;
  }
}
