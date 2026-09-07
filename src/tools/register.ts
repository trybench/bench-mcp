import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { BenchApiError, type BenchClient } from "../client/http.js";
import type { ZodRawShape } from "../schemas.js";

/** Everything a tool handler needs. */
export interface ToolContext {
  client: BenchClient;
}

/**
 * Registers one tool, wrapping the handler so a bench-api failure becomes
 * a tool error the model can read rather than an unhandled rejection.
 *
 * Results are returned as pretty-printed JSON text. The pipeline's
 * artifacts (rubrics, scored cases, candidate comparisons) are deeply
 * nested and there is no useful lossy summary of them — the caller is a
 * model that can read the structure directly.
 */
export function registerTool(
  server: McpServer,
  context: ToolContext,
  definition: {
    name: string;
    title: string;
    description: string;
    inputSchema: ZodRawShape;
    /** Marks a tool that only reads, so clients can auto-approve it. */
    readOnly?: boolean;
    handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
  },
): void {
  server.registerTool(
    definition.name,
    {
      title: definition.title,
      description: definition.description,
      inputSchema: definition.inputSchema,
      annotations: {
        readOnlyHint: definition.readOnly ?? false,
        // Nothing here destroys data; the worst case is spending an
        // evaluation from the plan's balance.
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (args: Record<string, unknown>): Promise<CallToolResult> => {
      try {
        const result = await definition.handler(args, context);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: describeError(error) }],
        };
      }
    },
  );
}

/**
 * Turns an error into something worth showing a model. A terminal
 * bench-api error says so explicitly, because the useful next step is to
 * tell the user rather than call the tool again.
 */
function describeError(error: unknown): string {
  if (error instanceof BenchApiError) {
    return error.isTerminal
      ? `${error.message}\n\nThis will not succeed on retry — tell the user what needs to change.`
      : error.message;
  }
  return error instanceof Error ? error.message : String(error);
}
