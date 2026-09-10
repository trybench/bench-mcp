import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  noInput,
  repoBranchCallSite,
  rerunEvaluationInput,
  runIdInput,
  startEvaluationInput,
  submitReviewInput,
} from "../schemas.js";
import { registerTool, type ToolContext } from "./register.js";

/**
 * Group C — run. One evaluation covers benchmark, baseline, optimize and
 * recommend.
 *
 * The review gate is the thing to understand here: every run pauses at
 * "awaiting_review" between generating its test cases and scoring against
 * them, unconditionally, and waits up to 48 hours. An agent that starts a
 * run and never reviews it has not run an evaluation — it has parked one.
 * The tool descriptions say so, because the model is the one that has to
 * get this sequence right.
 */
export function registerRunTools(server: McpServer, context: ToolContext): void {
  registerTool(server, context, {
    name: "bench_start_evaluation",
    title: "Start an evaluation",
    description:
      "Evaluate and optimize one or more prompts: generate a rubric and test cases, score the current prompt, then search for a better prompt and model. Returns immediately with run ids — the work continues in the background.\n\nThe run will PAUSE at status \"awaiting_review\" until you call bench_submit_run_review. Poll bench_get_evaluation, read the test cases with bench_get_eval_benchmark, then submit the review. A run left unreviewed fails after 48 hours.\n\nConsumes one evaluation from the plan balance per prompt.",
    inputSchema: startEvaluationInput,
    handler: async (args, ctx) =>
      ctx.client.request("/api/evaluation-runs", {
        method: "POST",
        body: {
          repo_full_name: args.repo_full_name,
          branch: args.branch,
          prompts: args.prompts,
          generate_context: args.generate_context ?? true,
          context_doc: args.context_doc ?? "",
        },
      }),
  });

  registerTool(server, context, {
    name: "bench_get_evaluation",
    title: "Get one evaluation run",
    description:
      "Return one run's current status, stage and scores. This is the polling tool — statuses are \"running\", \"awaiting_review\" (act on it — the run is blocked until you do), and then one of the terminal three: \"completed\", \"failed\" or \"canceled\".",
    inputSchema: runIdInput,
    readOnly: true,
    handler: async (args, ctx) => ctx.client.request(`/api/evaluation-runs/${args.run_id as number}`),
  });

  registerTool(server, context, {
    name: "bench_list_evaluations",
    title: "List evaluation runs",
    description:
      "List recent evaluation runs with their status and headline scores. Use this to find a run whose id you do not have; use bench_get_evaluation to follow one you do.",
    inputSchema: noInput,
    readOnly: true,
    handler: async (_args, ctx) => ctx.client.request("/api/evaluation-runs"),
  });

  registerTool(server, context, {
    name: "bench_get_eval_benchmark",
    title: "Get the rubric and test cases",
    description:
      "Return the scoring rubric and generated test cases for a call site. Read this while a run waits at \"awaiting_review\": the test cases are what the prompt will be scored against, and reviewing them is the point of the pause.",
    inputSchema: repoBranchCallSite,
    readOnly: true,
    handler: async (args, ctx) =>
      ctx.client.request(
        `/api/repos/${encodeURIComponent(args.owner as string)}/${encodeURIComponent(args.repo as string)}/eval-benchmark/latest`,
        { query: { branch: args.branch as string, call_site_id: args.call_site_id as string } },
      ),
  });

  registerTool(server, context, {
    name: "bench_submit_run_review",
    title: "Approve the test cases and continue",
    description:
      "Release a run waiting at \"awaiting_review\" by submitting the test cases it should score against. Pass them back from bench_get_eval_benchmark — unchanged to accept them, or edited and filtered to improve them. The run resumes into scoring as soon as this returns.",
    inputSchema: submitReviewInput,
    handler: async (args, ctx) =>
      ctx.client.request(`/api/evaluation-runs/${args.run_id as number}/review`, {
        method: "POST",
        body: { test_cases: args.test_cases },
      }),
  });

  registerTool(server, context, {
    name: "bench_rerun_evaluation",
    title: "Re-run an evaluation after changing a prompt",
    description:
      "Re-score a prompt against the latest scan of its repository — the loop after you act on a recommendation. Push the change first: this reads the repository, not your working copy, so re-scan with bench_scan_repo before re-running.\n\nOnly the stages your change invalidated actually re-run. An unchanged prompt reuses every stored artifact and finishes in seconds at no cost, so re-running to confirm nothing regressed is cheap.\n\nLike a first run, this pauses at \"awaiting_review\" and needs bench_submit_run_review before it can finish.",
    inputSchema: rerunEvaluationInput,
    handler: async (args, ctx) =>
      ctx.client.request(`/api/evaluation-runs/${args.run_id as number}/rerun`, {
        method: "POST",
        body: {
          single_prompt: args.single_prompt ?? true,
          generate_context: args.generate_context ?? false,
          context_doc: args.context_doc ?? "",
        },
      }),
  });

  registerTool(server, context, {
    name: "bench_cancel_evaluation",
    title: "Cancel an evaluation run",
    description:
      "Stop a run that is running or waiting for review. Also the way out of a review gate the user decides against, rather than leaving it to time out.",
    inputSchema: runIdInput,
    handler: async (args, ctx) =>
      ctx.client.request(`/api/evaluation-runs/${args.run_id as number}/cancel`, { method: "POST" }),
  });
}
