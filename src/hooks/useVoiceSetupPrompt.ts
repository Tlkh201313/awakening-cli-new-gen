import { feature } from 'bun:bundle'
import { useEffect } from 'react'
import { shouldShowVoiceSetupAtStartup } from '../voice/awakenedVoiceConfig.js'

/** Show voice STT setup bar on first launch when not configured. */
export function useVoiceSetupPrompt(
  setShowVoiceSetup: (show: boolean) => void,
): void {
  useEffect(() => {
    if (!feature('VOICE_MODE')) return
    if (!shouldShowVoiceSetupAtStartup()) return
    setShowVoiceSetup(true)
  }, [setShowVoiceSetup])
}
