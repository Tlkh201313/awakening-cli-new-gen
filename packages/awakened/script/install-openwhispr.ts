#!/usr/bin/env bun
// Clone OpenWhispr, apply Awakened patches, install deps, fetch local whisper models tooling.
import path from "node:path"
import fs from "node:fs/promises"
import { Process } from "../src/util/process"

const OPENWHISPR_GIT = "https://github.com/OpenWhispr/openwhispr.git"
const OPENWHISPR_REF = process.env.OPENWHISPR_GIT_REF?.trim() || "v1.7.2"

const awakenedRoot = path.resolve(import.meta.dir, "..")
const vendorRoot = path.join(awakenedRoot, "vendor/openwhispr")
const manifestPath = path.join(vendorRoot, ".awakened-manifest.json")

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function git(args: string[]) {
  const result = await Process.run(["git", ...args], { cwd: vendorRoot, nothrow: true })
  if (result.code !== 0) {
    throw new Error(result.stderr?.toString().trim() || `git ${args.join(" ")} failed`)
  }
  return result.stdout?.toString().trim() ?? ""
}

async function npm(args: string[]) {
  const cmd = process.platform === "win32" ? "npm.cmd" : "npm"
  const result = await Process.run([cmd, ...args], { cwd: vendorRoot, nothrow: true })
  if (result.code !== 0) {
    throw new Error(result.stderr?.toString().trim() || `npm ${args.join(" ")} failed`)
  }
}

async function resolveCommit() {
  return git(["rev-parse", "HEAD"])
}

console.log(`OpenWhispr vendor dir: ${vendorRoot}`)

if (!(await fileExists(path.join(vendorRoot, ".git")))) {
  await fs.mkdir(path.dirname(vendorRoot), { recursive: true })
  const parent = path.dirname(vendorRoot)
  if (await fileExists(vendorRoot)) {
    throw new Error(`Remove ${vendorRoot} (not a git clone) and re-run install-openwhispr`)
  }
  console.log(`Cloning ${OPENWHISPR_GIT} …`)
  const clone = await Process.run(["git", "clone", "--depth", "1", "--branch", OPENWHISPR_REF, OPENWHISPR_GIT, vendorRoot], {
    cwd: parent,
    nothrow: true,
  })
  if (clone.code !== 0) {
    console.log("Shallow tag clone failed, cloning main …")
    const fallback = await Process.run(["git", "clone", OPENWHISPR_GIT, vendorRoot], { cwd: parent, nothrow: true })
    if (fallback.code !== 0) {
      throw new Error(fallback.stderr?.toString().trim() || "git clone failed")
    }
    await Process.run(["git", "checkout", OPENWHISPR_REF], { cwd: vendorRoot, nothrow: true })
  }
}

console.log("Applying Awakened patches …")
const patch = await Process.run(["bun", "run", path.join(awakenedRoot, "integrations/openwhispr/apply-patches.ts")], {
  cwd: awakenedRoot,
})
if (patch.code !== 0) process.exit(patch.code)

console.log("Installing OpenWhispr dependencies (npm) …")
await npm(["install"])

console.log("Downloading whisper.cpp binaries for local STT …")
await npm(["run", "download:whisper-cpp"])

const commit = await resolveCommit()
await Bun.write(
  manifestPath,
  JSON.stringify(
    {
      git: OPENWHISPR_GIT,
      ref: OPENWHISPR_REF,
      commit,
      repoDir: vendorRoot,
      launch: { command: process.platform === "win32" ? "npm.cmd" : "npm", args: ["start"] },
      patchedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
)

console.log("OpenWhispr source ready. Awakened /voice launches this build (not the store app).")
console.log("Edit upstream in vendor/openwhispr, then re-run: bun run install-openwhispr")
