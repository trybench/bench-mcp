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
      "Open a pull request applying an optimized prompt to the repository. Take the winning prompt from bench_get_optimization and write it back to the file the call site lives in.\n\nOnly works for connected repositories — uploaded prompt sets have no repository to open a PR against, so show the user the optimized prompt instead.",
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
