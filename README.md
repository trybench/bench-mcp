# bench-mcp

Bench as an MCP server. Evaluate and optimize your LLM prompts from Claude Code, Claude Desktop, or any other MCP client — scan a repository, generate a rubric and test cases, score the current prompt, search for a better prompt and model, then open a PR with the winner.

It is a thin client of [bench-api](https://github.com/trybench/bench-api)'s REST endpoints — the same relationship bench-web has, with MCP tools instead of a web UI. It holds no policy of its own: authentication, plan gating, token consumption and org scoping all live in bench-api, so a tool call is gated exactly like the equivalent web action.

## Setup

### 1. Generate an API key

In Bench account settings, create an API key. It is shown once and cannot be recovered afterwards.

Keys are scoped down deliberately. By default a key reads only **your own** results, never your organization's, and you can additionally restrict one to specific repositories or cap how many evaluations it may spend per month. Mint a narrow key for each machine.

### 2. Add the server to your MCP client

**Claude Code**

```bash
claude mcp add bench --env BENCH_API_KEY=bench_sk_... -- npx -y @trybench/mcp
```

**Claude Desktop** — in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bench": {
      "command": "npx",
      "args": ["-y", "@trybench/mcp"],
      "env": {
        "BENCH_API_KEY": "bench_sk_..."
      }
    }
  }
}
```

### Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `BENCH_API_KEY` | yes | — | Your Bench API key |
| `BENCH_API_BASE_URL` | no | `https://api.trybench.ai` | Point at staging or a local bench-api |
| `BENCH_MCP_TIMEOUT_MS` | no | `120000` | Timeout for one HTTP call, not a whole evaluation |

## How a session goes

```
bench_scan_repo          find the prompts in a repo branch
bench_get_scan           pick a call site to evaluate
bench_start_evaluation   kick off benchmark → baseline → optimize → recommend
bench_get_evaluation     poll … status becomes "awaiting_review"
bench_get_eval_benchmark read the generated test cases
bench_submit_run_review  approve or edit them; the run continues
bench_get_evaluation     poll … status becomes "succeeded"
bench_get_optimization   read the winning prompt and model
bench_open_prompt_pr     open a PR applying it
```

**Every run pauses for review.** Between generating test cases and scoring against them, a run stops at `awaiting_review` and waits — unconditionally, on every run, including cached reruns. It fails after 48 hours if nothing reviews it. This is the step most likely to trip up an agent loop: a run that seems stuck is usually a run waiting for `bench_submit_run_review`.

Reviewing test cases is also the part an agent is genuinely good at, which is much of the reason this server exists.

## Tools

**Connect** — free, no plan required

| Tool | Does |
| --- | --- |
| `bench_whoami` | Plan, subscription status, evaluations remaining |
| `bench_connection_status` | Which GitHub accounts are connected |
| `bench_connect_github` | Link for connecting a GitHub account and choosing repositories |
| `bench_list_repos` | Repositories Bench can reach |
| `bench_list_branches` | Branches of one repository |

**Scan** — requires an active plan

| Tool | Does |
| --- | --- |
| `bench_scan_repo` | Find LLM call sites in a repository branch |
| `bench_get_scan` | Re-read the stored scan without re-scanning |
| `bench_upload_prompts` | Evaluate prompts not in a connected repo (`.md`, `.txt`, `.json`, `.yaml`, 2 MB total) |

**Run** — `bench_start_evaluation` consumes one evaluation per prompt

| Tool | Does |
| --- | --- |
| `bench_start_evaluation` | Benchmark → baseline → optimize → recommend, in the background |
| `bench_get_evaluation` | One run's status and scores |
| `bench_list_evaluations` | Recent runs |
| `bench_get_eval_benchmark` | The rubric and test cases |
| `bench_submit_run_review` | Release the review gate |
| `bench_cancel_evaluation` | Stop a run |

**Results** — free

| Tool | Does |
| --- | --- |
| `bench_get_baseline` | How the current prompt scored, and what it costs |
| `bench_get_optimization` | Candidates tested, and the recommended combination |
| `bench_get_recommendation` | Bench's recommendation for a call site |

**Apply**

| Tool | Does |
| --- | --- |
| `bench_open_prompt_pr` | Open a PR with the improved prompt |

### Not here yet

Per-stage control — generating a business context, a benchmark, a baseline or an optimization pass on their own — is deliberately left out of v1. The orchestrated run covers all of it, and the per-stage endpoints stream newline-delimited JSON, which sits badly with MCP request timeouts. They will be added if there is demand for stage-at-a-time control.

There is also no tool to trigger the recommend stage: bench-api runs it only as part of an evaluation and exposes no endpoint to invoke it directly.

## Hosted mode

The same binary serves many users over HTTP instead of stdio:

```bash
BENCH_MCP_TRANSPORT=http PORT=8080 node dist/index.js
```

The difference is tenancy. Over stdio there is one user per process and the key comes from `BENCH_API_KEY`. Over HTTP the server is multi-tenant: each client supplies its own key in the `Authorization` header at connect time, and every session gets its own isolated server bound to that credential. There is no fallback key — an unauthenticated connection is refused, never served as somebody else.

| Endpoint | Purpose |
| --- | --- |
| `POST /mcp` | Initialize a session, and send requests |
| `GET /mcp` | Server-sent event stream for an open session |
| `DELETE /mcp` | End a session |
| `GET /healthz` | Health check (unauthenticated; reports open session count) |

Idle sessions are swept after 30 minutes. Clients do not reliably disconnect — the SDK's `close()` sends no DELETE, and crashed clients send nothing — so without expiry every abandoned session would hold a user's API key in memory for the life of the process.

Set `BENCH_MCP_ALLOWED_HOSTS` in production to enable DNS-rebinding protection.

**Not yet wired:** OAuth. The MCP spec's answer for a hosted server is OAuth 2.1, so users click "connect" rather than pasting a key. Hosted mode currently takes the same bearer key as stdio; OAuth is tracked separately.

## Development

```bash
npm install
npm test          # vitest, against a stubbed bench-api
npm run typecheck
npm run build
```

Point at a local bench-api with `BENCH_API_BASE_URL=http://localhost:8080`.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch and PR conventions.
