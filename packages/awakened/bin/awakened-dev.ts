#!/usr/bin/env bun

import path from "path"
import { AWAKENED_START_DIRECTORY } from "@awakened-ai/core/util/awakened-process"

const root = path.join(import.meta.dir, "..")
const startDir = process.cwd()
const proc = Bun.spawn(
  [process.execPath, "run", "--conditions=browser", path.join(root, "src/index.ts"), ...process.argv.slice(2)],
  {
    // Resolve deps from packages/awakened; project directory comes from AWAKENED_START_DIRECTORY.
    cwd: root,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env, [AWAKENED_START_DIRECTORY]: startDir },
  },
)

process.exit(await proc.exited)
