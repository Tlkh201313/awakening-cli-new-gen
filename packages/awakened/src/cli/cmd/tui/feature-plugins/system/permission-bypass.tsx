import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { Show, createMemo } from "solid-js"

const id = "internal:permission-bypass"
const KV_KEY = "permission_bypass"

let apiRef: TuiPluginApi | undefined
let startupBypass = false

export function setStartupPermissionBypass(value: boolean) {
  startupBypass = value
  if (apiRef) syncBypass(apiRef)
}

export function dispatchPermissionSlash(name: string, args?: string) {
  if (!apiRef) return false
  const hit = name === "yolo" || name === "bypass" || name === "dangerously-skip-permissions"
  if (!hit) return false

  const arg = args?.trim().toLowerCase()
  if (arg === "off" || arg === "disable" || arg === "false") {
    setBypass(apiRef, false)
    return true
  }
  if (arg === "on" || arg === "enable" || arg === "true") {
    setBypass(apiRef, true)
    return true
  }

  const next = !apiRef.kv.get(KV_KEY, startupBypass)
  setBypass(apiRef, next)
  return true
}

function syncBypass(api: TuiPluginApi) {
  if (api.kv.get(KV_KEY) === undefined && startupBypass) {
    api.kv.set(KV_KEY, true)
  }
}

function setBypass(api: TuiPluginApi, value: boolean) {
  api.kv.set(KV_KEY, value)
  api.ui.toast({
    variant: value ? "warning" : "info",
    message: value
      ? "YOLO mode on — permissions auto-approved (dangerous)"
      : "YOLO mode off — permissions will prompt again",
  })
}

function bypassEnabled(api: TuiPluginApi) {
  return Boolean(api.kv.get(KV_KEY, startupBypass))
}

function YoloBadge(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current
  const active = createMemo(() => bypassEnabled(props.api))

  return (
    <Show when={active()}>
      <text fg={theme().warning}>/yolo</text>
    </Show>
  )
}

const tui: TuiPlugin = async (api) => {
  apiRef = api
  syncBypass(api)

  api.event.on("permission.asked", (event) => {
    if (!bypassEnabled(api)) return
    void api.client.permission.reply({
      requestID: event.properties.id,
      reply: "once",
    })
  })

  api.slots.register({
    order: 50,
    slots: {
      session_prompt_right() {
        return <YoloBadge api={api} />
      },
    },
  })

  api.keymap.registerLayer({
    commands: [
      {
        name: "permissions.yolo",
        title: "Toggle YOLO mode (auto-approve permissions)",
        desc: "Like Claude Code --dangerously-skip-permissions",
        category: "System",
        namespace: "palette",
        slashName: "yolo",
        slashAliases: ["bypass", "dangerously-skip-permissions"],
        run() {
          const next = !bypassEnabled(api)
          setBypass(api, next)
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
