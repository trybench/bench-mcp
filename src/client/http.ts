/**
 * The bench-api HTTP client.
 *
 * bench-mcp holds no policy of its own: plan gating, token consumption,
 * org scoping and a key's own limits all live in bench-api, and every
 * tool call goes through the same REST endpoints bench-web uses. This
 * module's whole job is to attach the API key, and to turn bench-api's
 * structured errors into messages an agent can act on rather than retry
 * into.
 */

/** The shape bench-api's apierror package writes for every failure. */
interface BenchApiErrorBody {
  error?: { code?: string; message?: string; reference?: string; [key: string]: unknown };
  code?: string;
  message?: string;
}

/**
 * An error carrying bench-api's own error code, so callers can branch on
 * the cause rather than string-matching a message.
 */
export class BenchApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "BenchApiError";
  }

  /**
   * True when retrying cannot help: the account needs a plan, the balance
   * is spent, or the key is not allowed here. An agent should surface
   * these to the user instead of calling the tool again.
   */
  get isTerminal(): boolean {
    return [
      "no_active_plan",
      "evaluations_exhausted",
      "test_case_limit_exceeded",
      "key_evaluations_exhausted",
      "upgrade_required",
      "growth_required",
      "context_changed",
      "free_plan_single_prompt",
      "session_required",
      "account_authorization_required",
      "source_authorization_required",
      "artifact_scope_unverified",
      "repo_not_allowed",
      "key_revoked",
      "unauthorized",
    ].includes(this.code);
  }
}

/**
 * How this client's credential was obtained, which decides what an
 * expired one means. An API key is a fixed string the user pasted; an
 * OAuth credential is minted per session and refreshed underneath, so the
 * two failure modes need different remedies.
 */
export type AuthMode = "api_key" | "oauth";

/**
 * The credential to send. A plain string for a fixed key; a function when
 * the credential is short-lived and the caller re-mints it — it is
 * awaited per request, so the caller controls caching and expiry.
 */
export type CredentialSource = string | (() => Promise<string>);

export interface BenchClientOptions {
  baseUrl: string;
  apiKey: CredentialSource;
  timeoutMs?: number;
  authMode?: AuthMode;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Query parameters; entries with undefined values are dropped. */
  query?: Record<string, string | number | undefined>;
  /** JSON request body. Mutually exclusive with `form`. */
  body?: unknown;
  /** Multipart body, for the prompt-upload endpoint. */
  form?: FormData;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 120_000;

export class BenchClient {
  private readonly baseUrl: string;
  private readonly apiKey: CredentialSource;
  private readonly authMode: AuthMode;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: BenchClientOptions) {
    // Trailing slashes would produce "//api/..." paths that some proxies
    // normalize and others don't.
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.apiKey = opts.apiKey;
    this.authMode = opts.authMode ?? "api_key";
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  }

  /** Performs the request and hands back the raw Response, for callers
   * that need to read a stream rather than a parsed body. Errors are
   * still translated, so a failure before streaming starts behaves
   * exactly like any other request. */
  async stream(path: string, opts: RequestOptions = {}): Promise<Response> {
    return this.send(path, opts);
  }

  async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const response = await this.send(path, opts);
    if (response.status === 204) return undefined as T;
    if (response.headers.get("content-type")?.includes("ndjson")) {
      const events = (await response.text()).split("\n").filter(line => line.trim()).map(line => JSON.parse(line) as Record<string, unknown>);
      const failed = events.find(event => event.type === "error");
      if (failed) throw new BenchApiError(200, String(failed.code ?? "stream_error"), String(failed.message ?? failed.error ?? "The operation failed."));
      return events as T;
    }
    return (await response.json()) as T;
  }

  /**
   * Resolves the bearer token for one request.
   *
   * A hosted session's Bench token is short-lived, so it cannot be read
   * once and kept: a session that outlives it — polling a long
   * evaluation, say — would send an expired token on every later call.
   * Resolving per request lets the caller re-mint transparently.
   */
  private async credential(): Promise<string> {
    return typeof this.apiKey === "string" ? this.apiKey : this.apiKey();
  }

  private async send(path: string, opts: RequestOptions = {}): Promise<Response> {
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(opts.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${await this.credential()}`,
      Accept: "application/json",
    };
    // FormData must set its own multipart boundary, so only JSON bodies
    // declare a content type here.
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";

    // A caller-supplied signal and the timeout both need to abort the
    // request, so combine rather than choosing one.
    const timeout = AbortSignal.timeout(this.timeoutMs);
    const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;

    const init: RequestInit = {
      method: opts.method ?? "GET",
      headers,
      signal,
      redirect: "error",
    };
    const payload = opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined);
    if (payload !== undefined) init.body = payload;

    let response: Response;
    try {
      response = await this.fetchImpl(url, init);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "TimeoutError") {
        throw new BenchApiError(
          0,
          "timeout",
          `bench-api did not respond within ${this.timeoutMs / 1000}s. Long stages run in the background — start an evaluation and poll it instead.`,
        );
      }
      throw new BenchApiError(
        0,
        "network_error",
        `could not reach bench-api at ${this.baseUrl}: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    }

    if (!response.ok) throw await this.toError(response);

    return response;
  }

  /**
   * Reads bench-api's error body. Its plan-limit messages are written to
   * be customer-facing, so they are passed through verbatim rather than
   * reworded — bench-mcp has no detail to add that bench-api didn't
   * already have.
   */
  private async toError(response: Response): Promise<BenchApiError> {
    let body: BenchApiErrorBody = {};
    try {
      body = (await response.json()) as BenchApiErrorBody;
    } catch {
      // A non-JSON body (a proxy's HTML 502, say) is still a real failure.
    }

    const code = body.error?.code ?? body.code ?? `http_${response.status}`;
    const message = body.error?.message ?? body.message ?? response.statusText;

    const reference = body.error?.reference;
    const explanation = this.explain(code, message);
    const publicMessage = reference && /^BENCH-[A-Za-z0-9-]{1,80}$/.test(reference)
      ? `${explanation} Error code: ${reference}.`
      : explanation;
    const links = [body.error?.pricing_url ? `Pricing: ${body.error.pricing_url}` : "", body.error?.upgrade_url ? `Upgrade in Bench: ${body.error.upgrade_url}` : "", body.error?.manage_key_url ? `Manage key: ${body.error.manage_key_url}` : ""].filter(Boolean).join("\n");
    return new BenchApiError(response.status, code, links ? `${publicMessage}\n${links}` : publicMessage, body.error ?? {});
  }

  /**
   * Adds the next action to the errors where bench-api states the problem
   * but not the remedy — an agent that knows what to do next won't retry
   * a call that can never succeed.
   */
  private explain(code: string, message: string): string {
    switch (code) {
      case "unauthorized":
        return this.authMode === "oauth"
          ? `${message}. Reconnect the Bench connector to sign in again.`
          : `${message}. Check BENCH_API_KEY — generate a key in Bench account settings.`;
      case "key_revoked":
        return `${message}. Generate a new key in Bench account settings.`;
      case "no_active_plan":
      case "evaluations_exhausted":
      case "test_case_limit_exceeded":
      case "upgrade_required":
      case "growth_required":
        return `${message} Call bench_evaluation_allowance for the current limit and upgrade URL. Use the authenticated billing tools to get a checkout or upgrade link after user approval. MCP connection itself is free.`;
      case "key_evaluations_exhausted":
        return `${message} Ask the key owner to review its cap in Bench MCP settings. A plan upgrade does not change an API key cap.`;
      case "context_changed":
        return `${message} Re-read bench_get_system_context and reconcile changes before writing again.`;
      case "repo_not_allowed":
        return `${message}. This key was minted for specific repositories only.`;
      case "session_required":
      case "account_authorization_required":
        return `${message}. Reconnect Bench using OAuth for account management; a scoped API key cannot gain that authority.`;
      case "source_authorization_required":
        return `${message}. Read bench_get_processing_notice, obtain user authorization, then call bench_acknowledge_processing for this source.`;
      case "installation_not_found":
        return `${message}. Connect a GitHub account in Bench first, or use bench_upload_prompts instead.`;
      case "scan_not_found":
        return `${message}. Call bench_scan_repo for this repo and branch first.`;
      default:
        return message;
    }
  }
}
