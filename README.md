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
bench_get_evaluation     poll background status
bench_get_evaluation_artifacts read the exact saved criteria and cases
bench_get_evaluation     poll … status becomes "completed"
bench_get_optimization   read the winning prompt and model
bench_open_prompt_pr     open a PR applying it
```

**New runs proceed without mandatory review.** Read `bench_evaluation_allowance` and confirm spending before starting. Only a legacy run actually reporting `awaiting_review` needs `bench_submit_run_review`. Connecting MCP is available on every plan; evaluations obey the shared account balance and key cap.

Use system context and the test library for optional corrections. Those changes affect future benches, not historical scores. This local branch exposes 42 tools and has not been published.

`bench_get_fix_brief` reads pinned evidence for a completed run without executing
code or publishing. Pass it to an approved coding agent, then independently validate
the patch. `bench_open_prompt_pr` is an external write and does not verify a repair
receipt; never call it during local-only review.

## Tools

**Connect** — free, no plan required

| Tool | Does |
| --- | --- |
| `bench_whoami` | Plan, subscription status, evaluations remaining |
| `bench_connection_status` | Which GitHub accounts are connected |
| `bench_connect_github` | Link for connecting a GitHub account and choosing repositories |
| `bench_activate_installation` | Switch which connected GitHub account Bench reads from |
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
| `bench_submit_run_review` | Continue a legacy run waiting for review |
| `bench_rerun_evaluation` | Re-score a prompt after changing it — unchanged stages are reused and free |
| `bench_cancel_evaluation` | Stop a run |

**Per-stage** — for driving the pipeline a step at a time

| Tool | Does |
| --- | --- |
| `bench_generate_business_context` | Work out what the product does, from its prompts |
| `bench_get_business_context` | Read the stored context |
| `bench_fetch_website_text` | Read a page as text, to ground the context |
| `bench_generate_eval_benchmark` | Build the rubric and test cases without scoring |

The orchestrated run does all of this internally, so these are for inspecting or rebuilding a stage on its own — none of them consume an evaluation.

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

### Systems, context, datasets and production

`bench_list_systems` and `bench_get_system` expose discovery and component IDs.
`bench_get_system_context`, `bench_list_context_sources`, and `bench_save_system_context`
read/update versioned understanding. `bench_list_test_library`, `bench_save_test_case`,
and `bench_save_criterion` preserve explicit prompt-specific examples and rules.
`bench_list_datasets` and `bench_import_dataset_cases` promote a selected immutable
dataset mapping to the library without replacing corrections or restoring deleted cases.

`bench_list_production_traces`, `bench_get_production_trace`,
`bench_check_production_span`, `bench_get_production_check`, and
`bench_retry_production_check` expose background production checks. Each executed
check uses one evaluation. TypeSafe sharing requires explicit consent and configured
server credentials. Model probabilities are never verified golden labels.

`bench_evaluation_allowance` reports remaining balance, key cap and upgrade actions.
No tool purchases a plan. `bench_get_evaluation_artifacts` reads exact historical
criteria, cases, comparisons and recommendations. Repository restrictions apply to
the entire system and to source traces, not just the selected prompt.

### Not here yet

Running a baseline or an optimization pass on their own. Both stream progress over a long-running request, which sits badly with MCP request timeouts — the orchestrated run covers them, and reports progress by polling instead.

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

### OAuth

Set `BENCH_MCP_AUTHKIT_DOMAIN` and `BENCH_MCP_RESOURCE_URL` and the server also accepts OAuth access tokens, so a user can connect by authorizing in a browser instead of pasting a key. API keys keep working — OAuth is how a person connects, keys remain the scripted path.

bench-mcp is an OAuth *resource server* only: WorkOS AuthKit issues the tokens, and this server publishes where to get one (`/.well-known/oauth-protected-resource`, RFC 9728) and verifies the ones it receives. A token is accepted only if it was issued **for this server** (RFC 8707 audience binding) — without that check, a token minted for another AuthKit-protected resource would be replayable here.

The verified token is then **exchanged** at bench-api for a separate, short-lived bench-api credential, which is what tool calls actually use. It is never forwarded as-is: the spec forbids passing the client's token to an upstream API, since that token is audienced for this server and bench-api would be honouring a credential never issued for it.

Leaving either variable unset disables OAuth entirely, which is correct for stdio: the spec says stdio servers should take credentials from the environment rather than doing OAuth at all.

## Development

```bash
npm install
npm test          # vitest, against a stubbed bench-api
npm run typecheck
npm run build
```

Point at a local bench-api with `BENCH_API_BASE_URL=http://localhost:8080`.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch and PR conventions.

## Headless workflows

Bench exposes all 135 user-facing API operations at
`GET https://api.usebench.ai/api/headless/operations`: setup, GitHub,
prompts/systems, context, files/datasets, tests/criteria, evaluations/history,
real app reports, production feedback, workspaces and billing.

MCP OAuth supports account setup without Bench browser onboarding. GitHub grants
and Stripe payment confirmation require the user's provider approval. Scoped API
keys retain repository, ownership and spending restrictions and cannot mint
credentials or change billing/team access. Model selection requires active Growth
or Enterprise. Use explicit approval before spending, sending invitations, changing
billing or publishing code.

Use `https://api.staging.usebench.ai` and `https://mcp.staging.usebench.ai/mcp`
for development; production MCP is `https://mcp.usebench.ai/mcp`. Credentials
are separate between environments. See the [headless guide](https://docs.usebench.ai/guides/headless),
[platform SDK clients](https://docs.usebench.ai/sdk/platform) and
[operation reference](https://docs.usebench.ai/reference/headless).
