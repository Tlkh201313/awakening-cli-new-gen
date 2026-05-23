---
name: awk3nd-verify
description: Verification workflow for AWK3N3D project. Runs build, tests, linters, and type-checks before marking tasks complete.
---

# AWK3N3D Verification

**USE WHEN:** Completing tasks with code changes, before pushing to GitHub, or when user requests verification.

**DO NOT USE FOR:** Read-only exploration, planning, or tasks with no file edits.

---

## Verification Sequence

### 1. Build
```bash
npm run build
```
**Pass criteria:** No errors, externals validated, SDK bundle clean.

### 2. Type Check
```bash
npx tsc --noEmit
```
**Pass criteria:** Zero type errors.

### 3. Lint (changed files only)
```bash
git diff --name-only HEAD | grep -E '\.(ts|tsx)$' | xargs npx eslint --cache --max-warnings 0
```
**Pass criteria:** Zero warnings, zero errors.

### 4. Tests (if applicable)
```bash
npm test -- --findRelatedTests $(git diff --name-only HEAD)
```
**Pass criteria:** All tests pass.

### 5. Link Global
```bash
npm link
```
**Pass criteria:** CLI version matches `package.json`.

### 6. Git Status
```bash
git status
git diff --stat
```
**Pass criteria:** Only intended files changed, no secrets.

---

## Failure Handling

**If any step fails:**
1. Report exact error (caveman format)
2. Do NOT mark task complete
3. Fix issue or delegate to `builder`
4. Re-run verification from step 1

---

## Integration with Plans

**Mandatory before:**
- Marking plan task checkbox complete
- Pushing to GitHub
- Reporting "done" to user

**Optional for:**
- Single-line comment changes
- Documentation-only edits (no code)

---

## Output Format

**Success:**
```
Verify pass. Build OK, types OK, lint OK, tests OK. Linked v0.12.19. Ready push.
```

**Failure:**
```
Verify fail. Build error: externals.ts missing @foo/bar. Fix → re-verify.
```

---

## Parallel Verification

Run independent checks in parallel:
```bash
npm run build & npx tsc --noEmit & wait
```

**Sequential only when:**
- Build must pass before tests
- Lint requires build artifacts

---

## Anti-Patterns

- ❌ Skip verification on multi-file edits
- ❌ Mark task complete before verify pass
- ❌ Push to GitHub without verify
- ❌ Run full test suite when `--findRelatedTests` sufficient
