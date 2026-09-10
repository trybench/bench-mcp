#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { ConfigError, readBaseConfig, readPort, readStdioConfig, readTransport } from "./config.js";
import { createHttpTransportServer } from "./http.js";
import { readOAuthConfig } from "./oauth.js";
import { createServer } from "./server.js";

/**
 * stdio is the default and the local path: one user, one process, the key
 * in the environment. http is the hosted path: many users, each supplying
 * their own key per connection.
 */
async function main(): Promise<void> {
  const transport = readTransport();

  if (transport === "http") {
    const base = readBaseConfig();
    const port = readPort();
    const allowedHosts = process.env.BENCH_MCP_ALLOWED_HOSTS?.split(",")
      .map((h) => h.trim())
      .filter(Boolean);

    const oauth = readOAuthConfig();
    const server = createHttpTransportServer({
      ...base,
      port,
      ...(allowedHosts?.length ? { allowedHosts } : {}),
      ...(oauth ? { oauth } : {}),
    });

    await new Promise<void>((resolve) => server.listen(port, resolve));
    console.error(
      `bench-mcp listening on :${port} (bench-api: ${base.baseUrl}, auth: ${oauth ? `api keys + oauth via ${oauth.authkitDomain}` : "api keys"})`,
    );

    // ECS sends SIGTERM on deregistration; close cleanly so in-flight
    // requests finish instead of being cut off.
    for (const signal of ["SIGTERM", "SIGINT"] as const) {
      process.on(signal, () => {
        console.error(`bench-mcp: ${signal} received, shutting down`);
        server.close(() => process.exit(0));
      });
    }
    return;
  }

  const config = readStdioConfig();
  const server = createServer(config);
  // stdout carries the MCP protocol itself, so every diagnostic goes to
  // stderr or it corrupts the stream.
  await server.connect(new StdioServerTransport());
  console.error(`bench-mcp ready (bench-api: ${config.baseUrl})`);
}

main().catch((error: unknown) => {
  if (error instanceof ConfigError) {
    console.error(error.message);
    process.exit(1);
  }
  console.error("bench-mcp failed to start:", error instanceof Error ? error.message : error);
  process.exit(1);
});
