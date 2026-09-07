import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { listBranchesInput, noInput } from "../schemas.js";
import { registerTool, type ToolContext } from "./register.js";

/**
 * Group A — connect. None of these consume tokens; they exist so an agent
 * can resolve what the user said into the identifiers the pipeline needs,
 * and diagnose the two failures that block everything else (no plan, no
 * GitHub connection).
 */
export function registerConnectTools(server: McpServer, context: ToolContext): void {
  registerTool(server, context, {
    name: "bench_whoami",
    title: "Bench account status",
    description:
      "Show the signed-in Bench account: plan, subscription status and how many evaluations remain this month. Call this when a run fails on plan or balance, before retrying anything.",
    inputSchema: noInput,
    readOnly: true,
    handler: async (_args, ctx) => ctx.client.request("/api/auth/me"),
  });

  registerTool(server, context, {
    name: "bench_connection_status",
    title: "GitHub connection status",
    description:
      "Show which GitHub accounts are connected to Bench and which one is active. Call this when a scan fails because no installation was found.",
    inputSchema: noInput,
    readOnly: true,
    handler: async (_args, ctx) => ctx.client.request("/api/github/status"),
  });

  registerTool(server, context, {
    name: "bench_list_repos",
    title: "List repositories",
    description:
      "List the repositories Bench can reach through the active GitHub connection. Use this to resolve a repository the user named in prose into an owner and name.",
    inputSchema: noInput,
    readOnly: true,
    handler: async (_args, ctx) => ctx.client.request("/api/github/repos"),
  });

  registerTool(server, context, {
    name: "bench_list_branches",
    title: "List branches",
    description:
      "List a repository's branches. Every scan and result is stored per branch, so pick one before scanning rather than assuming the default.",
    inputSchema: listBranchesInput,
    readOnly: true,
    handler: async (args, ctx) =>
      ctx.client.request(
        `/api/github/repos/${encodeURIComponent(args.owner as string)}/${encodeURIComponent(args.repo as string)}/branches`,
      ),
  });
}
