import * as React from 'react'
import { useCallback, useState } from 'react'
import { Box, Text } from '../../ink.js'
import { Select } from '../../components/CustomSelect/index.js'
import TextInput from '../../components/TextInput.js'
import { Pane } from '../../components/design-system/Pane.js'
import { Byline } from '../../components/design-system/Byline.js'
import { KeyboardShortcutHint } from '../../components/design-system/KeyboardShortcutHint.js'
import type { LocalJSXCommandOnDone } from '../../types/command.js'
import {
  DEFAULT_VOICE_BASE_URLS,
  DEFAULT_VOICE_MODELS,
  dismissVoiceSetup,
  FREE_STT_SIGNUP_HINTS,
  isVoiceEnableOnStartup,
  saveVoiceSttSettings,
  type AwakenedVoiceSttProvider,
} from '../../voice/awakenedVoiceConfig.js'
import { getGlobalConfig } from '../../utils/config.js'
import { tryEnableVoiceMode } from './voiceActions.js'

type Step =
  | 'provider'
  | 'apiKey'
  | 'model'
  | 'baseUrl'
  | 'startup'
  | 'enableNow'

type Props = {
  onDone: LocalJSXCommandOnDone
  variant?: 'startup' | 'settings'
  /** After first-time save, offer to turn voice on immediately. */
  offerEnableAfterSave?: boolean
}

const PROVIDER_OPTIONS = [
  {
    value: 'groq',
    label: 'Groq (free tier)',
    description: FREE_STT_SIGNUP_HINTS.groq.url,
  },
  {
    value: 'deepgram',
    label: 'Deepgram ($200 free credit)',
    description: FREE_STT_SIGNUP_HINTS.deepgram.url,
  },
  {
    value: 'huggingface',
    label: 'Hugging Face Inference',
    description: FREE_STT_SIGNUP_HINTS.huggingface.url,
  },
  {
    value: 'compatible',
    label: 'OpenAI-compatible endpoint',
    description: 'Custom base URL + Whisper-style API',
  },
] as const

function loadInitial(): {
  provider: AwakenedVoiceSttProvider
  apiKey: string
  model: string
  baseUrl: string
  startup: boolean
} {
  const cfg = getGlobalConfig().voiceStt
  const provider = (cfg?.provider ?? 'groq') as AwakenedVoiceSttProvider
  return {
    provider,
    apiKey: cfg?.apiKey ?? '',
    model: cfg?.model ?? DEFAULT_VOICE_MODELS[provider],
    baseUrl: cfg?.baseUrl ?? DEFAULT_VOICE_BASE_URLS[provider],
    startup: isVoiceEnableOnStartup(),
  }
}

export function VoiceConfigPanel({
  onDone,
  variant = 'settings',
  offerEnableAfterSave = false,
}: Props): React.ReactElement {
  const initial = loadInitial()
  const [step, setStep] = useState<Step>('provider')
  const [provider, setProvider] = useState<AwakenedVoiceSttProvider>(
    initial.provider,
  )
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [apiKeyCursor, setApiKeyCursor] = useState(initial.apiKey.length)
  const [model, setModel] = useState(initial.model)
  const [modelCursor, setModelCursor] = useState(initial.model.length)
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl)
  const [baseUrlCursor, setBaseUrlCursor] = useState(initial.baseUrl.length)
  const [startup, setStartup] = useState(initial.startup)
  const [error, setError] = useState<string | null>(null)

  const title =
    variant === 'startup'
      ? 'Set up voice dictation'
      : 'Voice — provider & API settings'

  const finishSave = useCallback(
    (enableNow: boolean) => {
      if (!apiKey.trim()) {
        setError('API key is required')
        setStep('apiKey')
        return
      }
      saveVoiceSttSettings({
        provider,
        apiKey: apiKey.trim(),
        model: model.trim() || undefined,
        baseUrl: provider === 'compatible' ? baseUrl.trim() : undefined,
        enableOnStartup: startup,
      })
      void (async () => {
        if (enableNow) {
          const r = await tryEnableVoiceMode()
          onDone(r.message, { display: 'system' })
          return
        }
        onDone(
          `Saved ${provider} STT settings${startup ? ' · auto-enable on startup' : ''}.`,
          { display: 'system' },
        )
      })()
    },
    [apiKey, baseUrl, model, onDone, provider, startup],
  )

  const handleProvider = useCallback(
    (value: string) => {
      const p = value as AwakenedVoiceSttProvider
      setProvider(p)
      setModel(DEFAULT_VOICE_MODELS[p])
      setModelCursor(DEFAULT_VOICE_MODELS[p].length)
      setBaseUrl(DEFAULT_VOICE_BASE_URLS[p])
      setBaseUrlCursor(DEFAULT_VOICE_BASE_URLS[p].length)
      setError(null)
      setStep('apiKey')
    },
    [],
  )

  const handleApiKeySubmit = useCallback(() => {
    if (!apiKey.trim()) {
      setError('Paste your API key')
      return
    }
    setError(null)
    setStep('model')
  }, [apiKey])

  const handleModelSubmit = useCallback(() => {
    setError(null)
    if (provider === 'compatible') {
      setStep('baseUrl')
      return
    }
    setStep('startup')
  }, [provider])

  const handleBaseUrlSubmit = useCallback(() => {
    if (!baseUrl.trim()) {
      setError('Base URL is required for compatible mode')
      return
    }
    setError(null)
    setStep('startup')
  }, [baseUrl])

  const handleStartup = useCallback(
    (value: string) => {
      const on = value === 'yes'
      setStartup(on)
      if (offerEnableAfterSave && variant === 'startup') {
        setStep('enableNow')
        return
      }
      finishSave(false)
    },
    [finishSave, offerEnableAfterSave, variant],
  )

  const handleEnableNow = useCallback(
    (value: string) => {
      finishSave(value === 'yes')
    },
    [finishSave],
  )

  const handleCancel = useCallback(() => {
    if (variant === 'startup') {
      dismissVoiceSetup()
    }
    onDone('Voice setup cancelled', { display: 'system' })
  }, [onDone, variant])

  const signupHint = FREE_STT_SIGNUP_HINTS[provider === 'compatible' ? 'groq' : provider]

  return (
    <Pane color="permission">
      <Box flexDirection="column" paddingX={1}>
        <Text bold color="remember">
          {title}
        </Text>
        <Text dimColor>
          Free cloud speech-to-text · saved to ~/.awakened
        </Text>

        {step === 'provider' && (
          <Box marginTop={1} flexDirection="column">
            <Text>STT provider</Text>
            <Select
              defaultValue={provider}
              defaultFocusValue={provider}
              options={[...PROVIDER_OPTIONS]}
              onChange={handleProvider}
              onCancel={handleCancel}
            />
          </Box>
        )}

        {step === 'apiKey' && (
          <Box marginTop={1} flexDirection="column">
            <Text>
              API key ({provider}) — {signupHint.url}
            </Text>
            <Box marginTop={1}>
              <TextInput
                value={apiKey}
                onChange={setApiKey}
                onSubmit={handleApiKeySubmit}
                columns={72}
                cursorOffset={apiKeyCursor}
                onChangeCursorOffset={setApiKeyCursor}
                focus
                showCursor
                mask="*"
              />
            </Box>
          </Box>
        )}

        {step === 'model' && (
          <Box marginTop={1} flexDirection="column">
            <Text>Model</Text>
            <Text dimColor>Default: {DEFAULT_VOICE_MODELS[provider]}</Text>
            <Box marginTop={1}>
              <TextInput
                value={model}
                onChange={setModel}
                onSubmit={handleModelSubmit}
                columns={72}
                cursorOffset={modelCursor}
                onChangeCursorOffset={setModelCursor}
                focus
                showCursor
              />
            </Box>
          </Box>
        )}

        {step === 'baseUrl' && (
          <Box marginTop={1} flexDirection="column">
            <Text>API base URL</Text>
            <Box marginTop={1}>
              <TextInput
                value={baseUrl}
                onChange={setBaseUrl}
                onSubmit={handleBaseUrlSubmit}
                columns={72}
                cursorOffset={baseUrlCursor}
                onChangeCursorOffset={setBaseUrlCursor}
                focus
                showCursor
              />
            </Box>
          </Box>
        )}

        {step === 'startup' && (
          <Box marginTop={1} flexDirection="column">
            <Text>Enable voice automatically when Awakened starts?</Text>
            <Select
              defaultValue={startup ? 'yes' : 'no'}
              defaultFocusValue={startup ? 'yes' : 'no'}
              options={[
                { value: 'yes', label: 'Yes — enable on startup' },
                { value: 'no', label: 'No — I will run /voice manually' },
              ]}
              onChange={handleStartup}
              onCancel={handleCancel}
            />
          </Box>
        )}

        {step === 'enableNow' && (
          <Box marginTop={1} flexDirection="column">
            <Text>Enable dictation now? (/voice to record, Enter when done)</Text>
            <Select
              defaultValue="yes"
              defaultFocusValue="yes"
              options={[
                { value: 'yes', label: 'Yes — enable voice now' },
                { value: 'no', label: 'Not now' },
              ]}
              onChange={handleEnableNow}
              onCancel={handleCancel}
            />
          </Box>
        )}

        {error ? (
          <Box marginTop={1}>
            <Text color="error">{error}</Text>
          </Box>
        ) : null}

        <Box marginTop={1}>
          <Text dimColor italic>
            <Byline>
              {step === 'apiKey' || step === 'model' || step === 'baseUrl' ? (
                <KeyboardShortcutHint shortcut="Enter" action="next" />
              ) : (
                <KeyboardShortcutHint shortcut="Enter" action="confirm" />
              )}
              <KeyboardShortcutHint shortcut="Esc" action="cancel" />
            </Byline>
          </Text>
        </Box>
      </Box>
    </Pane>
  )
}
