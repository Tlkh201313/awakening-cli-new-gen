import type { Command } from '../../commands.js'
import { getGlobalConfig } from '../../utils/config.js'

const thinking = {
  type: 'local-jsx',
  name: 'thinking',
  get description(): string {
    const hidden = getGlobalConfig().hideThinkingBlocks ?? false
    return `Toggle thinking block display (current: ${hidden ? 'hidden' : 'visible'})`
  },
  isHidden: false,
  load: () => import('./thinking.js'),
} satisfies Command

export default thinking
