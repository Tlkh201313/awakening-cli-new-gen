import HomeFooter from "../feature-plugins/home/footer"
import HomeTips from "../feature-plugins/home/tips"
import SidebarContext from "../feature-plugins/sidebar/context"
import SidebarAwakened from "../feature-plugins/sidebar/awakened"
import SidebarMcp from "../feature-plugins/sidebar/mcp"
import SidebarLsp from "../feature-plugins/sidebar/lsp"
import SidebarTodo from "../feature-plugins/sidebar/todo"
import SidebarFiles from "../feature-plugins/sidebar/files"
import SidebarFooter from "../feature-plugins/sidebar/footer"
import PluginManager from "../feature-plugins/system/plugins"
import PermissionBypass from "../feature-plugins/system/permission-bypass"
import Doctor from "../feature-plugins/system/doctor"
import Memory from "../feature-plugins/system/memory"
import Personality from "../feature-plugins/system/personality"
import Usage from "../feature-plugins/system/usage"
import Notifications from "../feature-plugins/system/notifications"
import SessionV2Debug from "../feature-plugins/system/session-v2"
import WhichKey from "../feature-plugins/system/which-key"
import DiffViewer from "../feature-plugins/system/diff-viewer"
import type { TuiPlugin, TuiPluginModule } from "@awakened-ai/plugin/tui"
import type { RuntimeFlags } from "@/effect/runtime-flags"

export type InternalTuiPlugin = Omit<TuiPluginModule, "id"> & {
  id: string
  tui: TuiPlugin
  enabled?: boolean
}

export function internalTuiPlugins(flags: Pick<RuntimeFlags.Info, "experimentalEventSystem">): InternalTuiPlugin[] {
  return [
    HomeFooter,
    HomeTips,
    SidebarContext,
    SidebarAwakened,
    SidebarMcp,
    SidebarLsp,
    SidebarTodo,
    SidebarFiles,
    SidebarFooter,
    Notifications,
    PermissionBypass,
    Doctor,
    Memory,
    Personality,
    Usage,
    PluginManager,
    WhichKey,
    DiffViewer,
    ...(flags.experimentalEventSystem ? [SessionV2Debug] : []),
  ]
}
