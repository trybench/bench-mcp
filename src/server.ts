import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { BenchClient } from "./client/http.js";
import { registerConnectTools } from "./tools/connect.js";
import { registerPrTools } from "./tools/pr.js";
import { registerResultTools } from "./tools/results.js";
import { registerRunTools } from "./tools/runs.js";
import { registerScanTools } from "./tools/scan.js";
import type { ToolContext } from "./tools/register.js";

export interface CreateServerOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Builds the MCP server with every tool registered.
 *
 * The instructions below are what an MCP client shows the model as
 * standing context for this server. They exist mainly to encode the
 * review gate: a run pauses unconditionally partway through, and a model
 * that does not know that will start an evaluation and then wait for a
 * result that never arrives.
 */
export function createServer(opts: CreateServerOptions): McpServer {
  const server = new McpServer(
    { name: "bench-mcp", version: "0.1.0" },
    {
      instructions: [
        "Bench evaluates and optimizes LLM prompts: it finds the prompts in a codebase, works out what good output means for each one, scores the current prompt, then searches for a better prompt and model.",
        "",
        "The usual sequence:",
        "1. bench_scan_repo (or bench_upload_prompts) to find the call sites.",
        "2. bench_get_scan to choose which call site to evaluate.",
        "3. bench_start_evaluation with generate_context: true.",
        "4. Poll bench_get_evaluation. It WILL pause at status \"awaiting_review\".",
        "5. Read the test cases with bench_get_eval_benchmark, then call bench_submit_run_review. The run cannot finish until you do — it fails after 48 hours unreviewed.",
        "6. Poll until \"succeeded\", then read bench_get_baseline, bench_get_optimization and bench_get_recommendation.",
        "7. Optionally bench_open_prompt_pr to apply the winning prompt.",
        "",
        "Evaluations cost money and consume the account's monthly balance, so confirm with the user before starting one. Reading results is always free.",
      ].join("\n"),
    },
  );

  const context: ToolContext = {
    client: new BenchClient({
      baseUrl: opts.baseUrl,
      apiKey: opts.apiKey,
      ...(opts.timeoutMs !== undefined ? { timeoutMs: opts.timeoutMs } : {}),
      ...(opts.fetchImpl !== undefined ? { fetchImpl: opts.fetchImpl } : {}),
    }),
  };

  registerConnectTools(server, context);
  registerScanTools(server, context);
  registerRunTools(server, context);
  registerResultTools(server, context);
  registerPrTools(server, context);

  return server;
}
