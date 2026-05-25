# Webapp Testing

Use for Playwright, E2E, and browser-based verification.

## Setup

Run tests from the owning package directory, not repo root.

## Playwright workflow

1. Prefer role/text selectors over brittle CSS.
2. `waitForLoadState('networkidle')` on SPAs; dismiss cookie banners before clicks.
3. Snapshot critical UI after navigation for regressions.
4. One assertion focus per test when possible.

## Rules

- Reproduce the failure before fixing flakes.
- Do not mock the module under test unless the boundary is external I/O.
- Report failing selector + screenshot path when tests fail.
