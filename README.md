<p align="center">
  <a href="https://github.com/Tlkh201313/awakening-cli-new-gen">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="Awakening CLI logo">
    </picture>
  </a>
</p>

<p align="center"><strong>Awakening CLI</strong> — AI coding agent (OpenCode fork)</p>

<p align="center">
  <a href="https://github.com/Tlkh201313/awakening-cli-new-gen/releases"><img alt="Release" src="https://img.shields.io/github/v/release/Tlkh201313/awakening-cli-new-gen?style=flat-square" /></a>
  <a href="https://github.com/Tlkh201313/awakening-cli-new-gen/actions/workflows/test.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/Tlkh201313/awakening-cli-new-gen/test.yml?style=flat-square&branch=dev" /></a>
  <a href="https://github.com/anomalyco/opencode"><img alt="Upstream" src="https://img.shields.io/badge/upstream-OpenCode-blue?style=flat-square" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![Awakening CLI Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://github.com/Tlkh201313/awakening-cli-new-gen)

> **Awakening CLI** is an independent fork of [OpenCode](https://github.com/anomalyco/opencode). It ships the **Awakened** agent runtime with capability packs, design auto-routing, memory, and a terminal + web UI. This repository is maintained at [Tlkh201313/awakening-cli-new-gen](https://github.com/Tlkh201313/awakening-cli-new-gen).

---

## Installation

### From source (recommended for this fork)

```bash
git clone https://github.com/Tlkh201313/awakening-cli-new-gen.git
cd awakening-cli-new-gen
bun install
bun run --cwd packages/awakened build
# run CLI
bun run --cwd packages/awakened --conditions=browser src/index.ts
```

### From release binaries

Download **v1.0.0** (or latest) from [GitHub Releases](https://github.com/Tlkh201313/awakening-cli-new-gen/releases).

```bash
# Example: install script from this repo (after cloning)
./install --version 1.0.0
```

### Install directory

The install script respects, in order:

1. `$AWAKENED_INSTALL_DIR`
2. `$XDG_BIN_DIR`
3. `$HOME/bin`
4. `$HOME/.awakened/bin`

```bash
AWAKENED_INSTALL_DIR=$HOME/.local/bin ./install --version 1.0.0
```

## Quick start

```bash
awakened          # terminal UI
awakened serve      # local server + web app
awakened --version  # should print 1.0.0
```

Configuration lives in `.awakened/` (project) or `~/.awakened/` (global). See [AGENTS.md](./AGENTS.md) for contributor conventions.

## Agents

Switch agents with `Tab` in the TUI:

- **build** — full-access development agent (default)
- **plan** — read-only analysis and exploration

Use `@general` for complex multi-step searches. Capability packs (e.g. **awakened-design**) activate automatically and appear as `using <pack-id>` in the UI.

## Desktop app (beta)

Desktop builds are published on [Releases](https://github.com/Tlkh201313/awakening-cli-new-gen/releases) when available:

| Platform              | Artifact                           |
| --------------------- | ---------------------------------- |
| macOS (Apple Silicon) | `awakened-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `awakened-desktop-mac-x64.dmg`     |
| Windows               | `awakened-desktop-windows-x64.exe` |
| Linux                 | `.deb`, `.rpm`, or `.AppImage`     |

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) — dev setup and PR guidelines
- [SECURITY.md](./SECURITY.md) — threat model and reporting
- [AGENTS.md](./AGENTS.md) — coding standards for this repo
- Upstream reference: [OpenCode docs](https://opencode.ai/docs)

## Contributing

Contributions welcome on this fork. Read [CONTRIBUTING.md](./CONTRIBUTING.md) first. For upstream OpenCode changes, consider contributing to [anomalyco/opencode](https://github.com/anomalyco/opencode) as well.

## License

MIT — see [LICENSE](./LICENSE). Based on OpenCode; see upstream for original copyright.
