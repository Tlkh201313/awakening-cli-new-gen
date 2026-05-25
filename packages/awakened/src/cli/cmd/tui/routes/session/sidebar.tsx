import { TextAttributes } from "@opentui/core"
import { useProject } from "@tui/context/project"
import { useSync } from "@tui/context/sync"
import { createMemo, Show } from "solid-js"
import { useTheme, tint } from "../../context/theme"
import { useTuiConfig } from "../../context/tui-config"
import { InstallationChannel } from "@awakened-ai/core/installation/version"
import { TuiPluginRuntime } from "@/cli/cmd/tui/plugin/runtime"
import { SplitBorder } from "@tui/component/border"
import { getScrollAcceleration } from "../../util/scroll"
import { WorkspaceLabel } from "../../component/workspace-label"
import { SIDEBAR_WIDTH, SidebarDivider, SidebarHeader } from "../../feature-plugins/sidebar/shared"

export function Sidebar(props: { sessionID: string; overlay?: boolean }) {
  const project = useProject()
  const sync = useSync()
  const { theme } = useTheme()
  const tuiConfig = useTuiConfig()
  const session = createMemo(() => sync.session.get(props.sessionID))
  const workspace = () => {
    const workspaceID = session()?.workspaceID
    if (!workspaceID) return
    return project.workspace.get(workspaceID)
  }
  const scrollAcceleration = createMemo(() => getScrollAcceleration(tuiConfig))

  return (
    <Show when={session()}>
      <box
        backgroundColor={theme.background}
        width={SIDEBAR_WIDTH}
        height="100%"
        flexDirection="column"
        position={props.overlay ? "absolute" : "relative"}
        border={["right"]}
        borderColor={tint(theme.border, theme.primary, 0.22)}
        customBorderChars={SplitBorder.customBorderChars}
      >
        <box
          flexShrink={0}
          paddingTop={1}
          paddingBottom={1}
          paddingLeft={2}
          paddingRight={2}
          backgroundColor={theme.backgroundPanel}
          gap={1}
        >
          <TuiPluginRuntime.Slot
            name="sidebar_title"
            mode="single_winner"
            session_id={props.sessionID}
            title={session()!.title}
            share_url={session()!.share?.url}
          >
            <SidebarHeader title="Session" subtitle={session()!.title} color={theme.primary} muted={theme.textMuted} />
            <Show when={InstallationChannel !== "latest"}>
              <text fg={theme.textMuted} attributes={TextAttributes.DIM}>
                {props.sessionID.slice(0, 12)}…
              </text>
            </Show>
            <Show when={session()!.workspaceID}>
              <text fg={theme.textMuted}>
                <Show
                  when={workspace()}
                  fallback={<WorkspaceLabel type="unknown" name={session()!.workspaceID!} status="error" icon />}
                >
                  {(item) => (
                    <WorkspaceLabel
                      type={item().type}
                      name={item().name}
                      status={project.workspace.status(item().id) ?? "error"}
                      icon
                    />
                  )}
                </Show>
              </text>
            </Show>
            <Show when={session()!.share?.url}>
              <text fg={tint(theme.textMuted, theme.secondary, 0.35)} wrapMode="word">
                {session()!.share!.url}
              </text>
            </Show>
          </TuiPluginRuntime.Slot>
        </box>

        <SidebarDivider color={theme.border} />

        <scrollbox
          flexGrow={1}
          paddingLeft={2}
          paddingRight={2}
          paddingTop={1}
          scrollAcceleration={scrollAcceleration()}
          verticalScrollbarOptions={{
            trackOptions: {
              backgroundColor: theme.background,
              foregroundColor: tint(theme.border, theme.primary, 0.35),
            },
          }}
        >
          <box flexShrink={0} gap={0} paddingRight={1}>
            <TuiPluginRuntime.Slot name="sidebar_content" session_id={props.sessionID} />
          </box>
        </scrollbox>

        <box flexShrink={0} gap={1} paddingTop={1} paddingBottom={1} paddingLeft={2} paddingRight={2}>
          <SidebarDivider color={theme.border} />
          <TuiPluginRuntime.Slot name="sidebar_footer" mode="single_winner" session_id={props.sessionID}>
            <text fg={theme.textMuted}>
              <span style={{ fg: theme.primary }}>◆</span> <b>Awakened</b>
            </text>
          </TuiPluginRuntime.Slot>
        </box>
      </box>
    </Show>
  )
}
