/**
 * Preconnect to provider APIs to overlap TCP+TLS handshake with startup.
 *
 * The TCP+TLS handshake is ~100-200ms that normally blocks inside the first
 * API call. Kicking a fire-and-forget fetch during init / profile apply lets
 * the handshake happen in parallel with setup, MCP, and the first keystroke.
 *
 * Bun's fetch shares a keep-alive connection pool globally, so the real API
 * request reuses the warmed connection.
 *
 * Called from init.ts AFTER applyExtraCACertsFromConfig() + configureGlobalAgents()
 * and again after applyProviderProfileToProcessEnv() when a saved profile sets
 * OPENAI_BASE_URL (init may run before profile env is applied).
 *
 * Skipped when proxy/mTLS/unix is configured (custom dispatcher won't reuse pool).
 */

import { getOauthConfig } from '../constants/oauth.js'
import { isLocalProviderUrl } from '../services/api/providerConfig.js'
import { createCombinedAbortSignal } from './combinedAbortSignal.js'
import { isEnvTruthy } from './envUtils.js'
import { getAPIProvider } from './model/providers.js'

let lastAnthropicPreconnectTarget: string | undefined
let lastOpenAIPreconnectTarget: string | undefined

/** @internal Test-only reset */
export function resetApiPreconnectStateForTests(): void {
  lastAnthropicPreconnectTarget = undefined
  lastOpenAIPreconnectTarget = undefined
}

function shouldSkipTransportPreconnect(): boolean {
  return Boolean(
    process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy ||
      process.env.ANTHROPIC_UNIX_SOCKET ||
      process.env.CLAUDE_CODE_CLIENT_CERT ||
      process.env.CLAUDE_CODE_CLIENT_KEY,
  )
}

function preconnectBaseUrl(baseUrl: string): void {
  const normalized = baseUrl.replace(/\/+$/, '')
  const { signal, cleanup } = createCombinedAbortSignal(undefined, {
    timeoutMs: 5_000,
  })
  // HEAD: no body; connection enters keep-alive pool as soon as headers arrive.
  // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
  void fetch(normalized, { method: 'HEAD', signal })
    .catch(() => {})
    .finally(cleanup)
}

export function preconnectAnthropicApi(): void {
  if (getAPIProvider() !== 'firstParty') {
    return
  }

  if (
    isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)
  ) {
    return
  }
  if (shouldSkipTransportPreconnect()) {
    return
  }

  const target = (
    process.env.ANTHROPIC_BASE_URL || getOauthConfig().BASE_API_URL
  ).replace(/\/+$/, '')
  if (lastAnthropicPreconnectTarget === target) {
    return
  }
  lastAnthropicPreconnectTarget = target
  preconnectBaseUrl(target)
}

/** Warm TCP+TLS to the active OpenAI-compatible gateway (Opengateway, OpenRouter, etc.). */
export function preconnectOpenAICompatibleApi(): void {
  if (!isEnvTruthy(process.env.CLAUDE_CODE_USE_OPENAI)) {
    return
  }

  const baseUrl = process.env.OPENAI_BASE_URL?.trim()
  if (!baseUrl || isLocalProviderUrl(baseUrl)) {
    return
  }
  if (shouldSkipTransportPreconnect()) {
    return
  }

  const target = baseUrl.replace(/\/+$/, '')
  if (lastOpenAIPreconnectTarget === target) {
    return
  }
  lastOpenAIPreconnectTarget = target
  preconnectBaseUrl(target)
}
