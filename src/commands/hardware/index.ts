import type { Command } from '../../types/command.js'

const hardware = {
  name: 'hardware',
  description: 'Hardware stats and performance mode controls',
  argumentHint: '',
  type: 'local-jsx',
  load: () => import('./hardware.js'),
} satisfies Command

export default hardware
