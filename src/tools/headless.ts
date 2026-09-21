import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { operationCatalog } from "../operations.js";
import { registerTool, type ToolContext } from "./register.js";

type Schema = Record<string, unknown>;
interface Operation {
  id: string; method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; path: string;
  description: string; auth: string; read_only: boolean; mcp: boolean; mcp_legacy: boolean;
  path_parameters: Record<string, Schema>; query: Schema; body?: Schema | null;
  multipart?: boolean; form?: Schema; file_field?: string; max_file_bytes?: number;
}
const segment = z.union([z.string().min(1), z.number().int().positive()]).refine(
  value => !/[\s/?#\\%]/.test(String(value)) && ![".", ".."].includes(String(value)),
  "Provide a single path identifier, not a URL or path.",
);
const file = z.object({
  name: z.string().min(1).max(200).describe("File name including extension, e.g. cases.csv or cases.xlsx."),
  content: z.string().optional().describe("UTF-8 text content. Use content_base64 for binary files."),
  content_base64: z.string().optional().describe("Base64-encoded binary file bytes, e.g. XLSX. Omit content when using this."),
}).refine(value => (value.content !== undefined) !== (value.content_base64 !== undefined), "Provide exactly one of content or content_base64.");

export function registerHeadlessTools(server: McpServer, context: ToolContext): void {
  for (const operation of operationCatalog.operations as unknown as Operation[]) {
    if (!operation.mcp || operation.mcp_legacy) continue;
    const inputSchema: Record<string, z.ZodType> = {};
    if (Object.keys(operation.path_parameters).length) {
      inputSchema.path = z.object(Object.fromEntries(Object.keys(operation.path_parameters).map(key => [key, segment]))).describe("Resource identifiers from the corresponding list/get operation.");
    }
    if (Object.keys(operation.query.properties as object).length) {
      // URL query values have a scalar wire representation; accept native values too.
      inputSchema.query = z.object(Object.fromEntries(Object.keys(operation.query.properties as object).map(key => [key, z.union([z.string(), z.number(), z.boolean()]).optional()]))).optional();
    }
    if (operation.body) inputSchema.body = z.fromJSONSchema(operation.body).describe("JSON request body. Versioned edits require the latest expected_version.");
    if (operation.multipart) {
      inputSchema.form = z.fromJSONSchema(operation.form ?? { type: "object" }).optional();
      inputSchema.files = z.array(file).max(20).describe("Explicit file content to upload. The MCP server cannot read paths on the developer's machine.");
    }
    registerTool(server, context, {
      name: `bench_${operation.id}`, title: operation.id.replaceAll("_", " "),
      description: operation.description, inputSchema, readOnly: operation.read_only,
      handler: async (args, ctx) => {
        const parameters = args.path as Record<string, string | number> | undefined;
        const path = operation.path.replace(/\{([^}]+)\}/g, (_, name: string) => encodeURIComponent(String(parameters?.[name])));
        const query = args.query as Record<string, string | number> | undefined;
        let form: FormData | undefined;
        if (operation.multipart) {
          form = new FormData();
          for (const [key, value] of Object.entries((args.form ?? {}) as Record<string, unknown>)) {
            if (value !== undefined) form.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
          }
          let total = 0;
          for (const item of args.files as z.infer<typeof file>[]) {
            if (/[\r\n/\\]/.test(item.name)) throw new Error("Use a file name without directories or line breaks.");
            if (item.content_base64 !== undefined && !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(item.content_base64)) throw new Error("Invalid base64 file content.");
            const bytes = item.content !== undefined ? Buffer.from(item.content, "utf8") : Buffer.from(item.content_base64!, "base64");
            total += bytes.length;
            if (total > (operation.max_file_bytes ?? 4 * 1024 * 1024)) throw new Error("Upload exceeds the operation's file-size limit.");
            form.append(operation.file_field ?? "file", new Blob([bytes]), item.name);
          }
        }
        return ctx.client.request(path, {
          method: operation.method,
          ...(query ? { query } : {}),
          ...(args.body !== undefined ? { body: args.body } : {}),
          ...(form ? { form } : {}),
        });
      },
    });
  }
}
