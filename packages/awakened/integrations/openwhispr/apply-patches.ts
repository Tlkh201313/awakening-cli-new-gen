#!/usr/bin/env bun
/**
 * Applies Awakened-only patches onto a cloned OpenWhispr repo (vendor/openwhispr).
 * Re-run after upstream pulls: bun run integrations/openwhispr/apply-patches.ts
 */
import path from "node:path"
import fs from "node:fs/promises"

const awakenedRoot = path.resolve(import.meta.dir, "../..")
const vendorRoot = path.join(awakenedRoot, "vendor/openwhispr")

const MARKER = "/* awakened-voice-bridge */"

const patches: { file: string; insertAfter: string; block: string }[] = [
  {
    file: "src/helpers/clipboard.js",
    insertAfter: "async pasteText(text, options = {}) {",
    block: `
    ${MARKER}
    if (process.env.AWAKENED_VOICE_BRIDGE === "1") {
      this.safeLog("Awakened CLI: paste disabled — transcription goes to Awakened prompt only");
      return { method: "awakened-bridge", pasted: false };
    }
`,
  },
]

async function applyPatch(spec: (typeof patches)[number]) {
  const target = path.join(vendorRoot, spec.file)
  let source = await fs.readFile(target, "utf8")
  if (source.includes(MARKER)) {
    console.log(`skip (already patched): ${spec.file}`)
    return
  }
  const index = source.indexOf(spec.insertAfter)
  if (index < 0) throw new Error(`Patch anchor not found in ${spec.file}`)
  const insertAt = index + spec.insertAfter.length
  source = source.slice(0, insertAt) + spec.block + source.slice(insertAt)
  await fs.writeFile(target, source)
  console.log(`patched: ${spec.file}`)
}

if (!(await Bun.file(path.join(vendorRoot, "package.json")).exists())) {
  console.error(`Missing ${vendorRoot} — run: bun run install-openwhispr`)
  process.exit(1)
}

for (const spec of patches) await applyPatch(spec)
console.log("OpenWhispr Awakened patches applied.")
