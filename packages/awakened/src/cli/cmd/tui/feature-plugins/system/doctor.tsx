import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { TextAttributes } from "@opentui/core"
import { Global } from "@awakened-ai/core/global"
import { createMemo } from "solid-js"

const id = "internal:doctor"

function DialogDoctor(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current
  const yolo = createMemo(() => Boolean(props.api.kv.get("permission_bypass", false)))
  const dir = createMemo(() => (props.api.state.path.directory || process.cwd()).replace(Global.Path.home, "~"))
  const config = createMemo(() => props.api.state.path.config?.replace(Global.Path.home, "~") ?? "~/.config/awakened")
  const plugins = createMemo(() => props.api.plugins.list().length)
  const mcps = createMemo(() => props.api.state.mcp().filter((item) => item.status === "connected").length)

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <text fg={theme().text} attributes={TextAttributes.BOLD}>
        Doctor
      </text>
      <text fg={theme().textMuted}>Quick health check (like Claude Code /doctor)</text>
      <box gap={0}>
        <text fg={theme().text}>
          Version <span style={{ fg: theme().textMuted }}>{props.api.app.version}</span>
        </text>
        <text fg={theme().text}>
          Runtime <span style={{ fg: theme().textMuted }}>{process.version}</span>
        </text>
        <text fg={theme().text}>
          Directory <span style={{ fg: theme().textMuted }}>{dir()}</span>
        </text>
        <text fg={theme().text}>
          Config <span style={{ fg: theme().textMuted }}>{config()}</span>
        </text>
        <text fg={theme().text}>
          MCP connected <span style={{ fg: theme().textMuted }}>{mcps()}</span>
        </text>
        <text fg={theme().text}>
          TUI plugins <span style={{ fg: theme().textMuted }}>{plugins()}</span>
        </text>
        <text fg={theme().text}>
          YOLO mode{" "}
          <span style={{ fg: yolo() ? theme().warning : theme().textMuted }}>{yolo() ? "on (auto-approve)" : "off"}</span>
        </text>
      </box>
      <text fg={theme().textMuted}>Run awakened debug config for full config diagnostics</text>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.keymap.registerLayer({
    commands: [
      {
        name: "doctor.show",
        title: "Doctor",
        desc: "Health check: version, paths, MCP, YOLO mode",
        category: "System",
        namespace: "palette",
        slashName: "doctor",
        run() {
          api.ui.dialog.replace(() => <DialogDoctor api={api} />)
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
