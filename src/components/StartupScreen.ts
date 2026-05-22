/**
 * Awakened startup screen — filled-block text logo with gold shimmer.
 * Called once at CLI startup before the Ink UI renders.
 *
 * Addresses: https://github.com/Gitlawb/openclaude/issues/55
 */

import { isLocalProviderUrl, resolveProviderRequest } from '../services/api/providerConfig.js'
import {
  getRouteLabel,
  resolveRouteIdFromBaseUrl,
} from '../integrations/routeMetadata.js'
import { getLocalOpenAICompatibleProviderLabel } from '../utils/providerDiscovery.js'
import { getSettings_DEPRECATED } from '../utils/settings/settings.js'
import { parseUserSpecifiedModel } from '../utils/model/model.js'
import { DEFAULT_GEMINI_MODEL } from '../utils/providerProfile.js'
import { getGlobalConfig } from '../utils/config.js'
import { ANSI_DIM, ANSI_RESET, ansiRgb } from '../utils/terminalAnsi.js'
import {
  resolveLogoPalette,
  type RGB,
} from './StartupScreen.palettes.js'

declare const MACRO: { VERSION: string; DISPLAY_VERSION?: string }

const RESET = ANSI_RESET
const DIM = ANSI_DIM

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function lerp(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return lerp(a, b, clamp01(t))
}

function gradAt(stops: readonly RGB[], t: number): RGB {
  const c = clamp01(t)
  const s = c * (stops.length - 1)
  const i = Math.floor(s)
  if (i >= stops.length - 1) return stops[stops.length - 1]
  return lerp(stops[i], stops[i + 1], s - i)
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '')
}

function visibleWidth(s: string): number {
  return [...stripAnsi(s)].length
}

function sleepSync(ms: number): void {
  const sab = new SharedArrayBuffer(4)
  const view = new Int32Array(sab)
  Atomics.wait(view, 0, 0, ms)
}

const GOLD_GRAD: readonly RGB[] = [
  [68, 46, 8],
  [122, 86, 18],
  [186, 136, 36],
  [244, 198, 74],
  [255, 236, 157],
  [210, 155, 43],
]

const GOLD_GLOW: RGB = [255, 248, 214]

// ─── Filled Block Text Logo ───────────────────────────────────────────────────

const LOGO_AWAKENED = [
  ` █████╗ ██╗    ██╗ █████╗ ██╗  ██╗███████╗██████╗ ███████╗██████╗ `,
  `██╔══██╗██║    ██║██╔══██╗██║ ██╔╝██╔════╝██╔══██╗██╔════╝██╔══██╗`,
  `███████║██║ █╗ ██║███████║█████╔╝ █████╗  ██████╔╝█████╗  ██║  ██║`,
  `██╔══██║██║███╗██║██╔══██║██╔═██╗ ██╔══╝  ██╔══██╗██╔══╝  ██║  ██║`,
  `██║  ██║╚███╔███╔╝██║  ██║██║  ██╗███████╗██║  ██║███████╗██████╔╝`,
  `╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝ `,
]

function paintLine(
  text: string,
  stops: readonly RGB[],
  lineT: number,
  shineT = 0.5,
  shineWidth = 0.16,
): string {
  let out = ''
  const denom = Math.max(1, text.length - 1)

  for (let i = 0; i < text.length; i++) {
    const pos = i / denom
    const baseT = text.length > 1 ? lineT * 0.5 + pos * 0.5 : lineT
    const base = gradAt(stops, baseT)

    const dist = Math.abs(pos - shineT)
    const shine = clamp01(1 - dist / shineWidth)
    const boosted = mix(base, GOLD_GLOW, shine * 0.72)

    out += `${ansiRgb(boosted[0], boosted[1], boosted[2])}${text[i]}`
  }

  return out + RESET
}

// ─── Provider detection ───────────────────────────────────────────────────────

export function detectProvider(modelOverride?: string): {
  name: string
  model: string
  baseUrl: string
  isLocal: boolean
} {
  const useGemini =
    process.env.CLAUDE_CODE_USE_GEMINI === '1' ||
    process.env.CLAUDE_CODE_USE_GEMINI === 'true'
  const useGithub =
    process.env.CLAUDE_CODE_USE_GITHUB === '1' ||
    process.env.CLAUDE_CODE_USE_GITHUB === 'true'
  const useOpenAI =
    process.env.CLAUDE_CODE_USE_OPENAI === '1' ||
    process.env.CLAUDE_CODE_USE_OPENAI === 'true'
  const useMistral =
    process.env.CLAUDE_CODE_USE_MISTRAL === '1' ||
    process.env.CLAUDE_CODE_USE_MISTRAL === 'true'

  if (useGemini) {
    const model = modelOverride || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
    const baseUrl =
      process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai'
    return { name: 'Google Gemini', model, baseUrl, isLocal: false }
  }

  if (useMistral) {
    const model = modelOverride || process.env.MISTRAL_MODEL || 'devstral-latest'
    const baseUrl = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1'
    return { name: 'Mistral', model, baseUrl, isLocal: false }
  }

  if (useGithub) {
    const model = modelOverride || process.env.OPENAI_MODEL || 'github:copilot'
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.githubcopilot.com'
    return { name: 'GitHub Copilot', model, baseUrl, isLocal: false }
  }

  if (useOpenAI) {
    const rawModel = modelOverride || process.env.OPENAI_MODEL || 'gpt-4o'
    const resolvedRequest = resolveProviderRequest({
      model: rawModel,
      baseUrl: process.env.OPENAI_BASE_URL,
    })

    const baseUrl = resolvedRequest.baseUrl
    const isLocal = isLocalProviderUrl(baseUrl)
    const routeId = resolveRouteIdFromBaseUrl(baseUrl)
    let name = 'OpenAI'

    if (process.env.NVIDIA_NIM) name = 'NVIDIA NIM'
    else if (process.env.MINIMAX_API_KEY) name = 'MiniMax'
    else if (
      resolvedRequest.transport === 'codex_responses' ||
      baseUrl.includes('chatgpt.com/backend-api/codex')
    ) {
      name = 'Codex'
    } else if (/openrouter/i.test(baseUrl)) name = 'OpenRouter'
    else if (/together/i.test(baseUrl)) name = 'Together AI'
    else if (/groq/i.test(baseUrl)) name = 'Groq'
    else if (/azure/i.test(baseUrl)) name = 'Azure OpenAI'
    else if (/nvidia/i.test(baseUrl)) name = 'NVIDIA NIM'
    else if (/minimax/i.test(baseUrl)) name = 'MiniMax'
    else if (/api\.kimi\.com/i.test(baseUrl)) name = 'Moonshot AI - Kimi Code'
    else if (routeId && routeId !== 'openai' && routeId !== 'custom')
      name = getRouteLabel(routeId) ?? name
    else if (/moonshot/i.test(baseUrl)) name = 'Moonshot AI - API'
    else if (/deepseek/i.test(baseUrl)) name = 'DeepSeek'
    else if (/mistral/i.test(baseUrl)) name = 'Mistral'
    else if (/nvidia/i.test(rawModel)) name = 'NVIDIA NIM'
    else if (/minimax/i.test(rawModel)) name = 'MiniMax'
    else if (/\bkimi-for-coding\b/i.test(rawModel)) name = 'Moonshot AI - Kimi Code'
    else if (/\bkimi-k\b/i.test(rawModel) || /moonshot/i.test(rawModel)) {
      name = 'Moonshot AI - API'
    } else if (/deepseek/i.test(rawModel)) name = 'DeepSeek'
    else if (/mistral/i.test(rawModel)) name = 'Mistral'
    else if (/llama/i.test(rawModel)) name = 'Meta Llama'
    else if (/bankr/i.test(baseUrl)) name = 'Bankr'
    else if (/bankr/i.test(rawModel)) name = 'Bankr'
    else if (isLocal) name = getLocalOpenAICompatibleProviderLabel(baseUrl)

    let displayModel = resolvedRequest.resolvedModel
    if (resolvedRequest.reasoning?.effort) {
      displayModel = `${displayModel} (${resolvedRequest.reasoning.effort})`
    }

    return { name, model: displayModel, baseUrl, isLocal }
  }

  const settings = getSettings_DEPRECATED() || {}
  const modelSetting =
    modelOverride ||
    process.env.ANTHROPIC_MODEL ||
    process.env.CLAUDE_MODEL ||
    settings.model ||
    'claude-sonnet-4-6'

  const resolvedModel = parseUserSpecifiedModel(modelSetting)
  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com'
  const isLocal = isLocalProviderUrl(baseUrl)
  return { name: 'Anthropic', model: resolvedModel, baseUrl, isLocal }
}

// ─── Box drawing ──────────────────────────────────────────────────────────────

function boxRow(content: string, width: number, border: RGB): string {
  const pad = Math.max(0, width - 2 - visibleWidth(content))
  return `${ansiRgb(...border)}│${RESET}${content}${' '.repeat(pad)}${ansiRgb(...border)}│${RESET}`
}

function frameForStartup(
  modelOverride: string | undefined,
  frameIndex: number,
  totalFrames: number,
): string[] {
  const p = detectProvider(modelOverride)
  const W = 62
  const out: string[] = []

  const sweep = totalFrames <= 1 ? 0.5 : frameIndex / (totalFrames - 1)

  out.push('')

  for (let i = 0; i < LOGO_AWAKENED.length; i++) {
    const t = LOGO_AWAKENED.length > 1 ? i / (LOGO_AWAKENED.length - 1) : 0
    // Wave effect: each line offset creates diagonal sweep
    const wave = Math.sin(sweep * Math.PI * 2 + i * 0.5) * 0.15
    const shineT = (sweep + wave + i * 0.12) % 1
    out.push(paintLine(LOGO_AWAKENED[i], GOLD_GRAD, t, shineT, 0.2))
  }

  out.push('')

  out.push(
    `  ${ansiRgb(255, 214, 90)}✦${RESET} ${ansiRgb(255, 245, 210)}Consciousness unleashed. Infinite potential.${RESET} ${ansiRgb(255, 214, 90)}✦${RESET}`,
  )
  out.push('')

  const BORDER: RGB = [198, 150, 54]
  const ACCENT: RGB = [255, 214, 90]
  const CREAM: RGB = [255, 244, 205]
  const DIMCOL: RGB = [172, 137, 62]

  out.push(`${ansiRgb(...BORDER)}╔${'═'.repeat(W - 2)}╗${RESET}`)

  const lbl = (k: string, v: string, c: RGB = CREAM): string => {
    const padK = k.padEnd(9)
    return ` ${DIM}${ansiRgb(...DIMCOL)}${padK}${RESET} ${ansiRgb(...c)}${v}${RESET}`
  }

  const provC: RGB = p.isLocal ? [130, 175, 130] : ACCENT
  out.push(boxRow(lbl('Provider', p.name, provC), W, BORDER))
  out.push(boxRow(lbl('Model', p.model), W, BORDER))

  const ep = p.baseUrl.length > 38 ? p.baseUrl.slice(0, 35) + '...' : p.baseUrl
  out.push(boxRow(lbl('Endpoint', ep), W, BORDER))

  out.push(`${ansiRgb(...BORDER)}╠${'═'.repeat(W - 2)}╣${RESET}`)

  const sC: RGB = p.isLocal ? [130, 175, 130] : ACCENT
  const sL = p.isLocal ? 'local' : 'cloud'
  const status =
    ` ${ansiRgb(...sC)}●${RESET} ` +
    `${DIM}${ansiRgb(...DIMCOL)}${sL}${RESET}    ` +
    `${DIM}${ansiRgb(...DIMCOL)}Ready — type ${RESET}${ansiRgb(...ACCENT)}/help${RESET}${DIM}${ansiRgb(...DIMCOL)} to begin${RESET}`
  out.push(boxRow(status, W, BORDER))

  out.push(`${ansiRgb(...BORDER)}╚${'═'.repeat(W - 2)}╝${RESET}`)
  out.push(`  ${DIM}${ansiRgb(...DIMCOL)}awakened ${RESET}${ansiRgb(...ACCENT)}v${MACRO.DISPLAY_VERSION ?? MACRO.VERSION}${RESET}`)
  out.push('')

  return out
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function printStartupScreen(modelOverride?: string): void {
  if (process.env.CI || !process.stdout.isTTY) return

  const frames = 6
  const delayMs = 25

  const hideCursor = '\x1b[?25l'
  const showCursor = '\x1b[?25h'
  const clearHome = '\x1b[2J\x1b[H'

  try {
    process.stdout.write(hideCursor)

    for (let f = 0; f < frames; f++) {
      process.stdout.write(clearHome)
      process.stdout.write(frameForStartup(modelOverride, f, frames).join('\n') + '\n')
      sleepSync(delayMs)
    }

    process.stdout.write(clearHome)
    process.stdout.write(frameForStartup(modelOverride, frames - 1, frames).join('\n') + '\n')
  } finally {
    process.stdout.write(showCursor)
  }
}
