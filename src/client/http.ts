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
  error?: { code?: string; message?: string };
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
      "free_plan_single_prompt",
      "session_required",
      "repo_not_allowed",
      "key_revoked",
      "unauthorized",
    ].includes(this.code);
  }
}

export interface BenchClientOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
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
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: BenchClientOptions) {
    // Trailing slashes would produce "//api/..." paths that some proxies
    // normalize and others don't.
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.apiKey = opts.apiKey;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  }

  async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(opts.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
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

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
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

    return new BenchApiError(response.status, code, this.explain(code, message));
  }

  /**
   * Adds the next action to the errors where bench-api states the problem
   * but not the remedy — an agent that knows what to do next won't retry
   * a call that can never succeed.
   */
  private explain(code: string, message: string): string {
    switch (code) {
      case "unauthorized":
        return `${message}. Check BENCH_API_KEY — generate a key in Bench account settings.`;
      case "key_revoked":
        return `${message}. Generate a new key in Bench account settings.`;
      case "no_active_plan":
        return `${message}. Subscribe to a plan in Bench to run evaluations.`;
      case "repo_not_allowed":
        return `${message}. This key was minted for specific repositories only.`;
      case "session_required":
        return `${message}. Billing and team membership are managed in the Bench web app.`;
      case "installation_not_found":
        return `${message}. Connect a GitHub account in Bench first, or use bench_upload_prompts instead.`;
      case "scan_not_found":
        return `${message}. Call bench_scan_repo for this repo and branch first.`;
      default:
        return message;
    }
  }
}
