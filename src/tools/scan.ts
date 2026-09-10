import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { repoBranch, uploadPromptsInput } from "../schemas.js";
import { registerTool, type ToolContext } from "./register.js";

/** Extensions bench-api accepts on the upload endpoint. */
const ALLOWED_UPLOAD_EXTENSIONS = [".md", ".txt", ".json", ".yaml"];

/**
 * Group B — scan. Stage 1 extraction, and the no-GitHub entry path.
 * Nothing downstream works without a stored scan: it is what produces the
 * call site ids every later tool takes.
 */
export function registerScanTools(server: McpServer, context: ToolContext): void {
  registerTool(server, context, {
    name: "bench_scan_repo",
    title: "Scan a repository",
    description:
      "Find the LLM call sites in a repository branch — prompts, model configuration and tool bindings. Run this first: every other tool works from a stored scan. Consumes no evaluations, but requires an active plan.",
    inputSchema: repoBranch,
    handler: async (args, ctx) =>
      ctx.client.request(
        `/api/repos/${encodeURIComponent(args.owner as string)}/${encodeURIComponent(args.repo as string)}/scan`,
        { method: "POST", query: { branch: args.branch as string } },
      ),
  });

  registerTool(server, context, {
    name: "bench_get_scan",
    title: "Get the latest scan",
    description:
      "Return the most recent stored scan for a repository branch, without re-scanning. This is where call site ids come from — read it before starting an evaluation to choose which prompts to bench.\n\nAlso worth reading before trusting any later score: `confidence` on each call site, and `config_consistency_flags`, which reports the same prompt bound to conflicting model settings. A call site with no `model` will be scored against a default rather than what it actually runs.",
    inputSchema: repoBranch,
    readOnly: true,
    handler: async (args, ctx) =>
      ctx.client.request(
        `/api/repos/${encodeURIComponent(args.owner as string)}/${encodeURIComponent(args.repo as string)}/scan/latest`,
        { query: { branch: args.branch as string } },
      ),
  });

  registerTool(server, context, {
    name: "bench_upload_prompts",
    title: "Upload prompts",
    description:
      "Evaluate prompts that are not in a connected repository, by uploading files or pasting text. Returns a scan whose repo_full_name looks like \"upload/abc123\" on branch \"prompts\" — pass those to the other tools exactly as you would a real repository. Limited to 2 MB total.",
    inputSchema: uploadPromptsInput,
    handler: async (args, ctx) => {
      const files = (args.files ?? []) as Array<{ path: string; content: string }>;
      const pastedText = args.pasted_text as string | undefined;

      if (files.length === 0 && !pastedText?.trim()) {
        throw new Error("Provide at least one file or some pasted text.");
      }

      // Rejected here rather than at bench-api so the model gets a
      // specific, actionable message instead of a generic 400.
      for (const file of files) {
        const extension = file.path.slice(file.path.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_UPLOAD_EXTENSIONS.includes(extension)) {
          throw new Error(
            `${file.path}: only ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")} files are supported.`,
          );
        }
      }

      const form = new FormData();
      for (const file of files) {
        form.append("files", new Blob([file.content], { type: "text/plain" }), file.path);
      }
      if (pastedText) form.append("pasted_text", pastedText);
      if (args.model) form.append("model", args.model as string);

      return ctx.client.request("/api/prompt-scans", { method: "POST", form });
    },
  });
}
