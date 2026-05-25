import { expect, test } from "bun:test"
import { parseMarketplaceInput, parsePluginIdentifier } from "../../src/plugin/marketplace/parse"
import { githubGitUrl, rewriteGithubCloneUrl } from "../../src/plugin/marketplace/github"

test("githubGitUrl uses mirror env when set", () => {
  const previous = process.env.AWAKENED_REPO_CLONE_GITHUB_BASE_URL
  process.env.AWAKENED_REPO_CLONE_GITHUB_BASE_URL = "https://mirror.example/github/"
  try {
    expect(githubGitUrl("obra/superpowers")).toBe("https://mirror.example/github/obra/superpowers.git")
  } finally {
    if (previous) process.env.AWAKENED_REPO_CLONE_GITHUB_BASE_URL = previous
    else delete process.env.AWAKENED_REPO_CLONE_GITHUB_BASE_URL
  }
})

test("rewriteGithubCloneUrl rewrites github.com urls", () => {
  expect(rewriteGithubCloneUrl("https://github.com/obra/superpowers.git")).toBe(
    "https://github.com/obra/superpowers.git",
  )
})

test("parseMarketplaceInput accepts owner/repo shorthand", async () => {
  const out = await parseMarketplaceInput("anthropics/claude-plugins-official")
  expect(out).toEqual({ source: "github", repo: "anthropics/claude-plugins-official" })
})

test("parseMarketplaceInput accepts github ref suffix", async () => {
  const out = await parseMarketplaceInput("obra/superpowers#main")
  expect(out).toEqual({ source: "github", repo: "obra/superpowers", ref: "main" })
})

test("parsePluginIdentifier splits plugin@marketplace", () => {
  expect(parsePluginIdentifier("superpowers@claude-plugins-official")).toEqual({
    name: "superpowers",
    marketplace: "claude-plugins-official",
  })
})

test("parsePluginIdentifier leaves scoped npm packages alone", () => {
  expect(parsePluginIdentifier("@acme/awakened-plugin")).toEqual({
    name: "@acme/awakened-plugin",
    marketplace: undefined,
  })
})
