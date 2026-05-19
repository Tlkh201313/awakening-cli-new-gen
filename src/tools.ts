// biome-ignore-all assist/source/organizeImports: internal-only import markers must not be reordered
import { feature } from 'bun:bundle'
import { toolMatchesName, type Tool, type Tools } from './Tool.js'
import type { ToolPermissionContext } from './Tool.js'
import { getDenyRuleForTool } from './utils/permissions/permissions.js'
import { hasEmbeddedSearchTools } from './utils/embeddedTools.js'
import { isEnvTruthy } from './utils/envUtils.js'
import { isPowerShellToolEnabled } from './utils/shell/shellToolUtils.js'
import { isAgentSwarmsEnabled } from './utils/agentSwarmsEnabled.js'
import { isWorktreeModeEnabled } from './utils/worktreeModeEnabled.js'
import {
  REPL_TOOL_NAME,
  REPL_ONLY_TOOLS,
  isReplModeEnabled,
} from './tools/REPLTool/constants.js'
export { REPL_ONLY_TOOLS }
import uniqBy from 'lodash-es/uniqBy.js'
import { isToolSearchEnabledOptimistic } from './utils/toolSearch.js'
import { isTodoV2Enabled } from './utils/tasks.js'
export {
  ALL_AGENT_DISALLOWED_TOOLS,
  CUSTOM_AGENT_DISALLOWED_TOOLS,
  ASYNC_AGENT_ALLOWED_TOOLS,
  COORDINATOR_MODE_ALLOWED_TOOLS,
} from './constants/tools.js'

// ── Lazy tool loading ─────────────────────────────────────────────────────
// All non-feature-gated tools are loaded synchronously via require() on first
// call to getAllBaseTools()/getTools(), instead of eagerly at module evaluation.
// This defers ~28 module evaluations (~50-100ms) until tools are actually needed.
/* eslint-disable @typescript-eslint/no-require-imports */
let _cache: {
  AgentTool: typeof import('./tools/AgentTool/AgentTool.js').AgentTool
  SkillTool: typeof import('./tools/SkillTool/SkillTool.js').SkillTool
  BashTool: typeof import('./tools/BashTool/BashTool.js').BashTool
  FileEditTool: typeof import('./tools/FileEditTool/FileEditTool.js').FileEditTool
  FileReadTool: typeof import('./tools/FileReadTool/FileReadTool.js').FileReadTool
  FileWriteTool: typeof import('./tools/FileWriteTool/FileWriteTool.js').FileWriteTool
  GlobTool: typeof import('./tools/GlobTool/GlobTool.js').GlobTool
  NotebookEditTool: typeof import('./tools/NotebookEditTool/NotebookEditTool.js').NotebookEditTool
  WebFetchTool: typeof import('./tools/WebFetchTool/WebFetchTool.js').WebFetchTool
  TaskStopTool: typeof import('./tools/TaskStopTool/TaskStopTool.js').TaskStopTool
  BriefTool: typeof import('./tools/BriefTool/BriefTool.js').BriefTool
  TaskOutputTool: typeof import('./tools/TaskOutputTool/TaskOutputTool.js').TaskOutputTool
  WebSearchTool: typeof import('./tools/WebSearchTool/WebSearchTool.js').WebSearchTool
  TodoWriteTool: typeof import('./tools/TodoWriteTool/TodoWriteTool.js').TodoWriteTool
  ExitPlanModeV2Tool: typeof import('./tools/ExitPlanModeTool/ExitPlanModeV2Tool.js').ExitPlanModeV2Tool
  TestingPermissionTool: typeof import('./tools/testing/TestingPermissionTool.js').TestingPermissionTool
  GrepTool: typeof import('./tools/GrepTool/GrepTool.js').GrepTool
  AskUserQuestionTool: typeof import('./tools/AskUserQuestionTool/AskUserQuestionTool.js').AskUserQuestionTool
  LSPTool: typeof import('./tools/LSPTool/LSPTool.js').LSPTool
  ListMcpResourcesTool: typeof import('./tools/ListMcpResourcesTool/ListMcpResourcesTool.js').ListMcpResourcesTool
  ReadMcpResourceTool: typeof import('./tools/ReadMcpResourceTool/ReadMcpResourceTool.js').ReadMcpResourceTool
  ToolSearchTool: typeof import('./tools/ToolSearchTool/ToolSearchTool.js').ToolSearchTool
  EnterPlanModeTool: typeof import('./tools/EnterPlanModeTool/EnterPlanModeTool.js').EnterPlanModeTool
  EnterWorktreeTool: typeof import('./tools/EnterWorktreeTool/EnterWorktreeTool.js').EnterWorktreeTool
  ExitWorktreeTool: typeof import('./tools/ExitWorktreeTool/ExitWorktreeTool.js').ExitWorktreeTool
  TaskCreateTool: typeof import('./tools/TaskCreateTool/TaskCreateTool.js').TaskCreateTool
  TaskGetTool: typeof import('./tools/TaskGetTool/TaskGetTool.js').TaskGetTool
  TaskUpdateTool: typeof import('./tools/TaskUpdateTool/TaskUpdateTool.js').TaskUpdateTool
  TaskListTool: typeof import('./tools/TaskListTool/TaskListTool.js').TaskListTool
  SYNTHETIC_OUTPUT_TOOL_NAME: string
} | null = null

function T() {
  if (_cache) return _cache
  _cache = {
    AgentTool: require('./tools/AgentTool/AgentTool.js').AgentTool,
    SkillTool: require('./tools/SkillTool/SkillTool.js').SkillTool,
    BashTool: require('./tools/BashTool/BashTool.js').BashTool,
    FileEditTool: require('./tools/FileEditTool/FileEditTool.js').FileEditTool,
    FileReadTool: require('./tools/FileReadTool/FileReadTool.js').FileReadTool,
    FileWriteTool: require('./tools/FileWriteTool/FileWriteTool.js').FileWriteTool,
    GlobTool: require('./tools/GlobTool/GlobTool.js').GlobTool,
    NotebookEditTool: require('./tools/NotebookEditTool/NotebookEditTool.js').NotebookEditTool,
    WebFetchTool: require('./tools/WebFetchTool/WebFetchTool.js').WebFetchTool,
    TaskStopTool: require('./tools/TaskStopTool/TaskStopTool.js').TaskStopTool,
    BriefTool: require('./tools/BriefTool/BriefTool.js').BriefTool,
    TaskOutputTool: require('./tools/TaskOutputTool/TaskOutputTool.js').TaskOutputTool,
    WebSearchTool: require('./tools/WebSearchTool/WebSearchTool.js').WebSearchTool,
    TodoWriteTool: require('./tools/TodoWriteTool/TodoWriteTool.js').TodoWriteTool,
    ExitPlanModeV2Tool: require('./tools/ExitPlanModeTool/ExitPlanModeV2Tool.js').ExitPlanModeV2Tool,
    TestingPermissionTool: require('./tools/testing/TestingPermissionTool.js').TestingPermissionTool,
    GrepTool: require('./tools/GrepTool/GrepTool.js').GrepTool,
    AskUserQuestionTool: require('./tools/AskUserQuestionTool/AskUserQuestionTool.js').AskUserQuestionTool,
    LSPTool: require('./tools/LSPTool/LSPTool.js').LSPTool,
    ListMcpResourcesTool: require('./tools/ListMcpResourcesTool/ListMcpResourcesTool.js').ListMcpResourcesTool,
    ReadMcpResourceTool: require('./tools/ReadMcpResourceTool/ReadMcpResourceTool.js').ReadMcpResourceTool,
    ToolSearchTool: require('./tools/ToolSearchTool/ToolSearchTool.js').ToolSearchTool,
    EnterPlanModeTool: require('./tools/EnterPlanModeTool/EnterPlanModeTool.js').EnterPlanModeTool,
    EnterWorktreeTool: require('./tools/EnterWorktreeTool/EnterWorktreeTool.js').EnterWorktreeTool,
    ExitWorktreeTool: require('./tools/ExitWorktreeTool/ExitWorktreeTool.js').ExitWorktreeTool,
    TaskCreateTool: require('./tools/TaskCreateTool/TaskCreateTool.js').TaskCreateTool,
    TaskGetTool: require('./tools/TaskGetTool/TaskGetTool.js').TaskGetTool,
    TaskUpdateTool: require('./tools/TaskUpdateTool/TaskUpdateTool.js').TaskUpdateTool,
    TaskListTool: require('./tools/TaskListTool/TaskListTool.js').TaskListTool,
    SYNTHETIC_OUTPUT_TOOL_NAME: require('./tools/SyntheticOutputTool/SyntheticOutputTool.js').SYNTHETIC_OUTPUT_TOOL_NAME,
  }
  return _cache
}
/* eslint-enable @typescript-eslint/no-require-imports */

// ── Feature-gated tools (dead code elimination via bun:bundle feature()) ──
/* eslint-disable @typescript-eslint/no-require-imports */
const REPLTool = null
const SuggestBackgroundPRTool = null
const SleepTool =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./tools/SleepTool/SleepTool.js').SleepTool
    : null
const cronTools = [
  require('./tools/ScheduleCronTool/CronCreateTool.js').CronCreateTool,
  require('./tools/ScheduleCronTool/CronDeleteTool.js').CronDeleteTool,
  require('./tools/ScheduleCronTool/CronListTool.js').CronListTool,
]
const RemoteTriggerTool = feature('AGENT_TRIGGERS_REMOTE')
  ? require('./tools/RemoteTriggerTool/RemoteTriggerTool.js').RemoteTriggerTool
  : null
const MonitorTool = feature('MONITOR_TOOL')
  ? require('./tools/MonitorTool/MonitorTool.js').MonitorTool
  : null
const SendUserFileTool = feature('KAIROS')
  ? require('./tools/SendUserFileTool/SendUserFileTool.js').SendUserFileTool
  : null
const PushNotificationTool =
  feature('KAIROS') || feature('KAIROS_PUSH_NOTIFICATION')
    ? require('./tools/PushNotificationTool/PushNotificationTool.js')
        .PushNotificationTool
    : null
const SubscribePRTool = feature('KAIROS_GITHUB_WEBHOOKS')
  ? require('./tools/SubscribePRTool/SubscribePRTool.js').SubscribePRTool
  : null
// Lazy require to break circular dependency: tools.ts -> TeamCreateTool/TeamDeleteTool -> ... -> tools.ts
const getTeamCreateTool = () =>
  require('./tools/TeamCreateTool/TeamCreateTool.js')
    .TeamCreateTool as typeof import('./tools/TeamCreateTool/TeamCreateTool.js').TeamCreateTool
const getTeamDeleteTool = () =>
  require('./tools/TeamDeleteTool/TeamDeleteTool.js')
    .TeamDeleteTool as typeof import('./tools/TeamDeleteTool/TeamDeleteTool.js').TeamDeleteTool
const getSendMessageTool = () =>
  require('./tools/SendMessageTool/SendMessageTool.js')
    .SendMessageTool as typeof import('./tools/SendMessageTool/SendMessageTool.js').SendMessageTool
// Dead code elimination: conditional import for CLAUDE_CODE_VERIFY_PLAN
const VerifyPlanExecutionTool =
  process.env.CLAUDE_CODE_VERIFY_PLAN === 'true'
    ? require('./tools/VerifyPlanExecutionTool/VerifyPlanExecutionTool.js')
        .VerifyPlanExecutionTool
    : null
// Dead code elimination: conditional import for OVERFLOW_TEST_TOOL
const OverflowTestTool = feature('OVERFLOW_TEST_TOOL')
  ? require('./tools/OverflowTestTool/OverflowTestTool.js').OverflowTestTool
  : null
const CtxInspectTool = feature('CONTEXT_COLLAPSE')
  ? require('./tools/CtxInspectTool/CtxInspectTool.js').CtxInspectTool
  : null
const TerminalCaptureTool = feature('TERMINAL_PANEL')
  ? require('./tools/TerminalCaptureTool/TerminalCaptureTool.js')
      .TerminalCaptureTool
  : null
const WebBrowserTool = feature('WEB_BROWSER_TOOL')
  ? require('./tools/WebBrowserTool/WebBrowserTool.js').WebBrowserTool
  : null
const coordinatorModeModule = feature('COORDINATOR_MODE')
  ? (require('./coordinator/coordinatorMode.js') as typeof import('./coordinator/coordinatorMode.js'))
  : null
const SnipTool = feature('HISTORY_SNIP')
  ? require('./tools/SnipTool/SnipTool.js').SnipTool
  : null
const ListPeersTool = feature('UDS_INBOX')
  ? require('./tools/ListPeersTool/ListPeersTool.js').ListPeersTool
  : null
const WorkflowTool = feature('WORKFLOW_SCRIPTS')
  ? (() => {
      require('./tools/WorkflowTool/bundled/index.js').initBundledWorkflows()
      return require('./tools/WorkflowTool/WorkflowTool.js').WorkflowTool
    })()
  : null
/* eslint-enable @typescript-eslint/no-require-imports */
const getPowerShellTool = () => {
  if (!isPowerShellToolEnabled()) return null
  return (
    require('./tools/PowerShellTool/PowerShellTool.js') as typeof import('./tools/PowerShellTool/PowerShellTool.js')
  ).PowerShellTool
}

/**
 * Predefined tool presets that can be used with --tools flag
 */
export const TOOL_PRESETS = ['default'] as const

export type ToolPreset = (typeof TOOL_PRESETS)[number]

export function parseToolPreset(preset: string): ToolPreset | null {
  const presetString = preset.toLowerCase()
  if (!TOOL_PRESETS.includes(presetString as ToolPreset)) {
    return null
  }
  return presetString as ToolPreset
}

/**
 * Get the list of tool names for a given preset
 * Filters out tools that are disabled via isEnabled() check
 * @param preset The preset name
 * @returns Array of tool names
 */
export function getToolsForDefaultPreset(): string[] {
  const tools = getAllBaseTools()
  const isEnabled = tools.map(tool => tool.isEnabled())
  return tools.filter((_, i) => isEnabled[i]).map(tool => tool.name)
}

/**
 * Get the complete exhaustive list of all tools that could be available
 * in the current environment (respecting process.env flags).
 * This is the source of truth for ALL tools.
 */
/**
 * NOTE: This MUST stay in sync with https://console.statsig.com/4aF3Ewatb6xPVpCwxb5nA3/dynamic_configs/claude_code_global_system_caching, in order to cache the system prompt across users.
 */
export function getAllBaseTools(): Tools {
  const {
    AgentTool, TaskOutputTool, BashTool, GlobTool, GrepTool,
    ExitPlanModeV2Tool, FileReadTool, FileEditTool, FileWriteTool,
    NotebookEditTool, WebFetchTool, TodoWriteTool, WebSearchTool,
    TaskStopTool, AskUserQuestionTool, SkillTool, EnterPlanModeTool,
    LSPTool, EnterWorktreeTool, ExitWorktreeTool,
    TaskCreateTool, TaskGetTool, TaskUpdateTool, TaskListTool,
    BriefTool, ListMcpResourcesTool, ReadMcpResourceTool, ToolSearchTool,
    TestingPermissionTool,
  } = T()
  return [
    AgentTool,
    TaskOutputTool,
    BashTool,
    // Ant-native builds have bfs/ugrep embedded in the bun binary (same ARGV0
    // trick as ripgrep). When available, find/grep in Claude's shell are aliased
    // to these fast tools, so the dedicated Glob/Grep tools are unnecessary.
    ...(hasEmbeddedSearchTools() ? [] : [GlobTool, GrepTool]),
    ExitPlanModeV2Tool,
    FileReadTool,
    FileEditTool,
    FileWriteTool,
    NotebookEditTool,
    WebFetchTool,
    TodoWriteTool,
    WebSearchTool,
    TaskStopTool,
    AskUserQuestionTool,
    SkillTool,
    EnterPlanModeTool,
    ...(SuggestBackgroundPRTool ? [SuggestBackgroundPRTool] : []),
    ...(WebBrowserTool ? [WebBrowserTool] : []),
    ...(isTodoV2Enabled()
      ? [TaskCreateTool, TaskGetTool, TaskUpdateTool, TaskListTool]
      : []),
    ...(OverflowTestTool ? [OverflowTestTool] : []),
    ...(CtxInspectTool ? [CtxInspectTool] : []),
    ...(TerminalCaptureTool ? [TerminalCaptureTool] : []),
    LSPTool,
    ...(isWorktreeModeEnabled() ? [EnterWorktreeTool, ExitWorktreeTool] : []),
    // Use filter(Boolean) to handle case where getter might return null/undefined
    ...(getSendMessageTool() ? [getSendMessageTool()] : []),
    ...(ListPeersTool ? [ListPeersTool] : []),
    ...(isAgentSwarmsEnabled()
      ? [getTeamCreateTool(), getTeamDeleteTool()].filter(Boolean)
      : []),
    ...(VerifyPlanExecutionTool ? [VerifyPlanExecutionTool] : []),
    ...(process.env.USER_TYPE === 'ant' && REPLTool ? [REPLTool] : []),
    ...(WorkflowTool ? [WorkflowTool] : []),
    ...(SleepTool ? [SleepTool] : []),
    ...(cronTools ?? []),
    ...(RemoteTriggerTool ? [RemoteTriggerTool] : []),
    ...(MonitorTool ? [MonitorTool] : []),
    BriefTool,
    ...(SendUserFileTool ? [SendUserFileTool] : []),
    ...(PushNotificationTool ? [PushNotificationTool] : []),
    ...(SubscribePRTool ? [SubscribePRTool] : []),
    ...(getPowerShellTool() ? [getPowerShellTool()] : []),
    ...(SnipTool ? [SnipTool] : []),
    ...(process.env.NODE_ENV === 'test' ? [TestingPermissionTool] : []),
    ListMcpResourcesTool,
    ReadMcpResourceTool,
    // Include ToolSearchTool when tool search might be enabled (optimistic check)
    // The actual decision to defer tools happens at request time in claude.ts
    ...(isToolSearchEnabledOptimistic() ? [ToolSearchTool] : []),
    // Filter out any null/undefined tools that might have been added by getters
  ].filter(Boolean)
}

/**
 * Filters out tools that are blanket-denied by the permission context.
 * A tool is filtered out if there's a deny rule matching its name with no
 * ruleContent (i.e., a blanket deny for that tool).
 *
 * Uses the same matcher as the runtime permission check (step 1a), so MCP
 * server-prefix rules like `mcp__server` strip all tools from that server
 * before the model sees them -- not just at call time.
 */
export function filterToolsByDenyRules<
  T extends {
    name: string
    mcpInfo?: { serverName: string; toolName: string }
  },
>(tools: readonly T[], permissionContext: ToolPermissionContext): T[] {
  return tools.filter(tool => !getDenyRuleForTool(permissionContext, tool))
}

export const getTools = (permissionContext: ToolPermissionContext): Tools => {
  const { BashTool, FileReadTool, FileEditTool, AgentTool, TaskStopTool, ListMcpResourcesTool, ReadMcpResourceTool } = T()
  // Simple mode: only Bash, Read, and Edit tools
  if (isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)) {
    // --bare + REPL mode: REPL wraps Bash/Read/Edit/etc inside the VM, so
    // return REPL instead of the raw primitives. Matches the non-bare path
    // below which also hides REPL_ONLY_TOOLS when REPL is enabled.
    if (isReplModeEnabled() && REPLTool) {
      const replSimple: Tool[] = [REPLTool]
      if (
        feature('COORDINATOR_MODE') &&
        coordinatorModeModule?.isCoordinatorMode()
      ) {
        const sendMessageTool = getSendMessageTool()
        if (sendMessageTool) replSimple.push(TaskStopTool, sendMessageTool)
      }
      return filterToolsByDenyRules(replSimple, permissionContext)
    }
    const simpleTools: Tool[] = [BashTool, FileReadTool, FileEditTool]
    // When coordinator mode is also active, include AgentTool and TaskStopTool
    // so the coordinator gets Task+TaskStop (via useMergedTools filtering) and
    // workers get Bash/Read/Edit (via filterToolsForAgent filtering).
    if (
      feature('COORDINATOR_MODE') &&
      coordinatorModeModule?.isCoordinatorMode()
    ) {
      simpleTools.push(AgentTool, TaskStopTool)
      const sendMessageTool = getSendMessageTool()
      if (sendMessageTool) simpleTools.push(sendMessageTool)
    }
    return filterToolsByDenyRules(simpleTools, permissionContext)
  }

  // Get all base tools and filter out special tools that get added conditionally
  const specialTools = new Set([
    ListMcpResourcesTool.name,
    ReadMcpResourceTool.name,
    T().SYNTHETIC_OUTPUT_TOOL_NAME,
  ])

  const tools = getAllBaseTools().filter(tool => !specialTools.has(tool.name))

  // Filter out tools that are denied by the deny rules
  let allowedTools = filterToolsByDenyRules(tools, permissionContext)

  // When REPL mode is enabled, hide primitive tools from direct use.
  // They're still accessible inside REPL via the VM context.
  if (isReplModeEnabled()) {
    const replEnabled = allowedTools.some(tool =>
      toolMatchesName(tool, REPL_TOOL_NAME),
    )
    if (replEnabled) {
      allowedTools = allowedTools.filter(
        tool => !REPL_ONLY_TOOLS.has(tool.name),
      )
    }
  }

  // Filter out any null/undefined tools that might have slipped through
  // (defensive check against initialization timing issues)
  allowedTools = allowedTools.filter(Boolean)

  const isEnabled = allowedTools.map(_ => typeof _.isEnabled === 'function' ? _.isEnabled() : true)
  return allowedTools.filter((_, i) => isEnabled[i])
}

/**
 * Assemble the full tool pool for a given permission context and MCP tools.
 *
 * This is the single source of truth for combining built-in tools with MCP tools.
 * Both REPL.tsx (via useMergedTools hook) and runAgent.ts (for coordinator workers)
 * use this function to ensure consistent tool pool assembly.
 *
 * The function:
 * 1. Gets built-in tools via getTools() (respects mode filtering)
 * 2. Filters MCP tools by deny rules
 * 3. Deduplicates by tool name (built-in tools take precedence)
 *
 * @param permissionContext - Permission context for filtering built-in tools
 * @param mcpTools - MCP tools from appState.mcp.tools
 * @returns Combined, deduplicated array of built-in and MCP tools
 */
export function assembleToolPool(
  permissionContext: ToolPermissionContext,
  mcpTools: Tools,
): Tools {
  const builtInTools = getTools(permissionContext)

  // Filter out MCP tools that are in the deny list, and filter out any null/undefined
  // tools that might have been added by MCP client initialization
  const allowedMcpTools = filterToolsByDenyRules(mcpTools, permissionContext).filter(Boolean)

  // Sort each partition for prompt-cache stability, keeping built-ins as a
  // contiguous prefix. The server's claude_code_system_cache_policy places a
  // global cache breakpoint after the last prefix-matched built-in tool; a flat
  // sort would interleave MCP tools into built-ins and invalidate all downstream
  // cache keys whenever an MCP tool sorts between existing built-ins. uniqBy
  // preserves insertion order, so built-ins win on name conflict.
  // Avoid Array.toSorted (Node 20+) -- we support Node 18. builtInTools is
  // readonly so copy-then-sort; allowedMcpTools is a fresh .filter() result.
  const byName = (a: Tool, b: Tool) => a.name.localeCompare(b.name)
  return uniqBy(
    [...builtInTools].sort(byName).concat(allowedMcpTools.sort(byName)),
    'name',
  )
}

/**
 * Get all tools including both built-in tools and MCP tools.
 *
 * This is the preferred function when you need the complete tools list for:
 * - Tool search threshold calculations (isToolSearchEnabled)
 * - Token counting that includes MCP tools
 * - Any context where MCP tools should be considered
 *
 * Use getTools() only when you specifically need just built-in tools.
 *
 * @param permissionContext - Permission context for filtering built-in tools
 * @param mcpTools - MCP tools from appState.mcp.tools
 * @returns Combined array of built-in and MCP tools
 */
export function getMergedTools(
  permissionContext: ToolPermissionContext,
  mcpTools: Tools,
): Tools {
  const builtInTools = getTools(permissionContext)
  return [...builtInTools, ...mcpTools]
}
