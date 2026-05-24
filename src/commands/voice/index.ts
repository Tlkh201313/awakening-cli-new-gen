import { feature } from 'bun:bundle'
import type { Command } from '../../commands.js'
import { isVoiceGrowthBookEnabled } from '../../voice/voiceModeEnabled.js'

const voice = {
  type: 'local-jsx',
  name: 'voice',
  description: 'Speech-to-text dictation (/voice, Enter when done)',
  argumentHint: '[config|startup]',
  isEnabled: () => feature('VOICE_MODE') && isVoiceGrowthBookEnabled(),
  get isHidden() {
    return !feature('VOICE_MODE')
  },
  load: () => import('./voice.js'),
} satisfies Command

export default voice
