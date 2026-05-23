import { z } from 'zod/v4'
import { PRODUCT_DISPLAY_NAME } from '../../constants/product.js'
import { buildTool } from '../../Tool.js'
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js'
import { getRuleByContentsForTool } from '../../utils/permissions/permissions.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { bashToolHasPermission } from '../BashTool/bashPermissions.js'
import {
  buildMbSubcommandArgs,
  miniBrowserActionSchema,
  miniBrowserPermissionRuleContent,
  type MiniBrowserInput,
} from './buildMbArgs.js'
import { MINI_BROWSER_TOOL_NAME } from './constants.js'
import { DESCRIPTION } from './prompt.js'
import { runMbCommand, runMbStartChrome } from './resolveMb.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    action: miniBrowserActionSchema.describe(
      'mini-browser (mb) subcommand to run',
    ),
    url: z.string().optional().describe('URL for go or tab_new'),
    selector: z.string().optional().describe('CSS selector for text'),
    text: z.string().optional().describe('Text for type action'),
    x: z.number().optional().describe('X coordinate'),
    y: z.number().optional().describe('Y coordinate'),
    x2: z.number().optional().describe('Second X for drag'),
    y2: z.number().optional().describe('Second Y for drag'),
    keys: z
      .array(z.string())
      .optional()
      .describe('Keys for key action (e.g. Meta+a)'),
    fill: z
      .record(z.string(), z.string())
      .optional()
      .describe('Field=value map for fill'),
    code: z.string().optional().describe('JavaScript for js action'),
    wait_for: z
      .string()
      .optional()
      .describe('wait arg: ms, selector, networkidle, or url:pattern'),
    output_file: z
      .string()
      .optional()
      .describe('Screenshot path for shot (default ./shot.png)'),
    tab_id: z.string().optional().describe('Chrome tab id from tab_list'),
    timeout_ms: z.number().int().positive().optional(),
    json_output: z.boolean().optional(),
    scroll_direction: z
      .enum(['up', 'down', 'left', 'right'])
      .optional(),
    scroll_pixels: z.number().int().optional(),
  }),
)

const READ_ONLY_ACTIONS = new Set<MiniBrowserInput['action']>([
  'url',
  'text',
  'shot',
  'snap',
  'audit',
  'tab_list',
])

export const MiniBrowserTool = buildTool({
  name: MINI_BROWSER_TOOL_NAME,
  searchHint: 'browser automation chrome CDP mb go snap screenshot click',
  maxResultSizeChars: 100_000,
  shouldDefer: true,

  isConcurrencySafe() {
    return true
  },

  isReadOnly(input) {
    const parsed = MiniBrowserTool.inputSchema.safeParse(input)
    if (!parsed.success) return false
    return READ_ONLY_ACTIONS.has(parsed.data.action)
  },

  async prompt() {
    return DESCRIPTION
  },

  async description(input) {
    const { action, url } = input as MiniBrowserInput
    if (action === 'go' && url) {
      try {
        return `${PRODUCT_DISPLAY_NAME} wants to open ${new URL(url).hostname} in the browser`
      } catch {
        return `${PRODUCT_DISPLAY_NAME} wants to navigate the browser`
      }
    }
    return `${PRODUCT_DISPLAY_NAME} wants to run browser action: ${action}`
  },

  userFacingName() {
    return 'Browser'
  },

  getToolUseSummary(input) {
    const { action, url } = (input ?? {}) as Partial<MiniBrowserInput>
    if (action === 'go' && url) return url
    return action ?? null
  },

  getActivityDescription(input) {
    const summary = MiniBrowserTool.getToolUseSummary?.(input)
    return summary ? `Browser: ${summary}` : 'Browser automation'
  },

  get inputSchema() {
    return inputSchema()
  },

  toAutoClassifierInput(input) {
    const i = input as MiniBrowserInput
    return i.url ? `${i.action} ${i.url}` : i.action
  },

  async checkPermissions(input, context): Promise<PermissionDecision> {
    const parsed = MiniBrowserTool.inputSchema.safeParse(input)
    if (!parsed.success) {
      return { behavior: 'ask', message: 'Invalid MiniBrowser input' }
    }
    const mbArgs = buildMbSubcommandArgs(parsed.data)
    const bashDecision = await bashToolHasPermission(
      { command: `mb ${mbArgs.join(' ')}` },
      context,
    )
    if (bashDecision.behavior !== 'ask') return bashDecision

    const ruleContent = miniBrowserPermissionRuleContent(parsed.data)
    const permissionContext = context.getAppState().toolPermissionContext
    for (const behavior of ['allow', 'deny', 'ask'] as const) {
      const rule = getRuleByContentsForTool(
        permissionContext,
        MiniBrowserTool,
        behavior,
      ).get(ruleContent)
      if (rule) {
        if (behavior === 'deny') {
          return {
            behavior: 'deny',
            message: `MiniBrowser denied for ${ruleContent}.`,
            decisionReason: { type: 'rule', rule },
          }
        }
        if (behavior === 'allow') {
          return {
            behavior: 'allow',
            updatedInput: input,
            decisionReason: { type: 'rule', rule },
          }
        }
        return {
          behavior: 'ask',
          message: `${PRODUCT_DISPLAY_NAME} wants browser access (${ruleContent}).`,
          decisionReason: { type: 'rule', rule },
        }
      }
    }

    return {
      behavior: 'ask',
      message: `${PRODUCT_DISPLAY_NAME} wants to automate the browser (${parsed.data.action}). Allow once or add a MiniBrowser allow rule.`,
    }
  },

  async call(input, context) {
    const parsed = MiniBrowserTool.inputSchema.parse(input) as MiniBrowserInput

    if (parsed.action === 'start_chrome') {
      const chrome = await runMbStartChrome({
        signal: context.abortController.signal,
      })
      const combined = [chrome.stdout, chrome.stderr].filter(Boolean).join('\n')
      if (chrome.exitCode !== 0) {
        throw new Error(
          combined ||
            'mb-start-chrome failed. Install @runablehq/mini-browser (npm i -g @runablehq/mini-browser) or run from a linked CLI with the dependency.',
        )
      }
      return {
        data:
          combined.trim() ||
          'Chrome started with remote debugging (default port 9222).',
      }
    }

    const subArgs = buildMbSubcommandArgs(parsed)
    const result = await runMbCommand(subArgs, {
      signal: context.abortController.signal,
      timeout: parsed.timeout_ms,
    })

    const out = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    if (result.exitCode !== 0) {
      const hint =
        result.stderr.includes('ECONNREFUSED') ||
        out.includes('connect') ||
        out.includes('9222')
          ? '\n\nHint: run action start_chrome or `mb-start-chrome` first.'
          : ''
      throw new Error(out || `mb exited with code ${result.exitCode}${hint}`)
    }

    return { data: out || '(no output)' }
  },
})
