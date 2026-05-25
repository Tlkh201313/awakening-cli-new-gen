import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { createMemo, For, Show, createSignal } from "solid-js"
import { SidebarSection } from "./shared"

const id = "internal:sidebar-files"

function View(props: { api: TuiPluginApi; session_id: string }) {
  const [open, setOpen] = createSignal(true)
  const theme = () => props.api.theme.current
  const list = createMemo(() => props.api.state.session.diff(props.session_id))

  return (
    <Show when={list().length > 0}>
      <SidebarSection
        title="Changes"
        color={theme().secondary}
        collapsible={list().length > 2}
        open={list().length <= 2 || open()}
        onToggle={() => setOpen((x) => !x)}
      >
        <Show when={!open() && list().length > 2}>
          <text fg={theme().textMuted}>{list().length} files</text>
        </Show>
        <For each={list()}>
          {(item) => (
            <box flexDirection="column" gap={0} paddingTop={0}>
              <text fg={theme().text} wrapMode="none">
                {item.file.split("/").pop() ?? item.file}
              </text>
              <box flexDirection="row" gap={1}>
                <Show when={item.additions}>
                  <text fg={theme().diffAdded}>+{item.additions}</text>
                </Show>
                <Show when={item.deletions}>
                  <text fg={theme().diffRemoved}>-{item.deletions}</text>
                </Show>
              </box>
            </box>
          )}
        </For>
      </SidebarSection>
    </Show>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 500,
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
