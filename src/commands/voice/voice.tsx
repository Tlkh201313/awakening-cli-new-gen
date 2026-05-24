import { feature } from 'bun:bundle'
import type { LocalJSXCommandCall } from '../../types/command.js'
import { isAnyVoiceSttAvailable } from '../../services/voiceSTTRouter.js'
import {
  isVoiceEnableOnStartup,
  setVoiceEnableOnStartup,
} from '../../voice/awakenedVoiceConfig.js'
import { getInitialSettings } from '../../utils/settings/settings.js'
import { VoiceConfigPanel } from './VoiceConfigPanel.js'
import { isAwakenedCommandVoiceUx } from '../../voice/awakenedVoiceConfig.js'
import {
  runAwakenedVoiceDictation,
  tryDisableVoiceMode,
  tryEnableVoiceMode,
} from './voiceActions.js'

function parseArgs(raw: string | undefined): string[] {
  const s = typeof raw === 'string' ? raw : ''
  return s.trim().split(/\s+/).filter(Boolean)
}

export const call: LocalJSXCommandCall = async (onDone, _context, args) => {
  if (!feature('VOICE_MODE')) {
    onDone('Voice mode is not included in this build.', { display: 'system' })
    return null
  }

  const parts = parseArgs(args)
  const sub = parts[0]?.toLowerCase()

  if (sub === 'startup') {
    const next = !isVoiceEnableOnStartup()
    setVoiceEnableOnStartup(next)
    onDone(
      next
        ? 'Voice will enable on CLI startup when STT and mic are ready.'
        : 'Voice will not auto-enable on startup.',
      { display: 'system' },
    )
    return null
  }

  if (sub === 'help') {
    const usage = isAwakenedCommandVoiceUx()
      ? '/voice — start dictation · Enter when done · /voice off — disable · /voice config · /voice startup'
      : '/voice — toggle dictation · /voice config · /voice startup'
    onDone(usage, { display: 'system' })
    return null
  }

  if (sub === 'off' || sub === 'disable') {
    const r = tryDisableVoiceMode()
    onDone(r.message, { display: 'system' })
    return null
  }

  if (sub === 'config') {
    return (
      <VoiceConfigPanel onDone={onDone} variant="settings" />
    )
  }

  if (isAwakenedCommandVoiceUx() && parts.length === 0) {
    if (!isAnyVoiceSttAvailable()) {
      return (
        <VoiceConfigPanel
          onDone={onDone}
          variant="settings"
          offerEnableAfterSave
        />
      )
    }
    const r = await runAwakenedVoiceDictation()
    onDone(r.message, { display: 'system' })
    return null
  }

  const voiceOn = getInitialSettings().voiceEnabled === true

  if (voiceOn && parts.length === 0) {
    const r = tryDisableVoiceMode()
    onDone(r.message, { display: 'system' })
    return null
  }

  if (!isAnyVoiceSttAvailable()) {
    return (
      <VoiceConfigPanel
        onDone={onDone}
        variant="settings"
        offerEnableAfterSave
      />
    )
  }

  const r = await tryEnableVoiceMode()
  onDone(r.message, { display: 'system' })
  return null
}
