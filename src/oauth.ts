import { createRemoteJWKSet, jwtVerify } from "jose";

import { API_KEY_PREFIX } from "./config.js";

/**
 * OAuth resource-server support.
 *
 * The MCP spec makes the MCP server an OAuth 2.1 *resource server* only —
 * the authorization server is explicitly out of scope and may be a
 * separate entity. Here that is WorkOS AuthKit, which already issues
 * identity for Bench, so nothing in this repo issues or stores tokens: it
 * publishes where to get one, and verifies the ones it is given.
 *
 * Two pieces, per the spec:
 *
 *   RFC 9728 — /.well-known/oauth-protected-resource, telling a client
 *   which authorization server to use. Required of every protected MCP
 *   server.
 *
 *   RFC 8707 — audience binding. A token is only accepted if it was
 *   issued *for this server*. Without that check, a token minted for some
 *   other AuthKit-protected resource would be replayable here, which is
 *   the confused-deputy problem the spec calls out by name.
 */

export interface OAuthConfig {
  /** AuthKit instance URL, e.g. https://foo.authkit.app — the issuer. */
  authkitDomain: string;
  /** This server's canonical URI, and the audience tokens must carry. */
  resourceUrl: string;
}

/** Reads OAuth config from the environment. Absent means OAuth is off and
 * the server stays on bearer API keys, which is the local/stdio story and
 * remains valid — the spec says stdio servers should take credentials
 * from the environment rather than doing OAuth at all. */
export function readOAuthConfig(env: NodeJS.ProcessEnv = process.env): OAuthConfig | undefined {
  const authkitDomain = env.BENCH_MCP_AUTHKIT_DOMAIN?.trim().replace(/\/+$/, "");
  const resourceUrl = env.BENCH_MCP_RESOURCE_URL?.trim().replace(/\/+$/, "");
  if (!authkitDomain || !resourceUrl) return undefined;
  return { authkitDomain, resourceUrl };
}

/**
 * Scopes a token must carry to be usable here.
 *
 * `email` is not decoration: bench-api matches an access token to a Bench
 * account by its email claim, and refuses the exchange without one. The
 * authorization server only includes that claim if the scope was
 * requested, and per the spec a client "omits the scope parameter if
 * scopes_supported is undefined" — so leaving this out silently produced
 * tokens that authenticated fine and could not be exchanged.
 */
export const REQUIRED_SCOPES = ["openid", "profile", "email"] as const;

/** The RFC 9728 document. Clients read this to find the authorization
 * server and to learn which scopes to ask for, so its shape is a
 * contract, not an implementation detail. */
export function protectedResourceMetadata(config: OAuthConfig): Record<string, unknown> {
  return {
    resource: config.resourceUrl,
    authorization_servers: [config.authkitDomain],
    bearer_methods_supported: ["header"],
    scopes_supported: [...REQUIRED_SCOPES],
  };
}

/** The path clients fetch that document from. Fixed by RFC 9728. */
export const PROTECTED_RESOURCE_PATH = "/.well-known/oauth-protected-resource";

/**
 * The WWW-Authenticate value for an unauthenticated request. Pointing at
 * the metadata document is what lets a client discover where to
 * authenticate, so a bare 401 without this leaves it with nowhere to go.
 */
export function wwwAuthenticate(config: OAuthConfig): string {
  // The spec says servers SHOULD include scope here, and a client takes
  // the challenge as authoritative for the current operation — so this is
  // the most direct way to tell it what to ask for, ahead of the metadata
  // document it may not have fetched yet.
  return [
    'Bearer error="unauthorized"',
    `scope="${REQUIRED_SCOPES.join(" ")}"`,
    `resource_metadata="${config.resourceUrl}${PROTECTED_RESOURCE_PATH}"`,
  ].join(", ");
}

export interface VerifiedToken {
  /** AuthKit's subject claim — the stable user identifier. */
  subject: string;
  email?: string;
  scopes: string[];
}

/**
 * Verifies an AuthKit access token for this server.
 *
 * Audience is checked against the configured resource URL rather than
 * merely trusting the signature: a valid AuthKit token issued for a
 * *different* resource must not work here.
 */
export class TokenVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: OAuthConfig) {
    // jose caches and refreshes the key set, so this does not fetch per
    // request and survives key rotation without a redeploy.
    this.jwks = createRemoteJWKSet(new URL(`${config.authkitDomain}/oauth2/jwks`));
  }

  async verify(token: string): Promise<VerifiedToken> {
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.config.authkitDomain,
      audience: this.config.resourceUrl,
    });

    if (!payload.sub) {
      throw new Error("token has no subject claim");
    }

    // AuthKit returns scopes as a space-delimited string, per OAuth 2.1.
    const rawScope = typeof payload.scope === "string" ? payload.scope : "";

    return {
      subject: payload.sub,
      ...(typeof payload.email === "string" ? { email: payload.email } : {}),
      scopes: rawScope.split(" ").filter(Boolean),
    };
  }
}

/**
 * Trades a verified access token for a bench-api credential.
 *
 * The MCP specification forbids forwarding the token received from the
 * client to an upstream API: it is audienced for this server, so using it
 * as a credential at bench-api would mean bench-api honouring a token
 * never issued for it. bench-api validates the audience and returns one
 * of its own short-lived tokens instead, and that is what tool calls use.
 *
 * Held only in the memory of the session it belongs to, and re-minted
 * there as it nears expiry — bench-api's tokens are deliberately
 * short-lived, so a single exchange at connect time would strand any
 * session that outlives one.
 */
export interface BenchToken {
  token: string;
  /** Seconds the token remains valid, as bench-api reports it. */
  expiresIn: number;
}

/**
 * How long a Bench token is assumed to last when bench-api does not say.
 * Deliberately short: erring low costs an extra exchange, erring high
 * costs the user a failed tool call.
 */
const FALLBACK_EXPIRES_IN_SECONDS = 300;

export async function exchangeForBenchToken(
  baseUrl: string,
  accessToken: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<BenchToken> {
  const response = await fetchImpl(`${baseUrl.replace(/\/+$/, "")}/api/auth/mcp-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { code?: string; message?: string } }
      | null;
    // bench-api's messages here are written for the person connecting —
    // no Bench account, wrong plan — so they are surfaced rather than
    // replaced with something vaguer.
    throw new Error(body?.error?.message ?? `token exchange failed (${response.status})`);
  }

  const body = (await response.json()) as { token?: string; expires_in?: number };
  if (!body.token) throw new Error("token exchange returned no token");
  const expiresIn =
    typeof body.expires_in === "number" && body.expires_in > 0
      ? body.expires_in
      : FALLBACK_EXPIRES_IN_SECONDS;
  return { token: body.token, expiresIn };
}

/**
 * How long before expiry a Bench token is renewed.
 *
 * Renewing exactly at expiry loses the race against clock skew and the
 * latency of the exchange itself, and the cost of losing it is a failed
 * tool call in the middle of somebody's evaluation.
 */
const REFRESH_MARGIN_MS = 120_000;

/**
 * A session's bench-api credential, re-minted as it nears expiry.
 *
 * bench-api's MCP tokens last an hour by design. A session that polls a
 * long evaluation stays alive far longer than that, so exchanging once at
 * connect time and holding the result strands the session the moment the
 * token lapses — every later call comes back unauthorized with nothing
 * the user can do but reconnect.
 *
 * The client already holds a fresh access token: it refreshes with the
 * authorization server on its own schedule and sends the current one on
 * every request. `observe` takes that token as it goes past, and it is
 * what a renewal is minted from.
 */
export class RefreshingCredential {
  private token: string;
  private refreshAt: number;
  private accessToken: string;
  /** Deduplicates concurrent renewals; a session can have calls in flight. */
  private inflight: Promise<string> | undefined;

  constructor(
    private readonly deps: {
      verifier: TokenVerifier;
      baseUrl: string;
      fetchImpl: typeof fetch;
      /** The subject a renewal must still belong to. */
      subject: string;
      /** Called after a successful re-mint, for counting and logging. */
      onRenewed?: () => void;
    },
    accessToken: string,
    initial: BenchToken,
  ) {
    this.accessToken = accessToken;
    this.token = initial.token;
    this.refreshAt = nextRefresh(initial.expiresIn);
  }

  /**
   * Records the access token carried by a live request on this session.
   *
   * Ignores a Bench API key: those are a different credential entirely
   * and cannot be exchanged, and accepting one here would replace a
   * usable access token with something a renewal could not use.
   */
  observe(accessToken: string): void {
    if (accessToken.startsWith(API_KEY_PREFIX)) return;
    this.accessToken = accessToken;
  }

  /** True when the token is close enough to expiry to be worth renewing. */
  get isDue(): boolean {
    return Date.now() >= this.refreshAt;
  }

  /**
   * The credential for one request. Renews if due, sharing a single
   * in-flight renewal between concurrent calls.
   */
  async get(): Promise<string> {
    if (!this.isDue) return this.token;
    this.inflight ??= this.renew().finally(() => {
      this.inflight = undefined;
    });
    return this.inflight;
  }

  private async renew(): Promise<string> {
    let verified;
    try {
      verified = await this.deps.verifier.verify(this.accessToken);
    } catch {
      // The access token this session has been presenting is no longer
      // usable. The client can fix that — it holds a refresh token — but
      // only if it is told to, which is what the 401 carrying this is
      // for.
      throw new CredentialRefreshError(
        "reauthenticate",
        "Your Bench sign-in needs renewing. Reconnect the Bench connector if this persists.",
      );
    }

    // A session is bound to the person who opened it. Renewing from a
    // token for anyone else would silently re-key it to a different
    // account, which is the one thing a session must never do.
    if (verified.subject !== this.deps.subject) {
      throw new CredentialRefreshError(
        "reauthenticate",
        "This session belongs to a different Bench account. Reconnect to continue.",
      );
    }

    let minted: BenchToken;
    try {
      minted = await exchangeForBenchToken(
        this.deps.baseUrl,
        this.accessToken,
        this.deps.fetchImpl,
      );
    } catch (error) {
      // Authenticated, but no longer entitled — a plan lapsed mid-session,
      // say. Signing in again cannot fix that, so it must not be reported
      // as an authentication problem.
      throw new CredentialRefreshError(
        "forbidden",
        error instanceof Error ? error.message : "could not renew authorization with Bench",
      );
    }

    this.token = minted.token;
    this.refreshAt = nextRefresh(minted.expiresIn);
    this.deps.onRenewed?.();
    return this.token;
  }
}

/**
 * A renewal that failed, and whether the client can do anything about it.
 *
 * "reauthenticate" becomes a 401: the client holds a refresh token and
 * will use it when challenged, then retry — so the session heals itself
 * without the user touching anything. "forbidden" becomes a 403, because
 * signing in again would change nothing.
 */
export class CredentialRefreshError extends Error {
  constructor(
    readonly kind: "reauthenticate" | "forbidden",
    message: string,
  ) {
    super(message);
    this.name = "CredentialRefreshError";
  }
}

/**
 * When to renew a token that lasts `expiresIn` seconds. The half-life
 * floor keeps a token shorter than the margin from being renewed on every
 * single call.
 */
function nextRefresh(expiresIn: number): number {
  const lifetimeMs = expiresIn * 1000;
  return Date.now() + Math.max(lifetimeMs - REFRESH_MARGIN_MS, lifetimeMs / 2);
}
