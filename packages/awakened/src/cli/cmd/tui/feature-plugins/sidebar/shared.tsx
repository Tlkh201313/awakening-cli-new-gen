import { TextAttributes, type RGBA } from "@opentui/core"
import type { ParentProps } from "solid-js"
import { Show } from "solid-js"
import { AwakenedFrameBorder } from "@tui/component/border"
import { tint } from "@tui/context/theme"
import type { AwakenedTokenMode } from "@/capabilities/tokenMode"
import { tokenModeLabel } from "@/capabilities/tokenMode"

export const SIDEBAR_WIDTH = 46

export function progressBar(enabled: number, total: number, width = 12) {
  if (total <= 0) return "◇".repeat(width)
  const filled = Math.round((enabled / total) * width)
  return `${"◆".repeat(filled)}${"◇".repeat(Math.max(0, width - filled))}`
}

export function SidebarDivider(props: { color: RGBA }) {
  return (
    <text fg={props.color} attributes={TextAttributes.DIM}>
      ◆{"─".repeat(SIDEBAR_WIDTH - 6)}◆
    </text>
  )
}

export function SidebarHeader(props: { title: string; subtitle?: string; color: RGBA; muted: RGBA }) {
  return (
    <box flexDirection="column" gap={0}>
      <box flexDirection="row" gap={1} alignItems="center">
        <text fg={props.color}>◆</text>
        <text fg={props.color} attributes={TextAttributes.BOLD}>
          {props.title}
        </text>
      </box>
      <Show when={props.subtitle}>
        <text fg={props.muted} wrapMode="word" paddingLeft={2}>
          {props.subtitle}
        </text>
      </Show>
    </box>
  )
}

export function SidebarSection(
  props: ParentProps<{ title: string; color: RGBA; open?: boolean; collapsible?: boolean; onToggle?: () => void }>,
) {
  const marker = () => (props.open === false ? "◇" : "◈")

  return (
    <box flexDirection="column" gap={0} paddingTop={1}>
      <box flexDirection="row" gap={1} onMouseDown={props.collapsible ? props.onToggle : undefined}>
        <Show when={props.collapsible}>
          <text fg={props.color}>{marker()}</text>
        </Show>
        <Show when={!props.collapsible}>
          <text fg={props.color}>◆</text>
        </Show>
        <text fg={props.color} attributes={TextAttributes.BOLD}>
          {props.title}
        </text>
      </box>
      <Show when={props.open !== false}>
        <box paddingLeft={2} gap={0}>
          {props.children}
        </box>
      </Show>
    </box>
  )
}

export function StatusDot(props: { color: RGBA; label: string; detail?: string; muted: RGBA }) {
  return (
    <box flexDirection="row" gap={1} paddingTop={0}>
      <text flexShrink={0} fg={props.color}>
        ◆
      </text>
      <text fg={props.muted} wrapMode="word">
        {props.label}
        {props.detail ? ` ${props.detail}` : ""}
      </text>
    </box>
  )
}

export function tokenModeColor(
  mode: AwakenedTokenMode,
  theme: { primary: RGBA; accent: RGBA; warning: RGBA; textMuted: RGBA },
) {
  if (mode === "caveman") return theme.warning
  if (mode === "efficient") return theme.accent
  return theme.textMuted
}

export function TokenModeBadge(props: {
  mode: AwakenedTokenMode
  theme: { primary: RGBA; accent: RGBA; warning: RGBA; textMuted: RGBA; backgroundElement: RGBA }
}) {
  const color = () => tokenModeColor(props.mode, props.theme)
  return (
    <text fg={color()} attributes={TextAttributes.BOLD}>
      {tokenModeLabel(props.mode)}
    </text>
  )
}

export function MiniToggle(props: {
  label: string
  on: boolean
  hotkey?: string
  active?: boolean
  theme: { success: RGBA; text: RGBA; textMuted: RGBA; backgroundElement: RGBA; primary: RGBA }
  onPress?: () => void
}) {
  const mark = () => (props.on ? "◈" : "◇")
  const fg = () => {
    if (props.active) return props.theme.primary
    if (props.on) return props.theme.success
    return props.theme.textMuted
  }

  return (
    <box flexDirection="row" gap={1} paddingTop={0} onMouseUp={props.onPress}>
      <text fg={fg()} flexShrink={0}>
        {mark()}
      </text>
      <Show
        when={props.hotkey}
        fallback={<text fg={props.active ? props.theme.text : props.theme.textMuted}>{props.label}</text>}
      >
        <box flexDirection="row" gap={0}>
          <text fg={props.active ? props.theme.text : props.theme.textMuted}>{props.label}</text>
          <text fg={props.theme.textMuted}> {props.hotkey}</text>
        </box>
      </Show>
    </box>
  )
}

export function BorderedPanel(props: ParentProps<{ border: RGBA; background?: RGBA; paddingTop?: number }>) {
  return (
    <box
      border={AwakenedFrameBorder.border}
      borderColor={props.border}
      customBorderChars={AwakenedFrameBorder.customBorderChars}
      backgroundColor={props.background}
      paddingLeft={1}
      paddingRight={1}
      paddingTop={props.paddingTop ?? 1}
      paddingBottom={1}
      gap={0}
    >
      {props.children}
    </box>
  )
}

export function SectionTitle(props: { title: string; color: RGBA; detail?: string }) {
  return (
    <box flexDirection="row" justifyContent="space-between" alignItems="center">
      <text fg={props.color} attributes={TextAttributes.BOLD}>
        ◆ {props.title}
      </text>
      <Show when={props.detail}>
        <text fg={props.color} attributes={TextAttributes.DIM}>
          {props.detail}
        </text>
      </Show>
    </box>
  )
}

export function StatStrip(props: {
  enabled: number
  total: number
  dirty?: boolean
  theme: { success: RGBA; textMuted: RGBA; primary: RGBA; warning: RGBA; accent: RGBA }
}) {
  const pct = () => (props.total === 0 ? 0 : Math.round((props.enabled / props.total) * 100))
  return (
    <box flexDirection="column" gap={0}>
      <text fg={props.theme.textMuted}>
        Packs{" "}
        <span style={{ fg: props.theme.success, bold: true }}>{props.enabled}</span>
        <span style={{ fg: props.theme.textMuted }}>/{props.total}</span>
        <span style={{ fg: props.theme.textMuted }}> · </span>
        <span style={{ fg: props.theme.textMuted }}>{pct()}%</span>
      </text>
      <text fg={props.theme.primary}>{progressBar(props.enabled, props.total, 18)}</text>
      <Show when={props.dirty}>
        <text fg={props.theme.warning} attributes={TextAttributes.BOLD}>
          ◈ unsaved
        </text>
      </Show>
    </box>
  )
}

export function ModeHint(props: { mode: AwakenedTokenMode; theme: { warning: RGBA; textMuted: RGBA; accent: RGBA } }) {
  if (props.mode === "caveman") {
    return (
      <text fg={tint(props.theme.warning, props.theme.accent, 0.35)} attributes={TextAttributes.DIM}>
        Ultra-terse · ~75% fewer tokens
      </text>
    )
  }
  if (props.mode === "efficient") {
    return (
      <text fg={props.theme.textMuted} attributes={TextAttributes.DIM}>
        Shorter prompts · fewer auto-packs
      </text>
    )
  }
  return (
    <text fg={props.theme.textMuted} attributes={TextAttributes.DIM}>
      Full routing · best quality
    </text>
  )
}

export function SidebarMeta(props: { label: string; value: string; labelColor: RGBA; valueColor: RGBA }) {
  return (
    <box flexDirection="row" gap={1} justifyContent="space-between">
      <text fg={props.labelColor}>{props.label}</text>
      <text fg={props.valueColor} wrapMode="word">
        {props.value}
      </text>
    </box>
  )
}
