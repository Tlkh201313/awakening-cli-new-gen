import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { createMemo, For, Show, createSignal } from "solid-js"
import { SidebarSection, StatusDot } from "./shared"

const id = "internal:sidebar-mcp"

function View(props: { api: TuiPluginApi }) {
  const [open, setOpen] = createSignal(true)
  const theme = () => props.api.theme.current
  const list = createMemo(() => props.api.state.mcp())
  const on = createMemo(() => list().filter((item) => item.status === "connected").length)
  const bad = createMemo(
    () =>
      list().filter(
        (item) =>
          item.status === "failed" || item.status === "needs_auth" || item.status === "needs_client_registration",
      ).length,
  )

  const dot = (status: string) => {
    if (status === "connected") return theme().success
    if (status === "failed") return theme().error
    if (status === "disabled") return theme().textMuted
    if (status === "needs_auth") return theme().warning
    if (status === "needs_client_registration") return theme().error
    return theme().textMuted
  }

  const summary = () => {
    if (open()) return undefined
    return `${on()} active${bad() > 0 ? ` · ${bad()} err` : ""}`
  }

  return (
    <Show when={list().length > 0}>
      <SidebarSection
        title="MCP"
        color={theme().accent}
        collapsible={list().length > 2}
        open={list().length <= 2 || open()}
        onToggle={() => setOpen((x) => !x)}
      >
        <Show when={summary()}>
          <text fg={theme().textMuted}>{summary()}</text>
        </Show>
        <For each={list()}>
          {(item) => (
            <StatusDot
              color={dot(item.status)}
              muted={theme().textMuted}
              label={item.name}
              detail={
                item.status === "connected"
                  ? "connected"
                  : item.status === "failed"
                    ? item.error
                    : item.status === "disabled"
                      ? "disabled"
                      : item.status === "needs_auth"
                        ? "needs auth"
                        : item.status === "needs_client_registration"
                          ? "needs client"
                          : item.status
              }
            />
          )}
        </For>
      </SidebarSection>
    </Show>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 200,
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
