/**
 * GitHub scanning (Stage 1 static extraction of a connected repository) is
 * hidden until Stage 1 is reliable. Systems are registered by the SDK or by a
 * coding agent with bench_register_calls instead. Set
 * BENCH_GITHUB_SCANNING_ENABLED=true on the deployment to bring the tools back.
 *
 * Hidden: the tools that start or refresh a scan. Kept: the GitHub connection
 * tools, bench_open_prompt_pr, bench_get_scan and bench_set_prompt_models (they
 * read or patch a stored scan, which register_calls and uploads also produce),
 * and bench_upload_prompts.
 */
export const GITHUB_SCAN_TOOLS: ReadonlySet<string> = new Set([
  "bench_scan_repo",
  "bench_get_repository_refresh",
  "bench_set_repository_refresh",
]);

export function githubScanningEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.BENCH_GITHUB_SCANNING_ENABLED === "true";
}
