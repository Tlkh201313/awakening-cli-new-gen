import type { Command } from '../../commands.js'

const awakened = {
  name: 'awakened',
  aliases: ['awakened-capabilities', 'capabilities'],
  description: 'Toggle Awakened auto-capability packs (Space · Enter · Esc)',
  argumentHint: '',
  type: 'local-jsx',
  load: () => import('./awakened.js'),
} satisfies Command

export default awakened
