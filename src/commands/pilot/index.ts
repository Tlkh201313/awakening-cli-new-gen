import type { Command } from '../../commands.js'

const pilot = {
  type: 'local-jsx',
  name: 'pilot',
  description:
    'Toggle pilot mode (auto-approve all permissions except removal commands)',
  argumentHint: '[on|off]',
  immediate: true,
  load: () => import('./pilot.js'),
} satisfies Command

export default pilot
