export const TAGLINE = "✦ Consciousness unleashed. Infinite potential. ✦"

export const BANNER = [
  " █████╗ ██╗    ██╗ █████╗ ██╗  ██╗███████╗██████╗ ███████╗██████╗",
  "██╔══██╗██║    ██║██╔══██╗██║ ██╔╝██╔════╝██╔══██╗██╔════╝██╔══██╗",
  "███████║██║ █╗ ██║███████║█████╔╝ █████╗  ██████╔╝█████╗  ██║  ██║",
  "██╔══██║██║███╗██║██╔══██║██╔═██╗ ██╔══╝  ██╔══██╗██╔══╝  ██║  ██║",
  "██║  ██║╚███╔███╔╝██║  ██║██║  ██╗███████╗██║  ██║███████╗██████╔╝",
  "╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝",
] as const

export const BANNER_WIDTH = 66

export const BOX_WIDTH = BANNER_WIDTH

export const WORDMARK = "◆ AWAKENED ◆"

export function formatBannerLine(line: string, width = BANNER_WIDTH) {
  return line.padEnd(width)
}

export function wordmarkLine(width = BANNER_WIDTH) {
  const text = WORDMARK
  if (text.length >= width) return text.slice(0, width)
  const pad = width - text.length
  const left = Math.floor(pad / 2)
  return `${" ".repeat(left)}${text}${" ".repeat(pad - left)}`
}

export type StatusBoxInput = {
  provider?: string
  model?: string
  endpoint?: string
  packs?: string
  ready?: boolean
  status?: string
  hint?: string
}

function clip(value: string, max: number) {
  if (value.length <= max) return value
  if (max <= 1) return value.slice(0, max)
  return value.slice(0, max - 1) + "…"
}

function row(label: string, value: string, width = BOX_WIDTH) {
  const inner = width - 4
  const content = `${label.padEnd(10)}${clip(value, inner - 10)}`
  return `│ ${content.padEnd(inner)} │`
}

function boxFrame(width: number) {
  const inner = width - 4
  return {
    top: `◆${"─".repeat(width - 2)}◆`,
    mid: `├${"─".repeat(width - 2)}┤`,
    bottom: `◆${"─".repeat(width - 2)}◆`,
    inner,
  }
}

export function statusBox(input: StatusBoxInput, width = BOX_WIDTH) {
  const frame = boxFrame(width)
  const status = input.status ?? (input.ready ? "Ready — start building" : "Connect a provider — /connect")
  const hint = input.hint ?? "(/help for commands)"
  const mode = input.ready ? "cloud" : "offline"
  const statusLine = `◆ ${mode}    ${status}    ${hint}`
  return [
    frame.top,
    row("Provider", input.provider ?? "—", width),
    row("Model", input.model ?? "—", width),
    row("Endpoint", input.endpoint ?? "—", width),
    row("Packs", input.packs ?? "—", width),
    frame.mid,
    `│ ${clip(statusLine, frame.inner).padEnd(frame.inner)} │`,
    frame.bottom,
  ]
}

export function statusBoxSlim(input: StatusBoxInput, width = BOX_WIDTH) {
  const frame = boxFrame(width)
  const status = input.status ?? (input.ready ? "Ready — start building" : "Connect a provider — /connect")
  const hint = input.hint ?? "(/help for commands)"
  const mode = input.ready ? "cloud" : "offline"
  const summary = clip(`${input.provider ?? "—"} · ${input.model ?? "—"} · ${input.packs ?? "—"}`, frame.inner - 2)
  const statusLine = `◆ ${mode}  ${summary}`
  return [
    frame.top,
    `│ ${clip(statusLine, frame.inner).padEnd(frame.inner)} │`,
    `│ ${clip(`${status}  ${hint}`, frame.inner).padEnd(frame.inner)} │`,
    frame.bottom,
  ]
}

export function statusBoxInline(input: StatusBoxInput, width = BOX_WIDTH) {
  const status = input.status ?? (input.ready ? "Ready" : "Connect a provider")
  const hint = input.hint ?? "(/help)"
  const mode = input.ready ? "cloud" : "offline"
  const line = `◆ ${mode}  ${input.provider ?? "—"} · ${input.model ?? "—"}  ${status}  ${hint}`
  return [clip(line, width)]
}

export function homeFrameTop(width: number) {
  return `◆${"─".repeat(width - 2)}◆`
}

export function homeFrameDivider(width: number) {
  return `├${"─".repeat(width - 2)}┤`
}

export function homeFrameBottom(width: number) {
  return `◆${"─".repeat(width - 2)}◆`
}

export function versionLabel(version: string) {
  return `awakened v${version}`
}
