# Testing

Unit, integration, and test execution for awakened projects.

## Execution

Run from package directories (e.g. `packages/awakened`), not monorepo root unless documented.

```bash
cd packages/<pkg> && bun test path/to/file.test.ts
cd packages/<pkg> && bun typecheck
```

## Writing tests

- Test real behavior — avoid mocks that duplicate implementation.
- One clear assertion focus per test when practical.
- Name tests after the behavior, not the function name alone.

## TDD

For new behavior: failing test → minimal pass → refactor. See Skill `superpowers` for full methodology.
