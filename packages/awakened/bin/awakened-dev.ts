#!/usr/bin/env bun

import path from "path"

const root = path.join(import.meta.dir, "..")
const proc = Bun.spawn(
  [process.execPath, "run", "--conditions=browser", path.join(root, "src/index.ts"), ...process.argv.slice(2)],
  {
    cwd: root,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: process.env,
  },
)

process.exit(await proc.exited)
