# Simplify

Reduce complexity and remove dead code without changing behavior.

## Steps

1. List invariants — what behavior must stay?
2. Delete unused code, imports, flags, and commented blocks.
3. Inline single-use helpers unless the name documents a real boundary.
4. Run tests and typecheck — prove behavior unchanged.

## Rules

- Smallest diff that reduces complexity.
- No new abstractions during a simplify pass.
- Prefer early returns over nested `else` (match awakened style).

## Anti-patterns

Extracting one-line helpers, adding interfaces for single implementations, speculative error handling for impossible cases.
