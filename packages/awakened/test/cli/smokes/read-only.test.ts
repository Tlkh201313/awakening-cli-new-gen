// Speed: each test pays ~1.5s for bun startup when serialized. Cases run
// concurrently — each gets an isolated temp home and LLM port via the harness.
// Optional bundle path: `bun run prebuild:test-cli` then AWAKENED_TEST_CLI=bundle.
import { describe, expect } from "bun:test"
import { Effect } from "effect"
import { cliIt } from "../../lib/cli-process"

describe("awakened read-only commands (smoke)", () => {
  cliIt.concurrent(
    "mcp list: exits 0",
    ({ awakened }) =>
      Effect.gen(function* () {
        yield* awakened.spawnExpect(["mcp", "list"], 0, { label: "mcp list" })
      }),
    60_000,
  )

  cliIt.concurrent(
    "providers list: exits 0 and prints the credentials section",
    ({ awakened }) =>
      Effect.gen(function* () {
        const r = yield* awakened.spawnExpect(["providers", "list"], 0, {
          label: "providers list",
          stdout: "Credentials",
        })
        expect(r.stdout).toContain("Credentials")
      }),
    60_000,
  )

  cliIt.concurrent(
    "models: exits 0 and lists the test model",
    ({ awakened }) =>
      Effect.gen(function* () {
        const r = yield* awakened.spawnExpect(["models"], 0, {
          label: "models",
          stdout: "test/test-model",
        })
        expect(r.stdout).toContain("test/test-model")
      }),
    60_000,
  )

  cliIt.concurrent(
    "agent list: exits 0",
    ({ awakened }) =>
      Effect.gen(function* () {
        yield* awakened.spawnExpect(["agent", "list"], 0, { label: "agent list" })
      }),
    60_000,
  )

  cliIt.concurrent(
    "session list: exits 0",
    ({ awakened }) =>
      Effect.gen(function* () {
        yield* awakened.spawnExpect(["session", "list"], 0, { label: "session list" })
      }),
    60_000,
  )

  cliIt.concurrent(
    "stats: exits 0",
    ({ awakened }) =>
      Effect.gen(function* () {
        yield* awakened.spawnExpect(["stats"], 0, { label: "stats" })
      }),
    60_000,
  )

  cliIt.concurrent(
    "db path: exits 0 and prints a path or :memory:",
    ({ awakened }) =>
      Effect.gen(function* () {
        const r = yield* awakened.spawnExpect(["db", "path"], 0, { label: "db path" })
        expect(r.stdout.trim()).toMatch(/^(:memory:|[/\\].+\.(db|sqlite|sqlite3))$/i)
      }),
    60_000,
  )
})
