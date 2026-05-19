/**
 * AWAKENED startup screen — adaptive gold/amber animated logo.
 */

const GOLD_GRADIENT: readonly [number, number, number][] = [
  [255, 210, 90],
  [255, 184, 61],
  [255, 145, 0],
  [255, 115, 0],
]

function waveOffset(index: number, frame: number): number {
  return Math.sin((index + frame) * 0.55) * 0.12
}

export function paintAnimatedLine(
  text: string,
  stops: readonly [number, number, number][],
  lineT: number,
  frame = 0,
): string {
  let out = ''

  for (let i = 0; i < text.length; i++) {
    const anim = waveOffset(i, frame)
    const t = Math.max(
      0,
      Math.min(
        1,
        lineT * 0.45 + (i / Math.max(1, text.length - 1)) * 0.55 + anim,
      ),
    )

    const scaled = t * (stops.length - 1)
    const idx = Math.floor(scaled)
    const next = Math.min(stops.length - 1, idx + 1)
    const blend = scaled - idx

    const c1 = stops[idx]
    const c2 = stops[next]

    const r = Math.round(c1[0] + (c2[0] - c1[0]) * blend)
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * blend)
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * blend)

    out += `\x1b[38;2;${r};${g};${b}m${text[i]}`
  }

  return out + '\x1b[0m'
}

// Rebuilt AWAKENED logo — cleaner spacing + more readable proportions
export const LOGO_AWAKENED = [
` █████╗ ██╗    ██╗ █████╗ ██╗  ██╗███████╗███╗   ██╗███████╗██████╗ `,
`██╔══██╗██║    ██║██╔══██╗██║ ██╔╝██╔════╝████╗  ██║██╔════╝██╔══██╗`,
`███████║██║ █╗ ██║███████║█████╔╝ █████╗  ██╔██╗ ██║█████╗  ██║  ██║`,
`██╔══██║██║███╗██║██╔══██║██╔═██╗ ██╔══╝  ██║╚██╗██║██╔══╝  ██║  ██║`,
`██║  ██║╚███╔███╔╝██║  ██║██║  ██╗███████╗██║ ╚████║███████╗██████╔╝`,
`╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚══════╝╚═════╝ `,
]

// Auto responsive centering
export function renderResponsiveLogo(frame = 0): string[] {
  const cols = process.stdout.columns || 80

  const maxWidth = LOGO_AWAKENED.reduce(
    (m, line) => Math.max(m, line.length),
    0,
  )

  const scalePadding = Math.max(0, Math.floor((cols - maxWidth) / 2))

  return LOGO_AWAKENED.map((line, idx) => {
    const t = idx / Math.max(1, LOGO_AWAKENED.length - 1)
    return (
      ' '.repeat(scalePadding) +
      paintAnimatedLine(line, GOLD_GRADIENT, t, frame)
    )
  })
}

// Tiny shimmer animation loop
export function startLogoAnimation(): void {
  if (!process.stdout.isTTY) return

  let frame = 0

  const draw = () => {
    process.stdout.write('\x1b[2J\x1b[0f')

    const rendered = renderResponsiveLogo(frame)

    for (const line of rendered) {
      process.stdout.write(line + '\n')
    }

    frame++
  }

  draw()

  const interval = setInterval(draw, 90)

  process.stdout.on('resize', draw)

  process.on('exit', () => clearInterval(interval))
}

// ─── Provider detection ───────────────────────────────────────────────────────

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

export function detectProvider(modelOverride?: string): { name: string; model: string; baseUrl: string; isLocal: boolean } {
  const useGemini = process.env.CLAUDE_CODE_USE_GEMINI === '1' || process.env.CLAUDE_CODE_USE_GEMINI === 'true'
  const useGithub = process.env.CLAUDE_CODE_USE_GITHUB === '1' || process.env.CLAUDE_CODE_USE_GITHUB === 'true'
  const useOpenAI = process.env.CLAUDE_CODE_USE_OPENAI === '1' || process.env.CLAUDE_CODE_USE_OPENAI === 'true'
  const useMistral = process.env.CLAUDE_CODE_USE_MISTRAL === '1' || process.env.CLAUDE_CODE_USE_MISTRAL === 'true'

  if (useGemini) {
    const model = modelOverride || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
    const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai'
    return { name: 'Google Gemini', model, baseUrl, isLocal: false }
  }

  if (useMistral) {
    const model = modelOverride || process.env.MISTRAL_MODEL || 'devstral-latest'
    const baseUrl = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1'
    return { name: 'Mistral', model, baseUrl, isLocal: false }
  }

  if (useGithub) {
    const model = modelOverride || process.env.OPENAI_MODEL || 'github:copilot'
    const baseUrl =
      process.env.OPENAI_BASE_URL || 'https://api.githubcopilot.com'
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
    // Explicit dedicated-provider env flags win.
    if (process.env.NVIDIA_NIM) name = 'NVIDIA NIM'
    else if (process.env.MINIMAX_API_KEY) name = 'MiniMax'
    else if (
      resolvedRequest.transport === 'codex_responses' ||
      baseUrl.includes('chatgpt.com/backend-api/codex')
    )
      name = 'Codex'
    // Base URL is authoritative — must precede rawModel checks so aggregators
    // (OpenRouter/Together/Groq) aren't mislabelled as DeepSeek/Kimi/etc.
    // when routed to models whose IDs contain a vendor prefix. See issue #855.
    else if (/openrouter/i.test(baseUrl)) name = 'OpenRouter'
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
    // rawModel fallback — fires only when base URL is generic/custom.
    else if (/nvidia/i.test(rawModel)) name = 'NVIDIA NIM'
    else if (/minimax/i.test(rawModel)) name = 'MiniMax'
    else if (/\bkimi-for-coding\b/i.test(rawModel))
      name = 'Moonshot AI - Kimi Code'
    else if (/\bkimi-k/i.test(rawModel) || /moonshot/i.test(rawModel))
      name = 'Moonshot AI - API'
    else if (/deepseek/i.test(rawModel)) name = 'DeepSeek'
    else if (/mistral/i.test(rawModel)) name = 'Mistral'
    else if (/llama/i.test(rawModel)) name = 'Meta Llama'
    else if (/bankr/i.test(baseUrl)) name = 'Bankr'
    else if (/bankr/i.test(rawModel)) name = 'Bankr'
    else if (isLocal) name = getLocalOpenAICompatibleProviderLabel(baseUrl)

    // Resolve model alias to actual model name + reasoning effort
    let displayModel = resolvedRequest.resolvedModel
    if (resolvedRequest.reasoning?.effort) {
      displayModel = `${displayModel} (${resolvedRequest.reasoning.effort})`
    }

    return { name, model: displayModel, baseUrl, isLocal }
  }

  // Default: Anthropic - check settings.model first, then env vars
  const settings = getSettings_DEPRECATED() || {}
  const modelSetting = modelOverride || process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || settings.model || 'claude-sonnet-4-6'
  const resolvedModel = parseUserSpecifiedModel(modelSetting)
  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com'
  const isLocal = isLocalProviderUrl(baseUrl)
  return { name: 'Anthropic', model: resolvedModel, baseUrl, isLocal }
}

// ─── Backward-compatible one-shot startup screen ──────────────────────────────

declare const MACRO: { VERSION: string; DISPLAY_VERSION?: string }

export function printStartupScreen(_modelOverride?: string): void {
  if (process.env.CI || !process.stdout.isTTY) return

  const draw = () => {
    const rendered = renderResponsiveLogo()
    process.stdout.write('\n')
    for (const line of rendered) {
      process.stdout.write(line + '\n')
    }
    process.stdout.write('\n')
  }

  draw()

  const onResize = () => {
    process.stdout.write('\x1b[2J\x1b[0f')
    draw()
  }

  process.stdout.on('resize', onResize)

  // Clean up listener once REPL takes over (first stdin activity)
  const cleanup = () => {
    process.stdout.off('resize', onResize)
    process.stdin.off('data', cleanup)
  }
  process.stdin.once('data', cleanup)
}
