import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { ALL_AWAKENED_CAPABILITY_IDS } from "@/capabilities/ids"
import { normalizeAwakenedTokenMode, tokenModeLabel } from "@/capabilities/tokenMode"
import { TextAttributes } from "@opentui/core"
import { createMemo } from "solid-js"
import { tint } from "@tui/context/theme"
import {
  BorderedPanel,
  MiniToggle,
  progressBar,
  SidebarDivider,
  SidebarMeta,
  SidebarSection,
  StatusDot,
  tokenModeColor,
} from "./shared"

const id = "internal:sidebar-awakened"

function View(props: { api: TuiPluginApi; session_id: string }) {
  const theme = () => props.api.theme.current
  const config = createMemo(() => props.api.state.config as {
    awakenedCapabilities?: {
      disabled?: string[]
      autoSubagents?: boolean
      autoCapabilities?: boolean
      tokenMode?: string
      warmConnection?: boolean
    }
  })
  const messages = createMemo(() => props.api.state.session.messages(props.session_id))
  const agent = createMemo(() => {
    const last = messages().findLast((item) => item.role === "user")
    return last && "agent" in last ? last.agent : "build"
  })
  const model = createMemo(() => {
    const last = messages().findLast((item) => item.role === "assistant" && item.tokens.output > 0)
    if (!last || last.role !== "assistant") return
    const provider = props.api.state.provider.find((item) => item.id === last.providerID)
    return {
      provider: provider?.name ?? last.providerID,
      model: last.modelID,
    }
  })
  const packs = createMemo(() => {
    const disabled = new Set(config().awakenedCapabilities?.disabled ?? [])
    const enabled = ALL_AWAKENED_CAPABILITY_IDS.filter((item) => !disabled.has(item)).length
    const tokenMode = normalizeAwakenedTokenMode(config().awakenedCapabilities?.tokenMode)
    return {
      enabled,
      total: ALL_AWAKENED_CAPABILITY_IDS.length,
      autoCapabilities: config().awakenedCapabilities?.autoCapabilities !== false,
      autoSubagents: config().awakenedCapabilities?.autoSubagents !== false,
      tokenMode,
      tokenModeLabel: tokenModeLabel(tokenMode),
      warmConnection: config().awakenedCapabilities?.warmConnection !== false,
    }
  })

  return (
    <box flexDirection="column" gap={0}>
      <BorderedPanel border={tint(theme().border, theme().primary, 0.35)} background={theme().backgroundPanel}>
        <SidebarSection title="Runtime" color={theme().primary}>
          <StatusDot
            color={theme().success}
            muted={theme().textMuted}
            label={`Agent ${agent()}`}
            detail={model() ? `· ${model()!.provider}/${model()!.model}` : undefined}
          />
          <SidebarMeta
            label="Packs"
            value={`${packs().enabled}/${packs().total}`}
            labelColor={theme().textMuted}
            valueColor={theme().success}
          />
          <text fg={theme().primary}>{progressBar(packs().enabled, packs().total, 16)}</text>
          <SidebarMeta label="Tokens" value={packs().tokenModeLabel} labelColor={theme().textMuted} valueColor={tokenModeColor(packs().tokenMode, theme())} />
          <box flexDirection="column" gap={0} paddingTop={1}>
            <MiniToggle label="Skills" on={packs().autoCapabilities} theme={theme()} />
            <MiniToggle label="Subagents" on={packs().autoSubagents} theme={theme()} />
            <MiniToggle label="Alive" on={packs().warmConnection} theme={theme()} />
          </box>
          <text fg={tint(theme().textMuted, theme().primary, 0.3)} attributes={TextAttributes.DIM}>
            /awakened configure
          </text>
        </SidebarSection>
      </BorderedPanel>
      <SidebarDivider color={theme().border} />
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 50,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} session_id={props.session_id} />
      },
    },
  })
}

const plugin: InternalTuiPlugin = {
  id,
  tui,
}

export default plugin
