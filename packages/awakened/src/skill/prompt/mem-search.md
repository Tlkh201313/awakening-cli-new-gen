# Memory Search (awakened-mem)

Search **awakened-memory** before re-deciding or re-explaining. Adapted from [claude-mem mem-search](https://github.com/thedotmack/claude-mem); Awakened uses `mem_*` tools instead of MCP.

## When to use

User or you need **previous sessions** (not the current thread):

- "Did we already fix this?"
- "How did we solve X last time?"
- "What happened last week in this repo?"

## Workflow (always follow)

**Filter before deep reads — saves tokens.**

### Step 1: Search index

```
mem_search(query="authentication middleware", limit=15)
```

Returns titled entries with content snippets. Pick 1–3 relevant titles.

### Step 2: Narrow

- Wrong scope? Retry with `scope: "project"` or `"global"`.
- Too few hits? `mem_list(limit=20)` and scan titles.
- User gave file path? Include path basename in query.

### Step 3: Apply

Use recalled bullets in your answer. Cite **file paths and commands** from entries. Do not fetch or invent history beyond stored entries.

## Optional: user slash

`/mem-search <query>` runs the same intent with a focused prompt template.

## Pair with mem_save

When search shows **outdated** info, save a corrected entry after fixing — tag `change` or `bugfix`.

## Related

Load **awakened-mem** for full save-on-every-output rules and tag vocabulary.
