# CLAUDE.md

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, PR conventions, and merge strategy.

Worth restating, because they are easy to get wrong in an agent session:

- **bench-mcp is a thin client of bench-api.** It never calls bench-pipeline directly, and it holds no auth, billing or scoping logic of its own — bench-api owns all of that. A tool that needs new behavior usually needs a bench-api change first.
- **Every PR links/closes a GitHub issue and is assigned to the requester.** Open the issue first if one doesn't exist.
- **Tool descriptions are interface copy, not comments.** They are what the model reads when deciding how to call a tool. Changing one changes behavior.
- **The review gate is not optional.** Every evaluation run pauses at `awaiting_review` until `bench_submit_run_review` arrives. Anything that starts a run must account for it.
