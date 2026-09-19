import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { openPromptPrInput } from "../schemas.js";
import { registerTool, type ToolContext } from "./register.js";

/**
 * Group E — apply. The payoff: without this, an agent finds a better
 * prompt and then has to send the user to the web app to act on it.
 */
export function registerPrTools(server: McpServer, context: ToolContext): void {
  registerTool(server, context, {
    name: "bench_open_prompt_pr",
    title: "Open a pull request with the improved prompt",
    description:
      "Publish supplied file changes to a GitHub branch and open a pull request. This is an external write: obtain explicit approval first; never call during local-only review. This endpoint does not run tests or validate code. Read bench_get_fix_brief and independently validate any code edits first. Preserve complete file contents and verify the base has not changed. Only connected repositories are supported; for uploaded prompts show the proposed prompt instead. Never call a published proposal a deployed or verified production fix.",
    inputSchema: openPromptPrInput,
    handler: async (args, ctx) => {
      if ((args.owner as string) === "upload") {
        throw new Error(
          "Uploaded prompt sets are not backed by a repository. Show the user the optimized prompt from bench_get_optimization instead.",
        );
      }

      return ctx.client.request(
        `/api/repos/${encodeURIComponent(args.owner as string)}/${encodeURIComponent(args.repo as string)}/prompt-pr`,
        {
          method: "POST",
          body: {
            branch: args.branch_name ?? "",
            base_branch: args.base_branch ?? "",
            title: args.title,
            body: args.body ?? "",
            changes: args.changes,
          },
        },
      );
    },
  });
}
