import type { Command } from '../../commands.js'

const thinking = {
  type: 'local-jsx',
  name: 'thinking',
  description: 'Toggle thinking display (show/hide model reasoning)',
  argumentHint: '[on|off]',
  immediate: true,
  load: () => import('./thinking.js'),
} satisfies Command

export default thinking
