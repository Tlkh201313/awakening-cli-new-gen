import { normalizeLanguageForSTT } from '../../hooks/useVoice.js'
import { getShortcutDisplay } from '../../keybindings/shortcutFormat.js'
import { logEvent } from '../../services/analytics/index.js'
import { isAnyVoiceSttAvailable } from '../../services/voiceSTTRouter.js'
import {
  getAwakenedVoiceSttSettings,
  isAwakenedCommandVoiceUx,
} from '../../voice/awakenedVoiceConfig.js'
import {
  getVoiceSessionUiState,
  requestVoiceRecordingStart,
  requestVoiceRecordingStop,
} from '../../voice/voiceSessionControl.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import { settingsChangeDetector } from '../../utils/settings/changeDetector.js'
import {
  getInitialSettings,
  updateSettingsForSource,
} from '../../utils/settings/settings.js'

const LANG_HINT_MAX_SHOWS = 2

export async function tryEnableVoiceMode(): Promise<{
  ok: boolean
  message: string
}> {
  const { checkRecordingAvailability, checkVoiceDependencies, requestMicrophonePermission } =
    await import('../../services/voice.js')

  const recording = await checkRecordingAvailability()
  if (!recording.available) {
    return {
      ok: false,
      message:
        recording.reason ?? 'Voice mode is not available in this environment.',
    }
  }

  if (!isAnyVoiceSttAvailable()) {
    return {
      ok: false,
      message: 'Configure speech-to-text first (/voice config).',
    }
  }
  const deps = await checkVoiceDependencies()
  if (!deps.available) {
    const hint = deps.installCommand
      ? `\nInstall audio tools: ${deps.installCommand}`
      : ''
    return {
      ok: false,
      message: `No audio recording tool found.${hint}`,
    }
  }

  if (!(await requestMicrophonePermission())) {
    let guidance: string
    if (process.platform === 'win32') {
      guidance = 'Settings → Privacy → Microphone'
    } else if (process.platform === 'linux') {
      guidance = "your system's audio settings"
    } else {
      guidance = 'System Settings → Privacy & Security → Microphone'
    }
    return {
      ok: false,
      message: `Microphone access denied. Enable in ${guidance}, then run /voice again.`,
    }
  }

  const result = updateSettingsForSource('userSettings', { voiceEnabled: true })
  if (result.error) {
    return {
      ok: false,
      message:
        'Failed to update settings. Check your settings file for syntax errors.',
    }
  }
  settingsChangeDetector.notifyChange('userSettings')
  logEvent('tengu_voice_toggled', { enabled: true })

  const currentSettings = getInitialSettings()
  const stt = normalizeLanguageForSTT(currentSettings.language)
  const cfg = getGlobalConfig()
  const langChanged = cfg.voiceLangHintLastLanguage !== stt.code
  const priorCount = langChanged ? 0 : (cfg.voiceLangHintShownCount ?? 0)
  const showHint = !stt.fellBackFrom && priorCount < LANG_HINT_MAX_SHOWS
  let langNote = ''
  if (stt.fellBackFrom) {
    langNote = ` Note: unsupported dictation language; using English.`
  } else if (showHint) {
    langNote = ` Dictation language: ${stt.code}.`
  }
  if (langChanged || showHint) {
    saveGlobalConfig(prev => ({
      ...prev,
      voiceLangHintShownCount: priorCount + (showHint ? 1 : 0),
      voiceLangHintLastLanguage: stt.code,
    }))
  }

  const backend = getAwakenedVoiceSttSettings()
    ? `STT: ${getAwakenedVoiceSttSettings()!.provider}`
    : 'Claude.ai voice stream'

  const howTo = isAwakenedCommandVoiceUx()
    ? 'Run /voice to dictate; press Enter when done.'
    : `Hold ${getShortcutDisplay('voice:pushToTalk', 'Chat', 'Space')} to record.`

  return {
    ok: true,
    message: `Voice enabled (${backend}). ${howTo}${langNote}`,
  }
}

/** /voice in command mode: start/stop dictation (Enter also stops). */
export async function runAwakenedVoiceDictation(): Promise<{
  ok: boolean
  message: string
}> {
  const session = getVoiceSessionUiState()
  if (session === 'recording') {
    requestVoiceRecordingStop()
    return { ok: true, message: 'Finishing dictation…' }
  }
  if (session === 'processing') {
    return {
      ok: false,
      message: 'Still processing last recording — wait a moment.',
    }
  }

  const voiceOn = getInitialSettings().voiceEnabled === true
  if (!voiceOn) {
    const enabled = await tryEnableVoiceMode()
    if (!enabled.ok) return enabled
  }

  requestVoiceRecordingStart()
  return {
    ok: true,
    message: 'Recording… Speak now, then press Enter (or /voice again) to put text in the prompt.',
  }
}

export function tryDisableVoiceMode(): { ok: boolean; message: string } {
  const result = updateSettingsForSource('userSettings', {
    voiceEnabled: false,
  })
  if (result.error) {
    return {
      ok: false,
      message:
        'Failed to update settings. Check your settings file for syntax errors.',
    }
  }
  settingsChangeDetector.notifyChange('userSettings')
  logEvent('tengu_voice_toggled', { enabled: false })
  return { ok: true, message: 'Voice mode disabled.' }
}
