/**
 * Configuration shared by both transports.
 *
 * The split that matters: `baseUrl` and `timeoutMs` are deployment
 * settings and come from the environment in both modes, but the API key
 * is a per-user credential. Over stdio there is exactly one user per
 * process so it comes from the environment too; over HTTP the server is
 * multi-tenant and the key arrives per-connection, so it is deliberately
 * absent from this type. See readStdioConfig.
 */
export interface BaseConfig {
  baseUrl: string;
  timeoutMs: number;
}

export const DEFAULT_BASE_URL = "https://api.trybench.ai";
export const DEFAULT_TIMEOUT_MS = 120_000;
export const API_KEY_PREFIX = "bench_sk_";

/** Thrown for a configuration problem worth exiting over. */
export class ConfigError extends Error {}

export function readBaseConfig(env: NodeJS.ProcessEnv = process.env): BaseConfig {
  const rawTimeout = env.BENCH_MCP_TIMEOUT_MS;
  const timeoutMs = rawTimeout ? Number(rawTimeout) : DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new ConfigError(
      `BENCH_MCP_TIMEOUT_MS must be a positive number of milliseconds, got "${rawTimeout}".`,
    );
  }

  return {
    baseUrl: env.BENCH_API_BASE_URL?.trim() || DEFAULT_BASE_URL,
    timeoutMs,
  };
}

/**
 * Reads the single-user stdio configuration. Fails loudly on a missing or
 * malformed key: a server that starts without one would present
 * seventeen tools that all return 401.
 */
export function readStdioConfig(env: NodeJS.ProcessEnv = process.env): BaseConfig & { apiKey: string } {
  const apiKey = env.BENCH_API_KEY?.trim();
  if (!apiKey) {
    throw new ConfigError(
      "BENCH_API_KEY is not set. Generate a key in Bench account settings and add it to this server's env in your MCP client config.",
    );
  }
  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    throw new ConfigError(
      `BENCH_API_KEY does not look like a Bench key — it should start with "${API_KEY_PREFIX}".`,
    );
  }
  return { ...readBaseConfig(env), apiKey };
}

/** Which transport to run. stdio stays the default: local use is unchanged. */
export function readTransport(env: NodeJS.ProcessEnv = process.env): "stdio" | "http" {
  const raw = (env.BENCH_MCP_TRANSPORT ?? "stdio").trim().toLowerCase();
  if (raw !== "stdio" && raw !== "http") {
    throw new ConfigError(`BENCH_MCP_TRANSPORT must be "stdio" or "http", got "${raw}".`);
  }
  return raw;
}

export function readPort(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.PORT;
  const port = raw ? Number(raw) : 8080;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError(`PORT must be a valid port number, got "${raw}".`);
  }
  return port;
}
