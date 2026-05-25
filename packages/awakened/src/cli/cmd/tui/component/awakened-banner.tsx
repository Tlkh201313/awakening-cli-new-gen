import { RGBA, TextAttributes } from "@opentui/core"
import { useTerminalDimensions } from "@opentui/solid"
import { createMemo, createSignal, For, onMount, Show, type Accessor } from "solid-js"
import { ALL_AWAKENED_CAPABILITY_IDS } from "@/capabilities/ids"
import { normalizeAwakenedTokenMode, tokenModeLabel } from "@/capabilities/tokenMode"
import {
  BANNER,
  formatBannerLine,
  homeFrameBottom,
  homeFrameDivider,
  homeFrameTop,
  statusBox,
  statusBoxInline,
  statusBoxSlim,
  TAGLINE,
  versionLabel,
  wordmarkLine,
} from "@/cli/banner"
import { homeLayout, useHomeStyle } from "@tui/context/home-style"
import { useLocal } from "@tui/context/local"
import { useSync } from "@tui/context/sync"
import { tint, useTheme } from "@tui/context/theme"
import { InstallationVersion } from "@awakened-ai/core/installation/version"
import { useCommandShortcut } from "../keymap"
import { useKV } from "../context/kv"
import {
  BANNER_ROW_FADE_MS,
  BANNER_ROW_STAGGER_MS,
  bannerShineBoost,
  useBannerShine,
} from "../util/banner-animation"
import { fadeColor } from "../util/color"
import { createDelayedFadeIn, createFadeIn } from "../util/signal"

const PEAK = RGBA.fromInts(255, 255, 255)

function BannerLine(props: {
  line: string
  row: number
  width: number
  ready: Accessor<boolean>
  animations: Accessor<boolean>
  shining: Accessor<boolean>
  shinePhase: Accessor<number>
  muted?: boolean
}) {
  const { theme } = useTheme()
  const rowAlpha = createDelayedFadeIn(
    props.ready,
    props.animations,
    props.row * BANNER_ROW_STAGGER_MS,
    BANNER_ROW_FADE_MS,
  )
  const text = formatBannerLine(props.line, props.width)
  const baseColor = () => (props.muted ? theme.textMuted : theme.primary)

  return (
    <Show when={rowAlpha() > 0.02}>
      <text attributes={TextAttributes.BOLD}>
        <For each={Array.from(text)}>
          {(char, col) => {
            const boost = props.shining()
              ? bannerShineBoost(char, col(), props.row, props.shinePhase())
              : 0
            const base = boost > 0.01 ? tint(baseColor(), PEAK, boost) : baseColor()
            return <span style={{ fg: fadeColor(base, rowAlpha()) }}>{char}</span>
          }}
        </For>
      </text>
    </Show>
  )
}

function WordmarkBanner(props: {
  width: number
  ready: Accessor<boolean>
  animations: Accessor<boolean>
  shining: Accessor<boolean>
  shinePhase: Accessor<number>
}) {
  const { theme } = useTheme()
  const alpha = createFadeIn(props.ready, props.animations, 240)
  const text = () => wordmarkLine(props.width)

  return (
    <Show when={alpha() > 0.02}>
      <text attributes={TextAttributes.BOLD}>
        <For each={Array.from(text())}>
          {(char, col) => {
            const boost = props.shining() ? bannerShineBoost(char, col(), 0, props.shinePhase(), 0.14) : 0
            const base = boost > 0.01 ? tint(theme.primary, PEAK, boost) : theme.primary
            return <span style={{ fg: fadeColor(base, alpha()) }}>{char}</span>
          }}
        </For>
      </text>
    </Show>
  )
}

function PanelLine(props: {
  line: string
  accent: boolean
  row: number
  ready: Accessor<boolean>
  animations: Accessor<boolean>
  statusAccent: RGBA
}) {
  const { theme } = useTheme()
  const lineAlpha = createDelayedFadeIn(props.ready, props.animations, 90 + props.row * 38, 200)
  const alpha = () => lineAlpha()
  const fg = () => {
    if (props.accent) return fadeColor(props.statusAccent, alpha())
    if (props.line.startsWith("│")) return fadeColor(theme.text, alpha())
    return fadeColor(theme.textMuted, alpha())
  }

  return (
    <Show when={alpha() > 0.02}>
      <text
        fg={fg()}
        attributes={props.accent ? TextAttributes.BOLD : props.line.startsWith("│") ? undefined : TextAttributes.DIM}
      >
        {props.line}
      </text>
    </Show>
  )
}

export function AwakenedBanner() {
  const { theme } = useTheme()
  const sync = useSync()
  const local = useLocal()
  const kv = useKV()
  const homeStyle = useHomeStyle()
  const dimensions = useTerminalDimensions()
  const layout = createMemo(() => homeLayout(dimensions().width, homeStyle.current()))
  const help = useCommandShortcut("help.show")
  const animations = () => kv.get("animations_enabled", true) && layout().showStartupFx
  const [logoReady, setLogoReady] = createSignal(false)
  const [detailsReady, setDetailsReady] = createSignal(false)
  const { shining, phase } = useBannerShine(animations)
  const frameAlpha = createDelayedFadeIn(logoReady, animations, 0, 200)
  const taglineAlpha = createDelayedFadeIn(detailsReady, animations, 0, 220)
  const frameDividerAlpha = createDelayedFadeIn(detailsReady, animations, 280, 200)

  onMount(() => {
    setLogoReady(true)
    const logoDone = (BANNER.length - 1) * BANNER_ROW_STAGGER_MS + BANNER_ROW_FADE_MS + 40
    setTimeout(() => setDetailsReady(true), logoDone)
  })

  const info = createMemo(() => {
    const selected = local.model.current()
    const provider = sync.data.provider.find((item) => item.id === selected?.providerID)
    const model = provider?.models[selected?.modelID ?? ""]
    const connected = sync.data.provider.some((item) => Object.keys(item.models).length > 0)
    const endpoint = model?.api.url || "—"
    const config = sync.data.config as {
      awakenedCapabilities?: { disabled?: string[]; tokenMode?: string }
    }
    const disabled = config.awakenedCapabilities?.disabled?.length ?? 0
    const packsOn = ALL_AWAKENED_CAPABILITY_IDS.length - disabled
    const tokenMode = tokenModeLabel(normalizeAwakenedTokenMode(config.awakenedCapabilities?.tokenMode))
    return {
      provider: provider?.name ?? "—",
      model: selected?.modelID ?? "—",
      endpoint,
      ready: connected && !!selected && !!model,
      packs: `${packsOn}/${ALL_AWAKENED_CAPABILITY_IDS.length} packs · ${tokenMode}`,
    }
  })

  const panel = createMemo(() => {
    const width = layout().contentWidth
    const hint = help() ? `(${help()} · /awakened)` : "(/help · /awakened)"
    const input = { ...info(), hint }
    if (layout().status === "inline") return statusBoxInline(input, width)
    if (layout().status === "slim") return statusBoxSlim(input, width)
    return statusBox(input, width)
  })

  const statusAccent = createMemo(() => (info().ready ? theme.success : theme.warning))
  const width = () => layout().contentWidth

  return (
    <box flexDirection="column" alignItems="center" gap={layout().gap}>
      <Show when={layout().showFrame && frameAlpha() > 0.02}>
        <box flexDirection="column" width={width()}>
          <text fg={fadeColor(theme.border, frameAlpha())}>{homeFrameTop(width())}</text>
        </box>
      </Show>
      <box flexDirection="column" width={width()} alignItems="center">
        <Show
          when={layout().banner === "ascii"}
          fallback={
            <WordmarkBanner
              width={width()}
              ready={logoReady}
              animations={animations}
              shining={shining}
              shinePhase={phase}
            />
          }
        >
          <For each={BANNER}>
            {(line, index) => (
              <BannerLine
                line={line}
                row={index()}
                width={width()}
                ready={logoReady}
                animations={animations}
                shining={shining}
                shinePhase={phase}
                muted={homeStyle.selected === "minimal"}
              />
            )}
          </For>
        </Show>
      </box>
      <Show when={detailsReady()}>
        <Show when={layout().showTagline && taglineAlpha() > 0.02}>
          <text fg={fadeColor(theme.textMuted, taglineAlpha())}>{TAGLINE}</text>
        </Show>
        <box flexDirection="column" width={width()} marginTop={layout().showTagline ? 1 : 0}>
          <For each={panel()}>
            {(line, index) => (
              <PanelLine
                line={line}
                accent={line.startsWith("│ ◆")}
                row={index()}
                ready={detailsReady}
                animations={animations}
                statusAccent={statusAccent()}
              />
            )}
          </For>
        </box>
        <Show when={layout().showFrame && frameDividerAlpha() > 0.02}>
          <box flexDirection="column" width={width()}>
            <text fg={fadeColor(theme.border, frameDividerAlpha())}>{homeFrameDivider(width())}</text>
          </box>
        </Show>
        <Show when={!layout().showFrame && frameDividerAlpha() > 0.02}>
          <text fg={fadeColor(tint(theme.textMuted, theme.primary, 0.2), frameDividerAlpha())}>
            {versionLabel(InstallationVersion)}
          </text>
        </Show>
      </Show>
    </box>
  )
}

export function HomeFrameBottom() {
  const homeStyle = useHomeStyle()
  const dimensions = useTerminalDimensions()
  const kv = useKV()
  const { theme } = useTheme()
  const layout = createMemo(() => homeLayout(dimensions().width, homeStyle.current()))
  const animations = () => kv.get("animations_enabled", true) && layout().showStartupFx
  const [ready, setReady] = createSignal(false)
  const frameAlpha = createDelayedFadeIn(ready, animations, 360, 220)
  const versionAlpha = createDelayedFadeIn(ready, animations, 420, 200)

  onMount(() => setReady(true))

  return (
    <Show when={layout().showFrame}>
      <box flexDirection="column" alignItems="center" width={layout().contentWidth} gap={1}>
        <Show when={frameAlpha() > 0.02}>
          <text fg={fadeColor(theme.border, frameAlpha())}>{homeFrameBottom(layout().contentWidth)}</text>
        </Show>
        <Show when={versionAlpha() > 0.02}>
          <text fg={fadeColor(tint(theme.textMuted, theme.primary, 0.2), versionAlpha())}>
            {versionLabel(InstallationVersion)}
          </text>
        </Show>
      </box>
    </Show>
  )
}
