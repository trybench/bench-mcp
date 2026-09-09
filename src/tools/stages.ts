import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { consumeNdjson } from "../client/ndjson.js";
import {
  generateBenchmarkInput,
  generateContextInput,
  repoBranch,
  websiteTextInput,
} from "../schemas.js";
import { registerTool, type ToolContext } from "./register.js";

/**
 * Per-stage tools, for driving the pipeline one step at a time rather
 * than through an orchestrated run.
 *
 * The orchestrated run remains the right default — it is one call, it
 * handles ordering, and it is what bench-web itself drives. These exist
 * for the cases it cannot serve: inspecting a business context before
 * committing to an evaluation, regenerating one after the business has
 * changed, or rebuilding a benchmark without re-scoring anything.
 */
export function registerStageTools(server: McpServer, context: ToolContext): void {
  const repoPath = (args: Record<string, unknown>, suffix: string): string =>
    `/api/repos/${encodeURIComponent(args.owner as string)}/${encodeURIComponent(args.repo as string)}/${suffix}`;

  registerTool(server, context, {
    name: "bench_generate_business_context",
    title: "Generate the business context",
    description:
      "Work out what the product does and who it serves, from the prompts in a scan — the grounding every later stage scores against. Requires a scan to exist first.\n\nUsually unnecessary: bench_start_evaluation generates this inside the run when generate_context is true. Reach for it to inspect or correct the context before committing to an evaluation, or to regenerate it after the business has changed.\n\nOptionally takes a plain-text description to ground the result; without one it infers everything from the prompts.",
    inputSchema: generateContextInput,
    handler: async (args, ctx) =>
      ctx.client.request(repoPath(args, "business-context"), {
        method: "POST",
        query: { branch: args.branch as string },
        body: { business_doc_text: args.business_doc_text ?? "" },
      }),
  });

  registerTool(server, context, {
    name: "bench_get_business_context",
    title: "Get the business context",
    description:
      "Return the stored business context for a repository branch. Its `reused` field tells you whether it came from cache or a fresh generation.",
    inputSchema: repoBranch,
    readOnly: true,
    handler: async (args, ctx) =>
      ctx.client.request(repoPath(args, "business-context/latest"), {
        query: { branch: args.branch as string },
      }),
  });

  registerTool(server, context, {
    name: "bench_fetch_website_text",
    title: "Read a web page as text",
    description:
      "Fetch a page's readable text, to feed bench_generate_business_context as business_doc_text. Lets the context come from a real product page rather than from the prompts alone.",
    inputSchema: websiteTextInput,
    handler: async (args, ctx) =>
      ctx.client.request("/api/website-text", {
        method: "POST",
        body: { url: args.url },
      }),
  });

  registerTool(server, context, {
    name: "bench_generate_eval_benchmark",
    title: "Generate the rubric and test cases",
    description:
      "Derive what good output means for one call site — a graded rubric, how each criterion is scored, and a suite of test cases. Requires a scan and a business context to exist first.\n\nUsually unnecessary: bench_start_evaluation does this as its first stage. Reach for it to review or rebuild a benchmark without scoring anything against it, which costs no evaluation.\n\nThis is the slowest stage; the rubric is derived before the test cases, and only the finished benchmark is returned.",
    inputSchema: generateBenchmarkInput,
    handler: async (args, ctx) => {
      const response = await ctx.client.stream(repoPath(args, "eval-benchmark"), {
        method: "POST",
        query: {
          branch: args.branch as string,
          call_site_id: args.call_site_id as string,
        },
        body: {
          previous_routing_json: args.previous_routing_json ?? "",
          suite_name: args.suite_name ?? "",
          reference_today: args.reference_today ?? "",
        },
      });

      // Streams "rubric", then "scoring", then "done" carrying the
      // persisted row. A tool call returns once, so the intermediate
      // parts are dropped and the finished benchmark returned.
      return consumeNdjson(response, {
        isFinal: (event) => event.part === "done",
        select: (event) => event.final ?? event,
      });
    },
  });

}
