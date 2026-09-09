import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeEach, describe, expect, it } from "vitest";

import { createServer } from "../src/server.js";

/**
 * A stub bench-api. Each test declares the responses it wants; anything
 * unexpected fails loudly rather than returning a default, so a tool
 * calling the wrong endpoint shows up as a test failure.
 */
class StubApi {
  readonly calls: Array<{ method: string; url: string; body: string | null; auth: string | null }> = [];
  private routes = new Map<string, { status: number; body: unknown }>();

  on(method: string, path: string, body: unknown, status = 200): this {
    this.routes.set(`${method} ${path}`, { status, body });
    return this;
  }

  readonly fetch: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);

    this.calls.push({
      method,
      url: url.pathname + url.search,
      body: typeof init?.body === "string" ? init.body : null,
      auth: headers.get("Authorization"),
    });

    const route = this.routes.get(`${method} ${url.pathname}`);
    if (!route) {
      return new Response(JSON.stringify({ error: { code: "test_unrouted", message: `no stub for ${method} ${url.pathname}` } }), {
        status: 599,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(route.body), {
      status: route.status,
      headers: { "Content-Type": "application/json" },
    });
  };
}

async function connect(api: StubApi): Promise<Client> {
  const server = createServer({
    baseUrl: "https://api.test.invalid",
    apiKey: "bench_sk_testkey",
    fetchImpl: api.fetch,
  });
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

/** Parses the JSON a tool returned in its text content. */
function resultJson(result: { content: Array<{ type: string; text?: string }> }): unknown {
  const text = result.content.find((c) => c.type === "text")?.text ?? "";
  return JSON.parse(text);
}

function resultText(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content.find((c) => c.type === "text")?.text ?? "";
}

let api: StubApi;

beforeEach(() => {
  api = new StubApi();
});

describe("tool surface", () => {
  // Pins the v1 scope decision: the core loop only. If a per-stage tool
  // gets added back without a deliberate scope change, this fails.
  //
  // Seventeen, not the sixteen originally scoped: adding
  // GET /api/evaluation-runs/{id} to bench-api earned bench_get_evaluation
  // its own tool, where the plan had folded single-run polling into
  // bench_list_evaluations.
  it("exposes exactly the twenty-four agreed tools", async () => {
    const client = await connect(api);
    const { tools } = await client.listTools();

    expect(tools.map((t) => t.name).sort()).toEqual([
      "bench_activate_installation",
      "bench_cancel_evaluation",
      "bench_connect_github",
      "bench_connection_status",
      "bench_fetch_website_text",
      "bench_generate_business_context",
      "bench_generate_eval_benchmark",
      "bench_get_baseline",
      "bench_get_business_context",
      "bench_get_eval_benchmark",
      "bench_get_evaluation",
      "bench_get_optimization",
      "bench_get_recommendation",
      "bench_get_scan",
      "bench_list_branches",
      "bench_list_evaluations",
      "bench_list_repos",
      "bench_open_prompt_pr",
      "bench_rerun_evaluation",
      "bench_scan_repo",
      "bench_start_evaluation",
      "bench_submit_run_review",
      "bench_upload_prompts",
      "bench_whoami",
    ]);
  });

  it("marks read-only tools so clients can auto-approve them", async () => {
    const client = await connect(api);
    const { tools } = await client.listTools();
    const readOnly = tools.filter((t) => t.annotations?.readOnlyHint).map((t) => t.name);

    expect(readOnly).toContain("bench_get_baseline");
    expect(readOnly).toContain("bench_whoami");
    // Anything that spends an evaluation or writes to GitHub must not be
    // auto-approvable.
    expect(readOnly).not.toContain("bench_start_evaluation");
    expect(readOnly).not.toContain("bench_open_prompt_pr");
    expect(readOnly).not.toContain("bench_scan_repo");
  });

  it("tells the model about the review gate in the server instructions", async () => {
    const client = await connect(api);
    // A model that does not know about the pause will start a run and
    // wait forever, so this is load-bearing text, not documentation.
    expect(client.getInstructions()).toContain("awaiting_review");
    expect(client.getInstructions()).toContain("bench_submit_run_review");
  });
});

describe("authentication", () => {
  it("sends the API key as a bearer token on every call", async () => {
    api.on("GET", "/api/auth/me", { email: "user@example.com" });
    const client = await connect(api);

    await client.callTool({ name: "bench_whoami", arguments: {} });

    expect(api.calls[0]?.auth).toBe("Bearer bench_sk_testkey");
  });
});

describe("request shapes", () => {
  it("scans a repo with the branch as a query parameter", async () => {
    api.on("POST", "/api/repos/trybench/bench-api/scan", { repo_full_name: "trybench/bench-api" });
    const client = await connect(api);

    await client.callTool({
      name: "bench_scan_repo",
      arguments: { owner: "trybench", repo: "bench-api", branch: "dev" },
    });

    expect(api.calls[0]).toMatchObject({
      method: "POST",
      url: "/api/repos/trybench/bench-api/scan?branch=dev",
    });
  });

  it("passes branch and call site to stage result reads", async () => {
    api.on("GET", "/api/repos/trybench/bench-api/baseline/latest", { result: {} });
    const client = await connect(api);

    await client.callTool({
      name: "bench_get_baseline",
      arguments: {
        owner: "trybench",
        repo: "bench-api",
        branch: "dev",
        call_site_id: "agents/support.py:120",
      },
    });

    expect(api.calls[0]?.url).toBe(
      "/api/repos/trybench/bench-api/baseline/latest?branch=dev&call_site_id=agents%2Fsupport.py%3A120",
    );
  });

  it("defaults generate_context to true so one call covers the whole pipeline", async () => {
    api.on("POST", "/api/evaluation-runs", { runs: [{ id: 1 }] }, 202);
    const client = await connect(api);

    await client.callTool({
      name: "bench_start_evaluation",
      arguments: {
        repo_full_name: "trybench/bench-api",
        branch: "dev",
        prompts: [{ call_site_id: "agents/support.py:120" }],
      },
    });

    expect(JSON.parse(api.calls[0]?.body ?? "{}")).toMatchObject({ generate_context: true });
  });

  it("reads a single run rather than listing every run", async () => {
    api.on("GET", "/api/evaluation-runs/42", { run: { id: 42, status: "awaiting_review" } });
    const client = await connect(api);

    const result = await client.callTool({ name: "bench_get_evaluation", arguments: { run_id: 42 } });

    expect(api.calls[0]?.url).toBe("/api/evaluation-runs/42");
    expect(resultJson(result as never)).toMatchObject({ run: { status: "awaiting_review" } });
  });

  it("submits reviewed test cases to release the gate", async () => {
    api.on("POST", "/api/evaluation-runs/42/review", { ok: true });
    const client = await connect(api);

    await client.callTool({
      name: "bench_submit_run_review",
      arguments: { run_id: 42, test_cases: [{ input: "hello" }] },
    });

    expect(JSON.parse(api.calls[0]?.body ?? "{}")).toEqual({ test_cases: [{ input: "hello" }] });
  });
});

describe("uploads", () => {
  it("rejects unsupported file types before calling bench-api", async () => {
    const client = await connect(api);

    const result = await client.callTool({
      name: "bench_upload_prompts",
      arguments: { files: [{ path: "prompt.py", content: "SYSTEM = 'hi'" }] },
    });

    expect(result.isError).toBe(true);
    expect(resultText(result as never)).toContain("only .md, .txt, .json, .yaml");
    expect(api.calls).toHaveLength(0);
  });

  it("requires some content", async () => {
    const client = await connect(api);

    const result = await client.callTool({ name: "bench_upload_prompts", arguments: {} });

    expect(result.isError).toBe(true);
    expect(api.calls).toHaveLength(0);
  });

  it("uploads accepted files as multipart", async () => {
    api.on("POST", "/api/prompt-scans", { repo_full_name: "upload/abc123", branch: "prompts" });
    const client = await connect(api);

    const result = await client.callTool({
      name: "bench_upload_prompts",
      arguments: { files: [{ path: "system.md", content: "You are helpful." }], model: "gpt-4o" },
    });

    expect(api.calls[0]?.method).toBe("POST");
    expect(resultJson(result as never)).toMatchObject({ repo_full_name: "upload/abc123" });
  });
});

describe("error translation", () => {
  it("explains an exhausted plan and marks it as not worth retrying", async () => {
    api.on(
      "POST",
      "/api/evaluation-runs",
      { error: { code: "no_active_plan", message: "an active subscription is required" } },
      403,
    );
    const client = await connect(api);

    const result = await client.callTool({
      name: "bench_start_evaluation",
      arguments: {
        repo_full_name: "trybench/bench-api",
        branch: "dev",
        prompts: [{ call_site_id: "a.py:1" }],
      },
    });

    expect(result.isError).toBe(true);
    const text = resultText(result as never);
    expect(text).toContain("an active subscription is required");
    expect(text).toContain("will not succeed on retry");
  });

  it("points at the right recovery for a missing scan", async () => {
    api.on(
      "POST",
      "/api/evaluation-runs",
      { error: { code: "scan_not_found", message: "no stored scan for this repo/branch yet" } },
      404,
    );
    const client = await connect(api);

    const result = await client.callTool({
      name: "bench_start_evaluation",
      arguments: {
        repo_full_name: "trybench/bench-api",
        branch: "dev",
        prompts: [{ call_site_id: "a.py:1" }],
      },
    });

    expect(resultText(result as never)).toContain("bench_scan_repo");
  });

  it("surfaces a key scoped to other repositories", async () => {
    api.on(
      "POST",
      "/api/repos/trybench/bench-web/scan",
      { error: { code: "repo_not_allowed", message: "this API key is not scoped to trybench/bench-web" } },
      403,
    );
    const client = await connect(api);

    const result = await client.callTool({
      name: "bench_scan_repo",
      arguments: { owner: "trybench", repo: "bench-web", branch: "dev" },
    });

    const text = resultText(result as never);
    expect(text).toContain("not scoped to trybench/bench-web");
    expect(text).toContain("will not succeed on retry");
  });

  it("refuses a PR for an uploaded prompt set without calling bench-api", async () => {
    const client = await connect(api);

    const result = await client.callTool({
      name: "bench_open_prompt_pr",
      arguments: {
        owner: "upload",
        repo: "abc123",
        title: "Improve prompt",
        changes: [{ path: "p.md", content: "x" }],
      },
    });

    expect(result.isError).toBe(true);
    expect(resultText(result as never)).toContain("not backed by a repository");
    expect(api.calls).toHaveLength(0);
  });

  it("reports an unreachable bench-api as a network error", async () => {
    const server = createServer({
      baseUrl: "https://api.test.invalid",
      apiKey: "bench_sk_testkey",
      fetchImpl: async () => {
        throw new TypeError("fetch failed");
      },
    });
    const client = new Client({ name: "test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const result = await client.callTool({ name: "bench_whoami", arguments: {} });

    expect(result.isError).toBe(true);
    expect(resultText(result as never)).toContain("could not reach bench-api");
  });
});

describe("connecting GitHub", () => {
  // A disconnected account used to be a dead end: the agent could report
  // "not connected" but had nothing to offer next.
  it("hands back the install link so a disconnected account has a next step", async () => {
    api.on("GET", "/api/github/install-url", {
      url: "https://github.com/apps/bench-staging/installations/new",
    });
    const client = await connect(api);

    const result = await client.callTool({ name: "bench_connect_github", arguments: {} });

    expect(api.calls[0]?.url).toBe("/api/github/install-url");
    expect(resultJson(result as never)).toMatchObject({
      url: "https://github.com/apps/bench-staging/installations/new",
    });
  });
})

describe("switching GitHub account", () => {
  // Someone with a personal account and an organization has two
  // installations, and only the active one is visible to scans. Without
  // this, a repo that exists and is granted simply never appears, with no
  // way to fix it from the editor.
  it("activates a different installation", async () => {
    api.on("POST", "/api/github/installations/987/activate", { status: "connected" });
    const client = await connect(api);

    const result = await client.callTool({
      name: "bench_activate_installation",
      arguments: { installation_id: 987 },
    });

    expect(api.calls[0]).toMatchObject({
      method: "POST",
      url: "/api/github/installations/987/activate",
    });
    expect(result.isError).toBeFalsy();
  });
})

describe("run status vocabulary", () => {
  // A run ends as "completed". An earlier version of these descriptions
  // said "succeeded", a status bench-api never emits — an agent following
  // that guidance polls until the 48-hour review timeout instead of
  // reading the results. Caught during the first real staging run.
  it("never tells the agent to wait for a status bench-api does not emit", async () => {
    const client = await connect(api);
    const { tools } = await client.listTools();

    const surface = [
      client.getInstructions() ?? "",
      ...tools.map((t) => `${t.description ?? ""} ${t.title ?? ""}`),
    ].join("\n");

    expect(surface).not.toMatch(/"succeeded"/);
    expect(surface).toContain('"completed"');
  });
})

describe("re-running an evaluation", () => {
  // The actual loop: act on a recommendation, then re-bench. Without this
  // an agent could evaluate a prompt but never verify its own fix.
  it("re-runs a single prompt by default", async () => {
    api.on("POST", "/api/evaluation-runs/42/rerun", { runs: [{ id: 43 }] }, 202);
    const client = await connect(api);

    await client.callTool({ name: "bench_rerun_evaluation", arguments: { run_id: 42 } });

    expect(api.calls[0]?.url).toBe("/api/evaluation-runs/42/rerun");
    // Defaulting to the whole group would silently spend an evaluation
    // per prompt when the user asked about one.
    expect(JSON.parse(api.calls[0]?.body ?? "{}")).toMatchObject({ single_prompt: true });
  });

  it("can re-run the whole benching session", async () => {
    api.on("POST", "/api/evaluation-runs/42/rerun", { runs: [] }, 202);
    const client = await connect(api);

    await client.callTool({
      name: "bench_rerun_evaluation",
      arguments: { run_id: 42, single_prompt: false },
    });

    expect(JSON.parse(api.calls[0]?.body ?? "{}")).toMatchObject({ single_prompt: false });
  });

  it("can regenerate the business context, for a run cancelled before one was stored", async () => {
    api.on("POST", "/api/evaluation-runs/42/rerun", { runs: [] }, 202);
    const client = await connect(api);

    await client.callTool({
      name: "bench_rerun_evaluation",
      arguments: { run_id: 42, generate_context: true, context_doc: "We sell boots." },
    });

    expect(JSON.parse(api.calls[0]?.body ?? "{}")).toMatchObject({
      generate_context: true,
      context_doc: "We sell boots.",
    });
  });
})


describe("per-stage tools", () => {
  it("generates a business context for a repo branch", async () => {
    api.on("POST", "/api/repos/trybench/bench-api/business-context", { result: {}, reused: false });
    const client = await connect(api);

    await client.callTool({
      name: "bench_generate_business_context",
      arguments: { owner: "trybench", repo: "bench-api", branch: "dev", business_doc_text: "We sell boots." },
    });

    expect(api.calls[0]?.url).toBe("/api/repos/trybench/bench-api/business-context?branch=dev");
    expect(JSON.parse(api.calls[0]?.body ?? "{}")).toEqual({ business_doc_text: "We sell boots." });
  });

  it("reads a stored business context", async () => {
    api.on("GET", "/api/repos/trybench/bench-api/business-context/latest", { reused: true });
    const client = await connect(api);

    await client.callTool({
      name: "bench_get_business_context",
      arguments: { owner: "trybench", repo: "bench-api", branch: "dev" },
    });

    expect(api.calls[0]?.url).toBe("/api/repos/trybench/bench-api/business-context/latest?branch=dev");
  });

  it("fetches page text to ground a context", async () => {
    api.on("POST", "/api/website-text", { text: "We sell boots." });
    const client = await connect(api);

    await client.callTool({
      name: "bench_fetch_website_text",
      arguments: { url: "https://example.com/about" },
    });

    expect(JSON.parse(api.calls[0]?.body ?? "{}")).toEqual({ url: "https://example.com/about" });
  });
});
