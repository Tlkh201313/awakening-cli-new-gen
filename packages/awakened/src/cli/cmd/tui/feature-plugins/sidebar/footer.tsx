import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { createMemo, Show } from "solid-js"
import { Global } from "@awakened-ai/core/global"
import { InstallationChannel, InstallationVersion } from "@awakened-ai/core/installation/version"
import { TextAttributes } from "@opentui/core"
import { tint } from "@tui/context/theme"
import { BorderedPanel, SidebarMeta } from "./shared"

const id = "internal:sidebar-footer"

function View(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current
  const has = createMemo(() =>
    props.api.state.provider.some(
      (item) => item.id !== "awakened" || Object.values(item.models).some((model) => model.cost?.input !== 0),
    ),
  )
  const done = createMemo(() => props.api.kv.get("dismissed_getting_started", false))
  const show = createMemo(() => !has() && !done())
  const path = createMemo(() => {
    const dir = props.api.state.path.directory || process.cwd()
    const out = dir.replace(Global.Path.home, "~")
    const text = props.api.state.vcs?.branch ? `${out}:${props.api.state.vcs.branch}` : out
    const list = text.split("/")
    return {
      parent: list.slice(0, -1).join("/"),
      name: list.at(-1) ?? "",
    }
  })
  const version = createMemo(() =>
    InstallationChannel === "latest" ? InstallationVersion : `${InstallationVersion} (${InstallationChannel})`,
  )

  return (
    <box gap={1}>
      <Show when={show()}>
        <BorderedPanel border={tint(theme().border, theme().primary, 0.3)} background={theme().backgroundElement}>
          <box flexDirection="row" justifyContent="space-between">
            <text fg={theme().primary} attributes={TextAttributes.BOLD}>
              ◆ Getting started
            </text>
            <text fg={theme().textMuted} onMouseDown={() => props.api.kv.set("dismissed_getting_started", true)}>
              ◇
            </text>
          </box>
          <text fg={theme().textMuted}>Free models included — start immediately.</text>
          <SidebarMeta label="Next" value="/connect" labelColor={theme().textMuted} valueColor={theme().primary} />
        </BorderedPanel>
      </Show>
      <SidebarMeta
        label="Path"
        value={`${path().parent}/${path().name}`}
        labelColor={theme().textMuted}
        valueColor={theme().text}
      />
      <text fg={theme().textMuted}>
        <span style={{ fg: theme().primary }}>◆</span> Awakened {version()}
      </text>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 100,
    slots: {
      sidebar_footer() {
        return <View api={api} />
      },
    },
  })
}

const plugin: InternalTuiPlugin = {
  id,
  tui,
}

export default plugin
