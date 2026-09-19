import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  repoBranchCallSite,
  rerunEvaluationInput,
  runIdInput,
  startEvaluationInput,
  submitReviewInput,
} from "../schemas.js";
import { registerTool, type ToolContext } from "./register.js";

/** Background runs proceed directly; the review tool supports legacy paused runs. */
export function registerRunTools(server: McpServer, context: ToolContext): void {
  registerTool(server, context, {
    name: "bench_start_evaluation",
    title: "Start an evaluation",
    description:
      "Evaluate and optimize extracted prompts in the background. Returns run IDs immediately. No rubric review is required. Pass ai_system_id to pin its context and prompt-specific golden cases and criteria. Check bench_evaluation_allowance and confirm spending first. Each fresh baseline consumes one evaluation. Poll bench_get_evaluation, then read bench_get_evaluation_artifacts.",
    inputSchema: startEvaluationInput,
    handler: async (args, ctx) =>
      ctx.client.request("/api/evaluation-runs", {
        method: "POST",
        body: {
          ai_system_id: args.ai_system_id,
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
      "Return one run\'s status, stage and scores. Poll queued or running runs. Terminal statuses are \"completed\", \"failed\" and \"canceled\". Only legacy runs may report awaiting_review.",
    inputSchema: runIdInput,
    readOnly: true,
    handler: async (args, ctx) => ctx.client.request(`/api/evaluation-runs/${args.run_id as number}`),
  });

  registerTool(server, context, {
    name: "bench_list_evaluations",
    title: "List evaluation runs",
    description:
      "List recent evaluation runs with their status and headline scores. Use this to find a run whose id you do not have; use bench_get_evaluation to follow one you do.",
    inputSchema: { ai_system_id: z.number().int().positive().optional() },
    readOnly: true,
    handler: async (args, ctx) => ctx.client.request("/api/evaluation-runs", { query: { ai_system_id: args.ai_system_id as number | undefined } }),
  });

  registerTool(server, context, {
    name: "bench_get_eval_benchmark",
    title: "Get the rubric and test cases",
    description:
      "Return the latest scoring rubric and generated cases for a call site. For a particular historical run use bench_get_evaluation_artifacts. New runs do not require pre-scoring review.",
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
      "Release a run waiting at \"awaiting_review\" by submitting the test cases it should score against. Pass them back from bench_get_eval_benchmark ; unchanged to accept them, or edited and filtered to improve them. The run resumes into scoring as soon as this returns.",
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
      "Re-score a prompt against the latest scan of its repository ; the loop after you act on a recommendation. Push the change first: this reads the repository, not your working copy, so re-scan with bench_scan_repo before re-running.\n\nChanged stages run again. A reused baseline consumes no additional evaluation, but starting any new run requires available allowance. New runs proceed without mandatory rubric review. Read bench_evaluation_allowance first and confirm any new spend.",
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
