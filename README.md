# Awakened CLI

**Awakened** is a fast, terminal-first coding agent (OpenClaude fork). One workflow for prompts, tools, MCP, agents, and streaming — with **OpenAI-compatible APIs**, Gemini, Ollama, NVIDIA NIM, GitHub Models, and 200+ providers.

**Repository:** [github.com/Tlkh201313/awakening-cli-new-gen](https://github.com/Tlkh201313/awakening-cli-new-gen)

## Why use Awakened

| Area | What you get |
|------|----------------|
| **Startup** | Returning sessions skip the logo animation; MCP config and REPL modules load in parallel so the input bar appears sooner |
| **UI** | Stream updates are coalesced (~24ms on Windows) so the terminal does not freeze on every token or tool-argument chunk |
| **Context** | **Awakened Graphify** auto-loads guidance for [graphify](https://github.com/safishamsi/graphify) — build a knowledge graph once, query with `--budget` instead of re-reading the whole repo (up to **~71×** fewer tokens on large corpora, per upstream benchmarks) |
| **Skills** | Six auto packs (Browser, Research, Marketing, Skills Vault, Graphify, Productivity) show **Reading skill …** when your task matches — toggle with `/awakened` |
| **Providers** | `/provider` profiles, NVIDIA NIM, local Ollama, OpenAI shims, preconnect and retry tuning |

## Install

Requires **Bun** (to install deps and build), **Node.js 22+** (to run `dist/cli.mjs`), and **ripgrep** (`rg --version` in your PATH).

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

Install the `awakened` command globally (same binary Awakened uses):

```bash
bun link
awakened
```

On Windows (PowerShell), prefer `bun link`. If you use `npm link` and see `EEXIST` for `openclaude.cmd`, a previous global install left shims in `%AppData%\npm\`:

```powershell
npm link --force
# or: npm unlink -g @gitlawb/awakened; npm unlink -g openclaude; npm link
awakened --version
```

Both **`awakened`** and **`openclaude`** point at the same binary (`package.json` `bin` map).

### One-line global install from GitHub

```bash
npm install -g github:Tlkh201313/awakening-cli-new-gen
awakened
```

> Primary command: **`awakened`** (`bin.awakened` in `package.json`). **`openclaude`** is kept as an alias to the same binary for compatibility.

## Where Awakened stores your data

Same model as OpenClaude / Claude Code — everything lives under your **user home**, not inside this git repo:

| Path | Purpose |
|------|---------|
| `~/.awakened/` | Global settings, skills, plugins, session storage, optional `local/` npm install |
| `~/.awakened.json` | Global config file (preferences, OAuth bookkeeping) |
| `~/.awakened-profile.json` | Optional saved provider profile |
| `.awakened/` (in a project) | Project settings, agents, skills, commands |

**First run:** if you already have `~/.openclaude` or `~/.claude`, Awakened **copies** missing files into `~/.awakened` (legacy dirs are left in place).

**Override:** set `CLAUDE_CONFIG_DIR` to use a different config root.

**Never commit** your `.env`, `auth.json`, or real API keys — see [SECURITY.md](./SECURITY.md).

### Permission modes

Awakened can run with different tool-permission policies (`default`, `acceptEdits`, `plan`, `dontAsk`, and `bypassPermissions`). **`bypassPermissions` auto-approves every tool** (shell, file writes, MCP) — only use it when you fully trust the repo and model. See [docs/FEATURE_MATRIX.md](./docs/FEATURE_MATRIX.md) for compile-time features and safety notes.

## Quick start

```bash
awakened
```

Inside the app:

- `/provider` — set up API keys and saved profiles  
- `/awakened` — enable or disable auto skill packs (Space toggle, Enter save)  
- `/help` — commands and shortcuts  
- `/hardware` — live CPU/RAM/heap bars with % (Esc to close, 1s refresh)  

### Fastest OpenAI-style setup

macOS / Linux:

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://your-endpoint/v1"
awakened
```

Windows (PowerShell):

```powershell
$env:CLAUDE_CODE_USE_OPENAI = "1"
$env:OPENAI_API_KEY = "your-key"
$env:OPENAI_BASE_URL = "https://your-endpoint/v1"
awakened
```

### Maximum speed

**Two separate areas:**

#### 1. UI & Startup (CPU/I/O — not GPU)

On **4+ CPU cores** or **Windows**, performance mode auto-enables. Force it:

```powershell
$env:AWAKENED_PERFORMANCE = "1"
awakened
```

**What it does:**
- Widens libuv I/O thread pool (faster file ops, subprocess spawns)
- 12ms stream flush, 16ms UI frames (less Ink jank on Windows)
- Skips logo animation on return visits

**Windows users:** Use **Windows Terminal** (not legacy conhost) for best streaming performance.

#### 2. Model Inference (Cloud vs Local GPU)

- **Cloud APIs** (Anthropic, OpenAI, etc.): GPU in your machine **does not** accelerate tokens. Speed is API-bound (region, model size, context length).
- **Local Ollama/vLLM**: GPU matters. Awakened stays HTTP client; GPU work lives in Ollama daemon. Use `/hardware` to monitor GPU utilization (system-wide, not CLI-specific).

This widens the libuv thread pool, uses faster stream/Ink timing (~8–10ms flush), skips throttled startup prefetches, and shows a single-frame logo. Set `AWAKENED_ECO=1` to disable auto performance mode.

**Client latency (no extra API calls):**

| Env | Effect |
|-----|--------|
| `CLAUDE_CODE_STREAM_UI_FLUSH_MS=8` | Snappier token display (more CPU) |
| `CLAUDE_CODE_DEFERRED_HOOK_WAIT_MS=2000` | Don't block first message on slow SessionStart hooks (default) |
| `OPENCLAUDE_ANIMATED_STARTUP=1` | Re-enable gold logo shimmer (~150ms) |

### Even faster startup (optional)

Windows (CMD):

```cmd
set AWAKENED_FAST_STARTUP=1
awakened
```

macOS / Linux:

```bash
export AWAKENED_FAST_STARTUP=1
awakened
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
| Stream UI coalescing | **2 updates** for 50 scheduled token deltas | Default 24ms flush on Windows |
| Graphify corpus query (upstream) | **~71.5×** token reduction | Mixed code + papers + images; see [graphify README](https://github.com/safishamsi/graphify) |

Profile full startup checkpoints:

Windows (CMD):

```cmd
set CLAUDE_CODE_PROFILE_STARTUP=1
awakened
```

macOS / Linux:

```bash
export CLAUDE_CODE_PROFILE_STARTUP=1
awakened
```

Tune UI if needed:

| Variable | Purpose |
|----------|---------|
| `CLAUDE_CODE_STREAM_UI_FLUSH_MS` | Stream coalesce interval (8–200ms, default 16 on Windows) |
| `AWAKENED_PERFORMANCE` | Snappier UI + parallel startup work (see above) |
| `CLAUDE_CODE_UI_FRAME_MS` | Ink frame interval (8–100ms) |
| `AWAKENED_FAST_STARTUP` | Skip logo animation |
| `AWAKENED_PERFORMANCE` | Snappier UI + parallel startup work (see above) |

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

See [CONTRIBUTING.md](./CONTRIBUTING.md) for PR checks, TypeScript layout, and feature flags. Compile-time capabilities: [docs/FEATURE_MATRIX.md](./docs/FEATURE_MATRIX.md).

```bash
bun run dev          # build + run
bun run build        # production bundle → dist/cli.mjs
bun run test         # unit tests
bun run smoke        # build + --version check
bun run typecheck    # app source (excludes *.test.*)
```

## License

MIT — see [LICENSE](LICENSE).

Issues and updates: [Tlkh201313/awakening-cli-new-gen](https://github.com/Tlkh201313/awakening-cli-new-gen/issues).
