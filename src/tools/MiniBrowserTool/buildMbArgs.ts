import { z } from 'zod/v4'

export const miniBrowserActionSchema = z.enum([
  'start_chrome',
  'go',
  'url',
  'back',
  'forward',
  'text',
  'shot',
  'snap',
  'click',
  'type',
  'fill',
  'key',
  'scroll',
  'drag',
  'move',
  'js',
  'wait',
  'audit',
  'tab_list',
  'tab_new',
  'tab_close',
])

export type MiniBrowserInput = {
  action: z.infer<typeof miniBrowserActionSchema>
  url?: string
  selector?: string
  text?: string
  x?: number
  y?: number
  x2?: number
  y2?: number
  keys?: string[]
  fill?: Record<string, string>
  code?: string
  wait_for?: string
  output_file?: string
  tab_id?: string
  timeout_ms?: number
  json_output?: boolean
  scroll_direction?: 'up' | 'down' | 'left' | 'right'
  scroll_pixels?: number
}

export function buildMbSubcommandArgs(input: MiniBrowserInput): string[] {
  const flags: string[] = []
  if (input.tab_id) flags.push('--tab', input.tab_id)
  if (input.timeout_ms !== undefined) flags.push('--timeout', String(input.timeout_ms))
  if (input.json_output) flags.push('--json')

  const withFlags = (args: string[]) => [...args, ...flags]

  switch (input.action) {
    case 'start_chrome':
      return []
    case 'go':
      if (!input.url) throw new Error('go requires url')
      return withFlags(['go', input.url])
    case 'url':
      return withFlags(['url'])
    case 'back':
      return withFlags(['back'])
    case 'forward':
      return withFlags(['forward'])
    case 'text':
      return withFlags(
        input.selector ? ['text', input.selector] : ['text'],
      )
    case 'shot':
      return withFlags(
        input.output_file ? ['shot', input.output_file] : ['shot'],
      )
    case 'snap':
      return withFlags(['snap'])
    case 'click': {
      if (input.x === undefined || input.y === undefined) {
        throw new Error('click requires x and y')
      }
      return withFlags(['click', String(input.x), String(input.y)])
    }
    case 'type': {
      if (!input.text) throw new Error('type requires text')
      if (input.x !== undefined && input.y !== undefined) {
        return withFlags([
          'type',
          String(input.x),
          String(input.y),
          input.text,
        ])
      }
      return withFlags(['type', input.text])
    }
    case 'fill': {
      if (!input.fill || Object.keys(input.fill).length === 0) {
        throw new Error('fill requires fill map of field=value')
      }
      const pairs = Object.entries(input.fill).map(
        ([k, v]) => `${k}=${v}`,
      )
      return withFlags(['fill', ...pairs])
    }
    case 'key': {
      if (!input.keys?.length) throw new Error('key requires keys array')
      return withFlags(['key', ...input.keys])
    }
    case 'scroll': {
      const parts = ['scroll']
      if (input.scroll_direction) parts.push(input.scroll_direction)
      if (input.scroll_pixels !== undefined) {
        parts.push(String(input.scroll_pixels))
      }
      return withFlags(parts)
    }
    case 'drag': {
      if (
        input.x === undefined ||
        input.y === undefined ||
        input.x2 === undefined ||
        input.y2 === undefined
      ) {
        throw new Error('drag requires x, y, x2, y2')
      }
      return withFlags([
        'drag',
        String(input.x),
        String(input.y),
        String(input.x2),
        String(input.y2),
      ])
    }
    case 'move': {
      if (input.x === undefined || input.y === undefined) {
        throw new Error('move requires x and y')
      }
      return withFlags(['move', String(input.x), String(input.y)])
    }
    case 'js': {
      if (!input.code) throw new Error('js requires code')
      return withFlags(['js', input.code])
    }
    case 'wait': {
      if (!input.wait_for) throw new Error('wait requires wait_for')
      return withFlags(['wait', input.wait_for])
    }
    case 'audit':
      return withFlags(['audit'])
    case 'tab_list':
      return withFlags(['tab', 'list'])
    case 'tab_new':
      return withFlags(
        input.url ? ['tab', 'new', input.url] : ['tab', 'new'],
      )
    case 'tab_close':
      return withFlags(
        input.tab_id ? ['tab', 'close', input.tab_id] : ['tab', 'close'],
      )
    default: {
      const _exhaustive: never = input.action
      throw new Error(`Unknown action: ${_exhaustive}`)
    }
  }
}

export function miniBrowserPermissionRuleContent(input: MiniBrowserInput): string {
  if (input.action === 'go' && input.url) {
    try {
      return `host:${new URL(input.url).hostname}`
    } catch {
      return `action:go`
    }
  }
  return `action:${input.action}`
}
