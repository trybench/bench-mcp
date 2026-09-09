import { createRemoteJWKSet, jwtVerify } from "jose";

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

/** The RFC 9728 document. Clients read this to find the authorization
 * server, so its shape is a contract, not an implementation detail. */
export function protectedResourceMetadata(config: OAuthConfig): Record<string, unknown> {
  return {
    resource: config.resourceUrl,
    authorization_servers: [config.authkitDomain],
    bearer_methods_supported: ["header"],
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
  return `Bearer error="unauthorized", resource_metadata="${config.resourceUrl}${PROTECTED_RESOURCE_PATH}"`;
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
 * Exchanged once per session and held only in that session's memory,
 * alongside the server it belongs to.
 */
export async function exchangeForBenchToken(
  baseUrl: string,
  accessToken: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<string> {
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

  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error("token exchange returned no token");
  return body.token;
}
