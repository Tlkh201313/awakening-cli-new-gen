# Graphify Quick Guide

Upstream: https://github.com/safishamsi/graphify

## Install

```bash
pip install graphifyy && graphify install
```

(PyPI package name is **graphifyy**.)

## When to use

Large codebase or corpus exploration when reading every file would blow the token budget.

## Workflow

1. Check for `graphify-out/graph.json` in the project.
2. If missing, run `/graphify .` or `graphify <path>` once per project/session.
3. Query with `graphify query "…" --budget 1500` instead of batch-reading source files.
4. Use `graphify --wiki` for large graphs; read wiki articles one at a time.

## Commands

- `graphify path A B` — route between nodes
- `graphify explain NODE` — node context
- `graphify add <url>` — web corpus ingestion
- `graphify --update` — incremental refresh

Never dump full `graph.json` into context.
