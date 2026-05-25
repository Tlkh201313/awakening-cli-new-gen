#!/usr/bin/env bun
// Pre-installs whisper.cpp + a Handy-compatible GGML model for offline /voice dictation.
import { ensureWhisperLocal, voiceDataDir, voiceModelFromEnv, VOICE_MODELS } from "../src/cli/cmd/tui/util/voice/whisper-local"

const modelId = voiceModelFromEnv()
const model = VOICE_MODELS[modelId]

console.log(`Installing offline voice deps into ${voiceDataDir()}`)
console.log(`Model: ${model.label} (${model.file})`)

await ensureWhisperLocal({
  onProgress(message) {
    console.log(message)
  },
})

console.log("Voice dependencies ready.")
