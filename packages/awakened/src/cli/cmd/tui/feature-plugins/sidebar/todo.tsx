import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { createMemo, For, Show, createSignal } from "solid-js"
import { TodoItem } from "../../component/todo-item"
import { SidebarSection } from "./shared"

const id = "internal:sidebar-todo"

function View(props: { api: TuiPluginApi; session_id: string }) {
  const [open, setOpen] = createSignal(true)
  const theme = () => props.api.theme.current
  const list = createMemo(() => props.api.state.session.todo(props.session_id))
  const show = createMemo(() => list().length > 0 && list().some((item) => item.status !== "completed"))
  const pending = createMemo(() => list().filter((item) => item.status !== "completed").length)

  return (
    <Show when={show()}>
      <SidebarSection
        title="Todo"
        color={theme().warning}
        collapsible={list().length > 2}
        open={list().length <= 2 || open()}
        onToggle={() => setOpen((x) => !x)}
      >
        <Show when={!open() && list().length > 2}>
          <text fg={theme().textMuted}>{pending()} open</text>
        </Show>
        <For each={list()}>{(item) => <TodoItem status={item.status} content={item.content} />}</For>
      </SidebarSection>
    </Show>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 400,
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
