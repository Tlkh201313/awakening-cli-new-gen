#!/usr/bin/env bun
// Bundles the CLI once for subprocess tests. Cuts per-spawn transpile cost when
// running many CLI harness cases (smokes, help snapshots, run-process).
//
// Opt in from tests:
//   AWAKENED_TEST_CLI=bundle bun test test/cli/smokes/read-only.test.ts
//
// Rebuild after CLI source changes. The harness falls back to live transpile
// when AWAKENED_TEST_CLI is unset, so CI stays on the safe default path.
import path from "node:path"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"

const dir = path.resolve(import.meta.dir, "..")
process.chdir(dir)

const outdir = path.join(dir, ".test-cli")
await Bun.$`rm -rf ${outdir}`

const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir,
  target: "bun",
  conditions: ["browser"],
  tsconfig: "./tsconfig.json",
  plugins: [createSolidTransformPlugin()],
  external: ["node-gyp"],
  sourcemap: "none",
  minify: false,
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

const entry = path.join(outdir, "index.js")
console.log(`prebuild:test-cli wrote ${entry}`)
console.log(`Try: AWAKENED_TEST_CLI=bundle bun test test/cli/smokes/read-only.test.ts`)
