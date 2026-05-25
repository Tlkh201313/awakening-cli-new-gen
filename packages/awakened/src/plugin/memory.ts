import type { Hooks, PluginInput } from "@awakened-ai/plugin"
import { tool } from "@awakened-ai/plugin/tool"
import type { Info as ConfigInfo } from "@/config/config"
import { autoSaveFromTool, getMemoryAutoConfig } from "@/memory/auto"
import * as MemoryStore from "@/memory/store"

async function loadMemoryConfig(client: PluginInput["client"]) {
  try {
    const response = await client.config.get()
    if (response.data) return getMemoryAutoConfig(response.data as ConfigInfo)
  } catch {
    // fall through to defaults
  }
  return getMemoryAutoConfig({})
}

export async function AwakenedMemoryPlugin(input: PluginInput): Promise<Hooks> {
  return {
    "experimental.chat.system.transform": async (_hookInput, output) => {
      const cfg = await loadMemoryConfig(input.client)
      if (!cfg.autoSave && !cfg.autoRecall) return
      output.system.push(
        [
          "# Awakened memory (auto)",
          cfg.autoRecall ? "- Relevant notes are auto-recalled each turn." : "",
          cfg.autoSave
            ? "- Auto-save: user prefs, tool outcomes, and turn summaries (Claude-mem style)."
            : "",
          "- **Every turn:** call mem_save for decisions, bugfixes (root cause + file paths), discoveries, and commands — do not rely on auto-save alone.",
          "- Before reversing prior work: mem_search first. Load skills awakened-mem or mem-search for full workflow.",
          "- Tags: bugfix, feature, decision, discovery, change, refactor.",
        ]
          .filter(Boolean)
          .join("\n"),
      )
    },
    "tool.execute.after": async (hookInput, hookOutput) => {
      const cfg = await loadMemoryConfig(input.client)
      await autoSaveFromTool({
        tool: hookInput.tool,
        title: hookOutput.title,
        output: hookOutput.output,
        worktree: input.worktree,
        cfg,
      })
    },
    tool: {
      mem_save: tool({
        description: "Save a durable memory entry for future sessions (project or global scope).",
        args: {
          title: tool.schema.string().describe("Short searchable title"),
          content: tool.schema.string().describe("Facts, decisions, commands, or conventions to remember"),
          tags: tool.schema.array(tool.schema.string()).optional().describe("Optional lowercase tags"),
          scope: tool.schema.enum(["project", "global"]).optional().describe("project (default) or global"),
        },
        async execute(args, ctx) {
          const entry = await MemoryStore.saveUnique({
            title: args.title,
            content: args.content,
            tags: args.tags,
            scope: args.scope,
            worktree: ctx.worktree,
          })
          if (!entry) {
            return {
              title: args.title,
              output: "Memory already saved (duplicate skipped).",
              metadata: { duplicate: true },
            }
          }
          return {
            title: entry.title,
            output: `Saved memory ${entry.id} (${entry.scope})`,
            metadata: { id: entry.id, scope: entry.scope },
          }
        },
      }),
      mem_search: tool({
        description: "Search saved memories by keywords before re-deciding or re-explaining.",
        args: {
          query: tool.schema.string().describe("Search terms"),
          limit: tool.schema.number().int().min(1).max(20).optional(),
          scope: tool.schema.enum(["project", "global", "all"]).optional(),
        },
        async execute(args, ctx) {
          const entries = await MemoryStore.search({
            query: args.query,
            limit: args.limit,
            scope: args.scope,
            worktree: ctx.worktree,
          })
          return {
            title: `${entries.length} memories`,
            output: MemoryStore.formatEntries(entries),
            metadata: { count: entries.length },
          }
        },
      }),
      mem_list: tool({
        description: "List recent saved memories.",
        args: {
          limit: tool.schema.number().int().min(1).max(50).optional(),
          scope: tool.schema.enum(["project", "global", "all"]).optional(),
        },
        async execute(args, ctx) {
          const entries = await MemoryStore.list({
            limit: args.limit,
            scope: args.scope,
            worktree: ctx.worktree,
          })
          return {
            title: `${entries.length} memories`,
            output: MemoryStore.formatEntries(entries),
            metadata: { count: entries.length },
          }
        },
      }),
    },
  }
}
