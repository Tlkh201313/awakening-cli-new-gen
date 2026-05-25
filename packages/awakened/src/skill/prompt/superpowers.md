# Superpowers — TDD-First Agent Methodology

Adapted from **obra/superpowers** for awakened agents.

## When to use

Before creative work, features, or bugfixes where behavior must be verified.

## Workflow

1. **Brainstorm** — explore intent, constraints, and design options; get user approval.
2. **Plan** — phased implementation plan with checkpoints; no code until approved.
3. **Test-first** — write a failing test that captures the desired behavior.
4. **Implement** — minimal code to pass; refactor with tests green.
5. **Verify** — run tests, typecheck, lint; evidence before claiming done.

## Rules

- One skill phase at a time — do not load the entire superpowers catalog.
- For bugfixes: reproduce with a test, then fix.
- For features: agree on acceptance criteria before coding.
- Use subagents for independent verification when the change spans 3+ files.

## Install upstream

```bash
/plugin marketplace add obra/superpowers
```

Built-in companion skills: `brainstorming`, `security-review` (when scope includes security).
