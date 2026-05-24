# Contributing to Awakened

**Repo:** [Tlkh201313/awakening-cli-new-gen](https://github.com/Tlkh201313/awakening-cli-new-gen)  
**Default branch:** `master`

## Dev setup

```bash
bun install
bun run build
bun run start          # or: node dist/cli.mjs
```

Global CLI from a clone:

```bash
bun link               # preferred on Windows
# npm link --force     # if openclaude.cmd already exists globally
```

## Checks before a PR

```bash
bun run integrations:check
bun run build
bun run verify:privacy
bun test --max-concurrency=1
bun run hardening:check
```

Web UI (optional):

```bash
bun run web:typecheck
bun run web:build
```

## TypeScript

- **`bun run typecheck`** — application source only (`tsconfig.json`, excludes `*.test.*`).
- **`bun run typecheck:test`** — test files (`tsconfig.test.json`, Bun types).
- **`bun run typecheck:all`** — both.

The open mirror still has a large typecheck backlog on app source (~1.4k errors as of 2026-05-24). Do not increase errors in directories you touch; prefer fixing types in changed files. Full green `typecheck` is a tracked goal (see [improvement plan](docs/superpowers/plans/2026-05-24-awakened-improvement-plan.md)).

Stub modules for disabled build flags live under `src/proactive/` and `src/utils/postCommitAttribution.ts` — keep them aligned with `scripts/build.ts` `featureFlags`.

## Feature flags

Edit `featureFlags` in [`scripts/build.ts`](scripts/build.ts), then `bun run build`. Document user-visible changes in [`docs/FEATURE_MATRIX.md`](docs/FEATURE_MATRIX.md).

## Secrets

Never commit real API keys. See [SECURITY.md](SECURITY.md).
