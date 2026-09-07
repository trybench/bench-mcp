#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "./server.js";

const DEFAULT_BASE_URL = "https://api.trybench.ai";

/**
 * Reads configuration from the environment, which is where MCP clients
 * put credentials. Fails loudly and specifically: a server that starts
 * without a key would surface as sixteen tools that all return 401.
 */
function readConfig(): { baseUrl: string; apiKey: string; timeoutMs: number } {
  const apiKey = process.env.BENCH_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "BENCH_API_KEY is not set. Generate a key in Bench account settings and add it to this server's env in your MCP client config.",
    );
    process.exit(1);
  }
  if (!apiKey.startsWith("bench_sk_")) {
    console.error('BENCH_API_KEY does not look like a Bench key — it should start with "bench_sk_".');
    process.exit(1);
  }

  const rawTimeout = process.env.BENCH_MCP_TIMEOUT_MS;
  const timeoutMs = rawTimeout ? Number(rawTimeout) : 120_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    console.error(`BENCH_MCP_TIMEOUT_MS must be a positive number of milliseconds, got "${rawTimeout}".`);
    process.exit(1);
  }

  return {
    baseUrl: process.env.BENCH_API_BASE_URL?.trim() || DEFAULT_BASE_URL,
    apiKey,
    timeoutMs,
  };
}

async function main(): Promise<void> {
  const config = readConfig();
  const server = createServer(config);
  // stdout carries the MCP protocol itself, so every diagnostic goes to
  // stderr or it corrupts the stream.
  await server.connect(new StdioServerTransport());
  console.error(`bench-mcp ready (bench-api: ${config.baseUrl})`);
}

main().catch((error: unknown) => {
  console.error("bench-mcp failed to start:", error instanceof Error ? error.message : error);
  process.exit(1);
});
