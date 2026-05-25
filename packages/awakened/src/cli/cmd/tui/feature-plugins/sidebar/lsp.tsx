import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { createMemo, For, Show, createSignal } from "solid-js"
import { SidebarSection, StatusDot } from "./shared"

const id = "internal:sidebar-lsp"

function View(props: { api: TuiPluginApi }) {
  const [open, setOpen] = createSignal(true)
  const theme = () => props.api.theme.current
  const list = createMemo(() => props.api.state.lsp())
  const off = createMemo(() => !props.api.state.config.lsp)

  return (
    <SidebarSection
      title="LSP"
      color={theme().text}
      collapsible={list().length > 2}
      open={list().length <= 2 || open()}
      onToggle={() => setOpen((x) => !x)}
    >
      <Show when={list().length === 0}>
        <StatusDot
          color={off() ? theme().warning : theme().textMuted}
          muted={theme().textMuted}
          label={off() ? "Disabled in config" : "Activates as files are read"}
        />
      </Show>
      <For each={list()}>
        {(item) => (
          <StatusDot
            color={item.status === "connected" ? theme().success : theme().error}
            muted={theme().textMuted}
            label={`${item.id} ${item.root}`}
          />
        )}
      </For>
    </SidebarSection>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 300,
    slots: {
      sidebar_content() {
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
