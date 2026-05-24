import { feature } from 'bun:bundle'
import { useEffect, useRef } from 'react'
import { isAnyVoiceSttAvailable } from '../services/voiceSTTRouter.js'
import { isVoiceEnableOnStartup } from '../voice/awakenedVoiceConfig.js'
import { settingsChangeDetector } from '../utils/settings/changeDetector.js'
import {
  getInitialSettings,
  updateSettingsForSource,
} from '../utils/settings/settings.js'

/**
 * When /voice startup is on, enable voiceEnabled once per process if STT + mic work.
 */
export function useVoiceStartup(): void {
  const ranRef = useRef(false)

  useEffect(() => {
    if (!feature('VOICE_MODE') || ranRef.current) return
    if (!isVoiceEnableOnStartup()) return
    if (getInitialSettings().voiceEnabled === true) return
    if (!isAnyVoiceSttAvailable()) return

    ranRef.current = true
    void (async () => {
      const { checkRecordingAvailability } = await import('../services/voice.js')
      const rec = await checkRecordingAvailability()
      if (!rec.available) return
      const result = updateSettingsForSource('userSettings', {
        voiceEnabled: true,
      })
      if (!result.error) {
        settingsChangeDetector.notifyChange('userSettings')
      }
    })()
  }, [])
}
