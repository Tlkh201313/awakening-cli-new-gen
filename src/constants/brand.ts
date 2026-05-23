/**
 * Awakened product naming + config paths.
 * Legacy OpenClaude / .claude paths stay readable via migration + fallbacks.
 */

import { homedir } from 'os'
import { join } from 'path'

export const PRODUCT_NAME = 'Awakened'
export const PRODUCT_NAME_UPPER = 'AWAKENED'
export const CLI_BINARY_NAME = 'awakened'
/** Kept as npm/bin alias — do not remove. */
export const LEGACY_CLI_BINARY_NAME = 'openclaude'

export const CONFIG_DIR_NAME = '.awakened'
export const LEGACY_CONFIG_DIR_NAMES = ['.openclaude', '.claude'] as const

export const GLOBAL_CONFIG_BASENAME = '.awakened'
export const LEGACY_GLOBAL_CONFIG_BASENAMES = ['.openclaude', '.claude'] as const

export const PROFILE_FILE_NAME = '.awakened-profile.json'
export const LEGACY_PROFILE_FILE_NAMES = [
  '.openclaude-profile.json',
  '.claude-profile.json',
] as const

export const PROJECT_CONFIG_DIR_NAMES = [
  CONFIG_DIR_NAME,
  ...LEGACY_CONFIG_DIR_NAMES,
] as const

export const NPM_PACKAGE_NAME = '@gitlawb/awakened'
export const LEGACY_NPM_PACKAGE_NAME = '@gitlawb/openclaude'

export const ISSUES_URL = 'https://github.com/Tlkh201313/awakening-cli-new-gen/issues'
export const REPO_URL = 'https://github.com/Tlkh201313/awakening-cli-new-gen'

/** Read AWAKENED_* then OPENCLAUDE_* env (non-breaking rebrand). */
export function awakenedEnv(suffix: string): string | undefined {
  return (
    process.env[`AWAKENED_${suffix}`] ?? process.env[`OPENCLAUDE_${suffix}`]
  )
}

export function getAwakenedConfigHomePath(homeDir: string = homedir()): string {
  return join(homeDir, CONFIG_DIR_NAME)
}

export function resolveGlobalConfigFilePath(options: {
  configDir: string
  oauthSuffix?: string
  existsSync: (path: string) => boolean
  hasExplicitConfigDir?: boolean
}): string {
  const oauthSuffix = options.oauthSuffix ?? ''
  const basenames = [
    `${GLOBAL_CONFIG_BASENAME}${oauthSuffix}.json`,
    ...LEGACY_GLOBAL_CONFIG_BASENAMES.map(b => `${b}${oauthSuffix}.json`),
  ]

  if (options.hasExplicitConfigDir) {
    for (const name of basenames) {
      const path = join(options.configDir, name)
      if (options.existsSync(path)) return path
    }
    return join(options.configDir, basenames[0]!)
  }

  for (const name of basenames) {
    const path = join(options.configDir, name)
    if (options.existsSync(path)) return path
  }
  return join(options.configDir, basenames[0]!)
}

export function resolveStoredProfileFilePath(
  configDir: string,
  existsSync: (path: string) => boolean,
): string {
  const candidates = [PROFILE_FILE_NAME, ...LEGACY_PROFILE_FILE_NAMES]
  for (const name of candidates) {
    const path = join(configDir, name)
    if (existsSync(path)) return path
  }
  return join(configDir, PROFILE_FILE_NAME)
}
