import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createHttpTransportServer } from "../src/http.js";

/**
 * Records which API key each upstream call carried, so the tenancy tests
 * can assert that a session's requests go out as that session's user and
 * nobody else.
 */
class KeyRecordingApi {
  readonly calls: Array<{ path: string; key: string | null }> = [];

  readonly fetch: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    const auth = new Headers(init?.headers).get("Authorization");
    this.calls.push({ path: url.pathname, key: auth?.replace("Bearer ", "") ?? null });
    return new Response(JSON.stringify({ email: `${auth}@example.com` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}

let server: Server;
let api: KeyRecordingApi;
let baseUrl: URL;
const openClients: Client[] = [];
let aliceTransport: StreamableHTTPClientTransport | undefined;

beforeEach(async () => {
  api = new KeyRecordingApi();
  server = createHttpTransportServer({
    baseUrl: "https://api.test.invalid",
    timeoutMs: 5000,
    port: 0,
    fetchImpl: api.fetch,
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = new URL(`http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`);
});

afterEach(async () => {
  await Promise.all(openClients.splice(0).map((c) => c.close().catch(() => undefined)));
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

/** Connects a client carrying the given key, as a hosted client would. */
async function connectWithKey(apiKey: string): Promise<Client> {
  const client = new Client({ name: "test", version: "0.0.0" });
  const transport = new StreamableHTTPClientTransport(baseUrl, {
    requestInit: { headers: { Authorization: `Bearer ${apiKey}` } },
  });
  await client.connect(transport);
  aliceTransport = transport;
  openClients.push(client);
  return client;
}

describe("health", () => {
  it("answers /healthz without a credential, for the load balancer", async () => {
    const response = await fetch(new URL("/healthz", baseUrl));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
  });
});

describe("authentication", () => {
  it("rejects an initialize with no Authorization header", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } },
      }),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain("Bearer");
  });

  it("rejects a credential that is not a Bench key", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: "Bearer sk-some-other-product",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } },
      }),
    });

    expect(response.status).toBe(401);
  });

  it("rejects a request for an unknown session", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "mcp-session-id": "00000000-0000-0000-0000-000000000000",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });

    expect(response.status).toBe(404);
  });
});

describe("tenancy", () => {
  // Deliberately does not assert the tool count: test/tools.test.ts pins
  // the exact surface, and duplicating it here means adding a tool breaks
  // an unrelated file. That is not hypothetical - it broke dev once, when
  // two independently green PRs (this transport, and a new tool) merged
  // cleanly and only failed in combination.
  it("serves the same tools over HTTP as over stdio", async () => {
    const client = await connectWithKey("bench_sk_alice");

    const { tools } = await client.listTools();

    expect(tools.length).toBeGreaterThan(0);
    expect(tools.map((t) => t.name)).toContain("bench_whoami");
  });

  // The whole point of the hosted transport: two users on one process
  // must never borrow each other's credential.
  it("sends each session's own key upstream", async () => {
    const alice = await connectWithKey("bench_sk_alice");
    const bob = await connectWithKey("bench_sk_bob");

    await alice.callTool({ name: "bench_whoami", arguments: {} });
    await bob.callTool({ name: "bench_whoami", arguments: {} });

    expect(api.calls.map((c) => c.key)).toEqual(["bench_sk_alice", "bench_sk_bob"]);
  });

  it("keeps sessions distinct", async () => {
    const alice = await connectWithKey("bench_sk_alice");
    const bob = await connectWithKey("bench_sk_bob");

    // Two separate connections mean two separate sessions; if they
    // collided, the health count would not reach 2.
    const health = await (await fetch(new URL("/healthz", baseUrl))).json();

    expect(health.sessions).toBe(2);
    expect(alice).not.toBe(bob);
  });

  it("drops a session when the client terminates it explicitly", async () => {
    const alice = await connectWithKey("bench_sk_alice");
    const transport = aliceTransport;
    expect((await (await fetch(new URL("/healthz", baseUrl))).json()).sessions).toBe(1);

    await transport!.terminateSession();
    openClients.splice(openClients.indexOf(alice), 1);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect((await (await fetch(new URL("/healthz", baseUrl))).json()).sessions).toBe(0);
  });

  // Clients do not reliably terminate: the SDK's close() sends no DELETE,
  // and a crashed or disconnected client sends nothing at all. Without
  // this sweep, every abandoned session keeps a user's API key in memory
  // for the life of the process.
  it("expires an abandoned session after its idle TTL", async () => {
    const shortLived = createHttpTransportServer({
      baseUrl: "https://api.test.invalid",
      timeoutMs: 5000,
      port: 0,
      fetchImpl: api.fetch,
      sessionTtlMs: 40,
      sweepIntervalMs: 20,
    });
    await new Promise<void>((resolve) => shortLived.listen(0, resolve));
    const url = new URL(`http://127.0.0.1:${(shortLived.address() as AddressInfo).port}/mcp`);

    const client = new Client({ name: "abandoned", version: "0.0.0" });
    await client.connect(
      new StreamableHTTPClientTransport(url, {
        requestInit: { headers: { Authorization: "Bearer bench_sk_ghost" } },
      }),
    );
    expect((await (await fetch(new URL("/healthz", url))).json()).sessions).toBe(1);

    // Walk away without closing anything, as a crashed client would.
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect((await (await fetch(new URL("/healthz", url))).json()).sessions).toBe(0);
    await new Promise<void>((resolve) => shortLived.close(() => resolve()));
  });
});

describe("routing", () => {
  it("404s an unknown path", async () => {
    const response = await fetch(new URL("/nope", baseUrl));

    expect(response.status).toBe(404);
  });
});

/**
 * The renewal counters exist so that "did a session actually renew" can be
 * answered from outside the process. A gauge like the session count cannot
 * answer it: a renewed session and a silently re-created one look the same.
 */
describe("renewal counters", () => {
  it("reports them on the health endpoint, starting at zero", async () => {
    const res = await fetch(new URL("/healthz", baseUrl));
    const body = (await res.json()) as Record<string, unknown>;

    expect(body.status).toBe("ok");
    expect(body).toMatchObject({ renewals: 0, challenges: 0, refusals: 0 });
  });

  it("carries no identity, since the endpoint is unauthenticated", async () => {
    await connectWithKey("bench_sk_alice");

    const body = await (await fetch(new URL("/healthz", baseUrl))).text();

    expect(body).not.toContain("alice");
  });
});

/**
 * The mark a client shows beside the server's name. Before this, Bench
 * advertised no icon at all and clients fell back to whatever they could
 * derive, which is how the wrong logo ended up on screen.
 */
describe("server icon", () => {
  it("serves the mark unauthenticated, as a client fetches it before signing in", async () => {
    const res = await fetch(new URL("/icon.svg", baseUrl));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/svg+xml");
    expect(await res.text()).toContain("<svg");
  });

  // A single dark mark is invisible on a dark background, which is the
  // failure mode that makes a server look broken rather than unbranded.
  it("serves a light and a dark variant that actually differ", async () => {
    const light = await (await fetch(new URL("/icon.svg", baseUrl))).text();
    const dark = await (await fetch(new URL("/icon-dark.svg", baseUrl))).text();

    expect(light).toContain("#0b0d0c");
    expect(dark).toContain("#ffffff");
    expect(light).not.toBe(dark);
  });

  // `icons` on the implementation arrived in protocol revision
  // 2025-11-25. A client negotiating an earlier one may ignore it and
  // derive an icon from the origin, so the conventional paths answer too.
  it("also answers the conventional favicon paths", async () => {
    for (const path of ["/favicon.svg", "/favicon.ico"]) {
      const res = await fetch(new URL(path, baseUrl));

      expect(res.status, path).toBe(200);
      expect(res.headers.get("content-type"), path).toBe("image/svg+xml");
    }
  });

  // A favicon gets no theme hint, so it has to carry its own ground or it
  // vanishes against half the backgrounds it lands on.
  it("serves the favicon on its own tile, unlike the themed marks", async () => {
    const favicon = await (await fetch(new URL("/favicon.svg", baseUrl))).text();
    const themed = await (await fetch(new URL("/icon.svg", baseUrl))).text();

    expect(favicon).toContain("<rect");
    expect(themed).not.toContain("<rect");
  });

  it("advertises both to the client, tagged by theme", async () => {
    const client = await connectWithKey("bench_sk_alice");
    const info = client.getServerVersion() as {
      icons?: Array<{ src: string; theme?: string; mimeType?: string }>;
    };

    expect(info.icons?.map((i) => i.theme)).toEqual(["light", "dark"]);
    for (const icon of info.icons ?? []) {
      expect(icon.mimeType).toBe("image/svg+xml");
      // Absolute: stdio has no origin of its own to resolve against.
      expect(icon.src).toMatch(/^https:\/\//);
    }
  });
});
