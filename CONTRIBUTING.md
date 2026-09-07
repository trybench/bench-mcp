# Contributing

## Branches

`<type>/<short-description>`, kebab-case. Types:

- `feat` — new functionality
- `fix` — bug fix
- `chore` — tooling, CI, dependencies, refactors with no behavior change
- `docs` — documentation only

Examples: `feat/per-stage-tools`, `fix/upload-content-type`.

## Pull requests

- Every PR links/closes a GitHub issue (`Closes #123`) and is assigned to the requester.
- Title: imperative mood, no trailing period.
- Body includes a **Summary** (what changed and why) and a **Test plan** (what you verified, as a checklist).
- CI (typecheck, build, test) must pass before merge.

## Merge strategy

- **Feature branch → `dev`**: squash merge.
- **`dev` → `main` (release PR)**: regular merge commit, **never squash** — same reasoning as bench-api, where squash-merging release PRs caused false conflicts on every subsequent release.

## Adding a tool

Tools map one-to-one onto real bench-api endpoints. Don't add a tool for an endpoint that doesn't exist yet, and don't invent client-side composites — an agent can call two tools.

The tool description is the interface. It is what the model reads to decide whether and how to call it, so write it for that reader: say what the tool does, what it costs, and what must have happened first. `test/tools.test.ts` pins the exact tool list, so adding one is a deliberate, visible change.
