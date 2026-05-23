# Awakened CLI

**Awakened** is a fast, terminal-first coding agent (OpenClaude fork). One workflow for prompts, tools, MCP, agents, and streaming — with **OpenAI-compatible APIs**, Gemini, Ollama, NVIDIA NIM, GitHub Models, and 200+ providers.

**Repository:** [github.com/Tlkh201313/awakening-cli-new-gen](https://github.com/Tlkh201313/awakening-cli-new-gen)

## Why use Awakened

| Area | What you get |
|------|----------------|
| **Startup** | Returning sessions skip the logo animation; MCP config and REPL modules load in parallel so the input bar appears sooner |
| **UI** | Stream updates are coalesced (~48ms on Windows) so the terminal does not freeze on every token or tool-argument chunk |
| **Context** | **Awakened Graphify** auto-loads guidance for [graphify](https://github.com/safishamsi/graphify) — build a knowledge graph once, query with `--budget` instead of re-reading the whole repo (up to **~71×** fewer tokens on large corpora, per upstream benchmarks) |
| **Skills** | Six auto packs (Browser, Research, Marketing, Skills Vault, Graphify, Productivity) show **Reading skill …** when your task matches — toggle with `/awakened` |
| **Providers** | `/provider` profiles, NVIDIA NIM, local Ollama, OpenAI shims, preconnect and retry tuning |

## Install

Requires **Bun**, **Node 18+**, and **ripgrep** (`rg --version` in your PATH).

### From this repo (recommended)

```bash
git clone https://github.com/Tlkh201313/awakening-cli-new-gen.git
cd awakening-cli-new-gen
bun install
bun run build
```

Run without a global install:

```bash
bun run start
# or: node dist/cli.mjs
```

Install the `openclaude` command globally (same binary Awakened uses):

```bash
bun link
openclaude
```

On Windows (PowerShell), after `bun link`:

```powershell
openclaude
```

### One-line global install from GitHub

```bash
npm install -g github:Tlkh201313/awakening-cli-new-gen
openclaude
```

> The CLI entrypoint is named **`openclaude`** in `package.json` (`bin.openclaude`). The UI and branding say **Awakened**.

## Quick start

```bash
openclaude
```

Inside the app:

- `/provider` — set up API keys and saved profiles  
- `/awakened` — enable or disable auto skill packs (Space toggle, Enter save)  
- `/help` — commands and shortcuts  

### Fastest OpenAI-style setup

macOS / Linux:

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://your-endpoint/v1"
openclaude
```

Windows (PowerShell):

```powershell
$env:CLAUDE_CODE_USE_OPENAI = "1"
$env:OPENAI_API_KEY = "your-key"
$env:OPENAI_BASE_URL = "https://your-endpoint/v1"
openclaude
```

### Even faster startup (optional)

Windows (CMD):

```cmd
set AWAKENED_FAST_STARTUP=1
openclaude
```

macOS / Linux:

```bash
export AWAKENED_FAST_STARTUP=1
openclaude
```

Returning users also get a single-frame logo automatically (`numStartups > 0`).

## Benchmarks

From the repo root:

```bash
bun run benchmark:awakened
```

Measured on Windows (2026-05-23):

| Benchmark | Result | Notes |
|-----------|--------|--------|
| Logo animation (first launch) | **~210ms** | 6-frame shimmer before Ink |
| Logo fast path (returning / `AWAKENED_FAST_STARTUP`) | **under 1ms** | Single frame, no sleeps |
| Stream UI coalescing | **2 updates** for 50 scheduled token deltas | Default 48ms flush on Windows |
| Graphify corpus query (upstream) | **~71.5×** token reduction | Mixed code + papers + images; see [graphify README](https://github.com/safishamsi/graphify) |

Profile full startup checkpoints:

Windows (CMD):

```cmd
set CLAUDE_CODE_PROFILE_STARTUP=1
openclaude
```

macOS / Linux:

```bash
export CLAUDE_CODE_PROFILE_STARTUP=1
openclaude
```

Tune UI if needed:

| Variable | Purpose |
|----------|---------|
| `CLAUDE_CODE_STREAM_UI_FLUSH_MS` | Stream coalesce interval (8–200ms, default 48 on Windows) |
| `CLAUDE_CODE_UI_FRAME_MS` | Ink frame interval (8–100ms) |
| `AWAKENED_FAST_STARTUP` | Skip logo animation |

## Awakened auto capabilities

When your message matches, the transcript shows **Reading skill {name}** and injects a compact playbook (not a user slash skill):

| Pack | Best for |
|------|----------|
| Awakened Browser | URLs, live web automation |
| Awakened Research | ML training, evals, papers |
| Awakened Marketing | GTM, SEO, outbound |
| Awakened Skills Vault | [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) |
| Awakened Graphify | Codebase maps, token-heavy exploration |
| Awakened Productivity | [VoltAgent awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) |

Install upstream tools when prompted (e.g. `pip install graphifyy`, `npx antigravity-awesome-skills`).

## Develop

Same repo — useful scripts:

```bash
bun run dev          # build + run
bun run build        # production bundle → dist/cli.mjs
bun run test         # unit tests
bun run smoke        # build + --version check
```

## License

MIT — see [LICENSE](LICENSE).

Issues and updates: [Tlkh201313/awakening-cli-new-gen](https://github.com/Tlkh201313/awakening-cli-new-gen/issues).
