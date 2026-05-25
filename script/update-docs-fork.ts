#!/usr/bin/env bun

const repo = "Tlkh201313/awakening-cli-new-gen"
const repoUrl = `https://github.com/${repo}`
const upstream = "https://github.com/anomalyco/opencode"

const replacements: Array<[string | RegExp, string]> = [
  ["anomalyco/awakened", repo],
  ["github.com/anomalyco/awakened", `github.com/${repo}`],
  ["https://awakened.ai/discord", repoUrl],
  ["https://discord.gg/awakened", repoUrl],
  ["https://x.com/awakened", repoUrl],
  ["https://awakened.ai/install", `${repoUrl}#installation`],
  ["https://awakened.ai/download", `${repoUrl}/releases`],
  ["https://awakened.ai/docs", `${repoUrl}#documentation`],
  ["https://awakened.ai/docs/agents", `${repoUrl}#agents`],
  ["https://awakened.ai", repoUrl],
  ["anomalyco/tap/awakened", `${repo} (build from source)`],
]

const forkBanner = `> **Awakening CLI** is an independent fork of [OpenCode](${upstream}), maintained at [${repo}](${repoUrl}).\n\n`

for await (const file of new Bun.Glob("**/*.md").scan(".")) {
  if (file.includes("node_modules") || file.includes("dist") || file.includes(".worktrees")) continue
  let text = await Bun.file(file).text()
  let next = text
  for (const [from, to] of replacements) {
    next = typeof from === "string" ? next.replaceAll(from, to) : next.replace(from, to)
  }
  if (file === "README.md" || file.startsWith("README.")) {
    if (!next.includes("independent fork of")) {
      const insertAt = next.indexOf("\n\n---")
      if (insertAt > 0) next = next.slice(0, insertAt) + "\n\n" + forkBanner.trim() + next.slice(insertAt)
    }
  }
  if (next !== text) {
    await Bun.file(file).write(next)
    console.log("updated", file)
  }
}
