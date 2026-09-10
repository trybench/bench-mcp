import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { repoBranchCallSite } from "../schemas.js";
import { registerTool, type ToolContext } from "./register.js";

/**
 * Group D — results. All read-only, none gated: the detail behind the
 * headline numbers a run reports.
 */
export function registerResultTools(server: McpServer, context: ToolContext): void {
  const stageResult = (
    name: string,
    title: string,
    description: string,
    path: string,
  ): void => {
    registerTool(server, context, {
      name,
      title,
      description,
      inputSchema: repoBranchCallSite,
      readOnly: true,
      handler: async (args, ctx) =>
        ctx.client.request(
          `/api/repos/${encodeURIComponent(args.owner as string)}/${encodeURIComponent(args.repo as string)}/${path}`,
          { query: { branch: args.branch as string, call_site_id: args.call_site_id as string } },
        ),
    });
  };

  stageResult(
    "bench_get_baseline",
    "Get baseline scores",
    "Return how the current prompt scored: overall quality, per-case results and projected cost per run. This is the 'before' half of any comparison.\n\nCheck the run's own health before quoting the score. `model_substituted` with `model_used` means the call site declared no model and was scored against a default, so the number is not for the model in production. `unscored_count` and `case_errors` mean cases that never scored. `fallback_notes` and `judge_audit` report where the harness had to compensate or where its judges disagreed. Say so when any of these are set, rather than reporting the score alone.",
    "baseline/latest",
  );

  stageResult(
    "bench_get_optimization",
    "Get optimization results",
    "Return what the search found: the prompt and model candidates tested, their scores and costs, and the recommended combination. This is the 'after' half, and the source of the prompt to apply.",
    "search-optimize/latest",
  );

  stageResult(
    "bench_get_recommendation",
    "Get the recommendation",
    "Return Bench's recommendation for a call site — a qualifying prompt and model change, an incremental win, or the baseline's weak points when nothing beat it. Produced as part of an evaluation run; there is no way to trigger it separately.",
    "recommend/latest",
  );
}
