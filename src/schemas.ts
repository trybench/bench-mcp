import { z } from "zod";

/**
 * Input schemas for the tools. These generate the JSON Schema each tool
 * advertises, so the descriptions here are what a model actually reads
 * when deciding how to call one — they are interface copy, not comments.
 */

export const repoOwner = z
  .string()
  .min(1)
  .describe('Repository owner, e.g. "trybench". Use "upload" for an uploaded prompt set.');

export const repoName = z
  .string()
  .min(1)
  .describe('Repository name, e.g. "bench-api". For an uploaded prompt set, the name returned by bench_upload_prompts.');

export const branch = z
  .string()
  .min(1)
  .describe('Branch to act on. Uploaded prompt sets always use "prompts".');

export const callSiteId = z
  .string()
  .min(1)
  .describe('Call site identifier from a scan, e.g. "agents/support.py:120".');

export const repoBranch = {
  owner: repoOwner,
  repo: repoName,
  branch,
};

export const repoBranchCallSite = {
  ...repoBranch,
  call_site_id: callSiteId,
};

export const listBranchesInput = {
  owner: repoOwner,
  repo: repoName,
};

export const uploadPromptsInput = {
  files: z
    .array(
      z.object({
        path: z.string().min(1).describe("File name, e.g. \"system-prompt.md\"."),
        content: z.string().describe("The file's text content."),
      }),
    )
    .optional()
    .describe("Prompt files to evaluate. Only .md, .txt, .json and .yaml are accepted."),
  pasted_text: z
    .string()
    .optional()
    .describe("Prompt text pasted directly, as an alternative to files."),
  model: z
    .string()
    .optional()
    .describe(
      'Model these prompts run on, e.g. "gpt-4o" or "claude-sonnet-4". Uploaded prompts carry no model of their own, so set it here or the baseline scores against the pipeline default.',
    ),
};

export const startEvaluationInput = {
  repo_full_name: z
    .string()
    .min(1)
    .describe('Full repository name, e.g. "trybench/bench-api", or the "upload/..." name from bench_upload_prompts.'),
  branch,
  prompts: z
    .array(
      z.object({
        call_site_id: callSiteId,
        workflow_name: z
          .string()
          .optional()
          .describe("Human-readable label for this prompt, shown in the runs list."),
      }),
    )
    .min(1)
    .describe("Call sites to evaluate. The Free plan covers one prompt per evaluation."),
  generate_context: z
    .boolean()
    .optional()
    .describe(
      "Generate the business context inside this run rather than requiring a stored one. Usually true — it makes this single call cover the whole pipeline.",
    ),
  context_doc: z
    .string()
    .optional()
    .describe(
      "What the business does, in plain text, to ground the evaluation. Optional: with generate_context and no doc, Bench infers it from the prompts alone.",
    ),
};

export const runIdInput = {
  run_id: z.number().int().positive().describe("Evaluation run id, from bench_start_evaluation."),
};

export const generateContextInput = {
  ...repoBranch,
  business_doc_text: z
    .string()
    .optional()
    .describe(
      "Plain text about the business, to ground the result. Omit to infer everything from the prompts alone.",
    ),
};

export const websiteTextInput = {
  url: z.string().url().describe("Page to read, e.g. the product's home or about page."),
};

export const generateBenchmarkInput = {
  ...repoBranchCallSite,
  suite_name: z.string().optional().describe("Label for the generated test suite."),
  previous_routing_json: z
    .string()
    .optional()
    .describe(
      "The last result's scoring.routing, to get a report of what changed. Omit for a first pass.",
    ),
  reference_today: z
    .string()
    .optional()
    .describe("Date to treat as today when generating time-sensitive cases."),
};

export const rerunEvaluationInput = {
  ...runIdInput,
  single_prompt: z
    .boolean()
    .optional()
    .describe(
      "Re-run only this prompt rather than every prompt in the original benching session.",
    ),
  generate_context: z
    .boolean()
    .optional()
    .describe(
      "Regenerate the business context as part of the rerun. Needed when the original run was cancelled before its context was stored.",
    ),
  context_doc: z
    .string()
    .optional()
    .describe("Plain-text business context, used only with generate_context."),
};

export const submitReviewInput = {
  ...runIdInput,
  test_cases: z
    .array(z.unknown())
    .describe(
      "The test cases to score against, as an array. Pass them back from bench_get_eval_benchmark — edited, filtered, or unchanged. This is a review gate: the run stays paused until it arrives.",
    ),
};

export const openPromptPrInput = {
  owner: repoOwner,
  repo: repoName,
  title: z.string().min(1).describe("Pull request title."),
  body: z.string().optional().describe("Pull request description."),
  branch_name: z
    .string()
    .optional()
    .describe('Head branch to create. Defaults to "bench/prompt-fixes".'),
  base_branch: z
    .string()
    .optional()
    .describe("Branch to merge into. Defaults to the repository's default branch."),
  changes: z
    .array(
      z.object({
        path: z.string().min(1).describe("File path in the repository."),
        content: z.string().describe("Full new content for that file."),
      }),
    )
    .min(1)
    .describe("Files to change. Each entry replaces the file's entire content."),
};

export const activateInstallationInput = {
  installation_id: z
    .number()
    .int()
    .positive()
    .describe("GitHub installation id, from bench_connection_status."),
};

/** Narrow helper for tools that take no arguments. */
export const noInput = {} as const;

export type ZodRawShape = Record<string, z.ZodTypeAny>;
