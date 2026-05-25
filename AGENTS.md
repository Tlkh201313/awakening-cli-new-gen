- Awakening CLI fork — repo: [Tlkh201313/awakening-cli-new-gen](https://github.com/Tlkh201313/awakening-cli-new-gen), upstream: [OpenCode](https://github.com/anomalyco/opencode).
- To regenerate the JavaScript SDK, run `./packages/sdk/js/script/build.ts`.
- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.
- The default branch in this repo is `dev`.
- Local `main` ref may not exist; use `dev` or `origin/dev` for diffs.
- Prefer automation: execute requested actions without confirmation unless blocked by missing info or safety/irreversibility.

## Commits and PR Titles

Use conventional commit-style messages and PR titles: `type(scope): summary`.

Valid types are `feat`, `fix`, `docs`, `chore`, `refactor`, and `test`. Scopes are optional; use the affected package or area when helpful, e.g. `core`, `awakened`, `tui`, `app`, `desktop`, `sdk`, or `plugin`.

Examples: `fix(tui): simplify thinking toggle styling`, `docs: update contributing guide`, `chore(sdk): regenerate types`.

## Style Guide

### General Principles

- Keep things in one function unless composable or reusable
- Do not extract single-use helpers preemptively. Inline the logic at the call site unless the helper is reused, hides a genuinely complex boundary, or has a clear independent name that improves the caller.
- Avoid `try`/`catch` where possible
- Avoid using the `any` type
- Use Bun APIs when possible, like `Bun.file()`
- Rely on type inference when possible; avoid explicit type annotations or interfaces unless necessary for exports or clarity
- Prefer functional array methods (flatMap, filter, map) over for loops; use type guards on filter to maintain type inference downstream
- In `src/config`, follow the existing self-export pattern at the top of the file (for example `export * as ConfigAgent from "./agent"`) when adding a new config module.

Reduce total variable count by inlining when a value is only used once.

```ts
// Good
const journal = await Bun.file(path.join(dir, "journal.json")).json()

// Bad
const journalPath = path.join(dir, "journal.json")
const journal = await Bun.file(journalPath).json()
```

### Destructuring

Avoid unnecessary destructuring. Use dot notation to preserve context.

```ts
// Good
obj.a
obj.b

// Bad
const { a, b } = obj
```

### Variables

Prefer `const` over `let`. Use ternaries or early returns instead of reassignment.

```ts
// Good
const foo = condition ? 1 : 2

// Bad
let foo
if (condition) foo = 1
else foo = 2
```

### Control Flow

Avoid `else` statements. Prefer early returns.

```ts
// Good
function foo() {
  if (condition) return 1
  return 2
}

// Bad
function foo() {
  if (condition) return 1
  else return 2
}
```

### Complex Logic

When a function has several validation branches or supporting details, make the main function read as the happy path and move supporting details into small helpers below it.

```ts
// Good
export function loadThing(input: unknown) {
  const config = requireConfig(input)
  const metadata = readMetadata(input)
  return createThing({ config, metadata })
}

function requireConfig(input: unknown) {
  ...
}
```

- Keep helpers close to the code they support, below the main export when that improves readability.
- Do not over-abstract simple expressions into many single-use helpers; extract only when it names a real concept like `requireConfig` or `readMetadata`.
- Do not return `Effect` from helpers unless they actually perform effectful work. Synchronous parsing, validation, and option building should stay synchronous.
- Prefer Effect schema helpers such as `Schema.UnknownFromJsonString` and `Schema.decodeUnknownOption` over manual `JSON.parse` wrapped in `Effect.try` when parsing untrusted JSON strings.
- Add comments for non-obvious constraints and surprising behavior, not for obvious assignments or control flow.

### Schema Definitions (Drizzle)

Use snake_case for field names so column names don't need to be redefined as strings.

```ts
// Good
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  created_at: integer().notNull(),
})

// Bad
const table = sqliteTable("session", {
  id: text("id").primaryKey(),
  projectID: text("project_id").notNull(),
  createdAt: integer("created_at").notNull(),
})
```

## Testing

- Avoid mocks as much as possible
- Test actual implementation, do not duplicate logic into tests
- Tests cannot run from repo root (guard: `do-not-run-tests-from-root`); run from package dirs like `packages/awakened`.

## Type Checking

- Always run `bun typecheck` from package directories (e.g., `packages/awakened`), never `tsc` directly.


<claude-mem-context>
# Memory Context

# [opencode] recent context, 2026-05-25 2:52pm GMT+1

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 27 obs (10,718t read) | 248,996t work | 96% savings

### May 25, 2026
271 10:58a 🔵 Slash Command Popup Layout Bug — Active Fix Effort in opencode/awakened
272 10:59a 🔵 Autocomplete Popup Layout Architecture — Current State After Fix Attempts
273 " 🔵 dialog-select.tsx Layout Strategy — Double setTimeout + Delayed Fade Animation
274 " 🔵 OpenTUI Renderable API — markDirty is Protected, calculateLayout Available
275 " 🔵 OpenTUI Bundle Layout Code Located in index-3fq5hq97.js
276 11:00a 🔵 Root Cause Confirmed — visible setter calls requestRender but NOT calculateLayout
277 " 🔵 Text Nodes Use yogaNode.markDirty() — Distinct from Protected Renderable.markDirty()
278 11:01a 🔵 Render Loop Layout Trigger + layout-changed Event Discovered
279 " 🔵 useRenderer() Hook Exposes Root Renderer to SolidJS Components
280 " 🔵 Reverted Fix Identified — getLayoutNode().markDirty() in Ref Callbacks Caused Yoga Crashes
281 11:03a 🔵 Coordinates Only Valid After updateLayout() — Runs After calculateLayout() in Same Render Frame
282 11:04a 🔵 updateFromLayout() Reads getComputedLayout() + onLayoutResize Triggers Second requestRender
284 11:05a 🔵 Autocomplete Has Uncommitted Changes — stackRows, labelMax, descMax Added Beyond Last Commit
S43 Fix slash command autocomplete popup showing broken spacing on first paint (hover-to-fix bug) in opencode/awakened package (May 25, 11:05 AM)
S42 Fix slash command popup spacing bug in awakened TUI — broken on first paint, fixed only after hover (May 25, 11:05 AM)
285 11:06a 🔵 paddingLeft Setter Has No Same-Value Dedup — positionTick Comma Trick Will Work
283 11:07a 🔵 updateLayout() Skips Invisible Nodes — Popup Children Have Stale Layout Until First Visible Frame
S44 Fix slash command autocomplete popup broken spacing on first paint (hover-to-fix bug) (May 25, 11:08 AM)
S46 Fix slash command autocomplete popup broken spacing on first paint (hover-to-fix bug) (May 25, 11:11 AM)
S45 Fix slash command autocomplete popup broken spacing on first paint (hover-to-fix bug) (May 25, 11:17 AM)
286 11:19a 🔴 Autocomplete popup spacing fix ineffective — bug still present after hover
287 11:29a 🔵 AutocompleteRow edit applied but file still has old version with minHeight — idempotent edit ran again
288 11:30a 🔄 popupVisible extracted as named createMemo in autocomplete.tsx
289 11:31a 🔵 frameId increment location found in OpenTUI render loop
290 " 🔵 OpenTUI render loop order: frameId++ → RAF callbacks → then layout/render
291 11:32a 🔵 OpenTUI full render loop order: frameId++ → RAF → frameCallbacks → root.render → renderNative
292 11:33a 🔵 Major autocomplete.tsx refactor: popupLayout() replaces position()/height() split
293 11:34a 🔵 popupLayout memo uses autocompleteBounds() imported from external util, reads dimensions() + positionTick() + layoutEpoch()
294 " 🟣 New autocomplete-layout.ts file extracts all popup geometry calculations
295 " 🔵 AutocompleteRow REVERTED to minHeight toggle — paddingLeft={active() ? 1 : 2} kept but minHeight restored
296 11:35a 🟣 AutocompleteRow description text adapts to narrow mode — word wrap vs truncation
297 " 🔵 Two different autocomplete.tsx versions exist simultaneously — 993-line WIP and 911-line committed
S47 Fix autocomplete popup spacing broken on first paint in awakened package — requires hover to fix (May 25, 11:38 AM)
**Investigated**: - Root cause: OpenTUI's `updateFromLayout()` per-frame dedup guard (`if (this._lastLayoutFrame === frameId) return`) causes stale layout on first popup paint
    - Secondary: Solid reconciler same-value guard (`if (value === prevProps[prop]) continue`) skips repeated yoga setter calls with same prop value
    - Confirmed committed 911-line version was the running code — WIP 993-line file had fixes but wasn't applied to the app
    - Read full autocomplete.tsx baseline (911 lines) to understand the unmodified state

**Learned**: - `border=["left"]` (SplitBorder "▌") consumes 1 terminal column. Active rows need `paddingLeft={1}` not 2 to keep text aligned with inactive rows that have `paddingLeft={2}` and no border
    - Direct property assignment on scroll renderable (`scroll.height = height()`) bypasses Solid reconciler, calls `yogaNode.setHeight()` directly — yoga always marks dirty on setHeight → fresh calculateLayout next frame → correct child positions
    - `markDirty()` crashes (reentrant yoga calculateLayout during lifecycle), so direct height assignment is the safe bypass

**Completed**: Two fixes applied directly to the committed autocomplete.tsx (911-line baseline, now ~924 lines):
    
    1. **`scroll.height` imperative bypass** — added `createEffect` that fires `setTimeout(0)` after popup becomes visible/layoutReady, sets `scroll.height = height()` directly on the renderable object, forcing yoga to mark dirty and recalculate
    
    2. **`paddingLeft={active() ? 1 : 2}`** — compensates for SplitBorder consuming 1 col when border active, keeping label alignment consistent between active/inactive rows

**Next Steps**: - Rebuild the app and test whether the spacing fix works on first paint without hover
    - If still broken, investigate whether `scroll.height` assignment actually triggers yoga dirty mark (may need to inspect @opentui/core setter for scrollbox height)
    - Potential additional fix: add layoutEpoch gating (`layoutEpoch >= 2`) to delay popup visibility until after layout settles — requires adding layoutEpoch signal + three-bump effect (sync + setTimeout(0) + RAF)


Access 249k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>