import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { TextAttributes } from "@opentui/core"
import * as MemoryStore from "@/memory/store"
import { createEffect, createSignal, For, Show } from "solid-js"

const id = "internal:memory"

let apiRef: TuiPluginApi | undefined

function worktree(api: TuiPluginApi) {
  return api.state.path.worktree || api.state.path.directory || process.cwd()
}

function MemoryList(props: { api: TuiPluginApi; query?: string }) {
  const theme = () => props.api.theme.current
  const [entries, setEntries] = createSignal<MemoryStore.Entry[] | undefined>()

  createEffect(() => {
    const query = props.query?.trim()
    void (async () => {
      setEntries(undefined)
      const result = query
        ? await MemoryStore.search({ query, worktree: worktree(props.api), scope: "all", limit: 12 })
        : await MemoryStore.list({ worktree: worktree(props.api), scope: "all", limit: 12 })
      setEntries(result)
    })()
  })

  return (
    <Show when={entries()} fallback={<text fg={theme().textMuted}>Loading…</text>}>
      {(items) => (
        <Show when={items().length > 0} fallback={<text fg={theme().textMuted}>No memories yet</text>}>
          <box gap={0}>
            <For each={items()}>
              {(entry) => (
                <box gap={0}>
                  <text fg={theme().text}>
                    {entry.title} <span style={{ fg: theme().textMuted }}>({entry.scope})</span>
                  </text>
                  <text fg={theme().textMuted} wrapMode="word">
                    {entry.content}
                  </text>
                </box>
              )}
            </For>
          </box>
        </Show>
      )}
    </Show>
  )
}

function DialogMemory(props: { api: TuiPluginApi; query?: string }) {
  const theme = () => props.api.theme.current

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <text fg={theme().text} attributes={TextAttributes.BOLD}>
        Awakened Memory
      </text>
      <text fg={theme().textMuted}>Preinstalled cross-session notes (project + global)</text>
      <Show when={props.query}>
        <text fg={theme().textMuted}>Search: {props.query}</text>
      </Show>
      <MemoryList api={props.api} query={props.query} />
        <text fg={theme().textMuted}>/remember · /mem-search · auto-save on by default</text>
    </box>
  )
}

export function dispatchMemorySlash(name: string, args?: string) {
  if (!apiRef) return false
  const api = apiRef
  if (name !== "remember" && name !== "mem" && name !== "memory") return false

  const text = args?.trim()
  if (name === "remember" && text) {
    const title = text.length > 72 ? `${text.slice(0, 69)}…` : text
    void MemoryStore.save({
      title,
      content: text,
      scope: "project",
      worktree: worktree(api),
    })
      .then((entry) => {
        api.ui.toast({ variant: "success", message: `Saved memory: ${entry.title}` })
      })
      .catch((error) => {
        api.ui.toast({
          variant: "error",
          message: error instanceof Error ? error.message : "Failed to save memory",
        })
      })
    return true
  }

  api.ui.dialog.replace(() => <DialogMemory api={api} query={name === "remember" ? undefined : text} />)
  return true
}

const tui: TuiPlugin = async (api) => {
  apiRef = api

  api.keymap.registerLayer({
    commands: [
      {
        name: "memory.show",
        title: "Awakened memory",
        desc: "Browse saved cross-session notes",
        category: "Session",
        namespace: "palette",
        slashName: "mem",
        slashAliases: ["memory"],
        run() {
          api.ui.dialog.replace(() => <DialogMemory api={api} />)
        },
      },
    ],
  })
}

const plugin: InternalTuiPlugin = {
  id,
  tui,
}

export default plugin
