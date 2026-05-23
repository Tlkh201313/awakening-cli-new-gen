import memoize from 'lodash-es/memoize.js'
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  readdirSync,
  statSync,
  symlinkSync,
} from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'
import {
  getAwakenedConfigHomePath,
  GLOBAL_CONFIG_BASENAME,
  LEGACY_CONFIG_DIR_NAMES,
  LEGACY_GLOBAL_CONFIG_BASENAMES,
} from '../constants/brand.js'

const LEGACY_GLOBAL_CONFIG_FILE_RE =
  /^\.(?:claude|openclaude)(?:-(?:custom|local|staging)-oauth)?\.json$/

function getErrnoCode(error: unknown): string | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code
  }
  return undefined
}

function pathExists(path: string): boolean {
  try {
    lstatSync(path)
    return true
  } catch (error) {
    if (getErrnoCode(error) === 'ENOENT') {
      return false
    }
    return true
  }
}

function pathIsDirectory(path: string): boolean {
  try {
    return lstatSync(path).isDirectory()
  } catch {
    return false
  }
}

function getSymlinkType(source: string): 'dir' | 'file' | 'junction' {
  if (process.platform !== 'win32') {
    return 'file'
  }

  try {
    return statSync(source).isDirectory() ? 'junction' : 'file'
  } catch {
    return 'file'
  }
}

function copyMissingPathSync(source: string, destination: string): void {
  const sourceStats = lstatSync(source)

  if (sourceStats.isDirectory()) {
    if (!pathExists(destination)) {
      // Match fsOperations' recursive mkdir behavior while keeping this module
      // independent from the config-home resolver it backs.
      mkdirSync(destination, { recursive: true })
    } else if (!lstatSync(destination).isDirectory()) {
      throw new Error(`Cannot migrate ${source}: ${destination} is not a directory`)
    }

    for (const entry of readdirSync(source)) {
      copyMissingPathSync(join(source, entry), join(destination, entry))
    }
    return
  }

  if (pathExists(destination)) {
    return
  }

  mkdirSync(dirname(destination), { recursive: true })

  if (sourceStats.isSymbolicLink()) {
    symlinkSync(readlinkSync(source), destination, getSymlinkType(source))
    return
  }

  if (sourceStats.isFile()) {
    copyFileSync(source, destination)
  }
}

function getLegacyGlobalConfigFiles(homeDir: string): string[] {
  try {
    return readdirSync(homeDir).filter(file =>
      LEGACY_GLOBAL_CONFIG_FILE_RE.test(file),
    )
  } catch (error) {
    if (getErrnoCode(error) === 'ENOENT') {
      return []
    }
    throw error
  }
}

export function migrateLegacyClaudeConfigHome(options?: {
  configDirEnv?: string
  homeDir?: string
}): boolean {
  if (options?.configDirEnv) {
    return true
  }

  const homeDir = options?.homeDir ?? homedir()
  const awakenedDir = getAwakenedConfigHomePath(homeDir)

  try {
    const legacyGlobalConfigFiles = getLegacyGlobalConfigFiles(homeDir)
    const legacyDirs = LEGACY_CONFIG_DIR_NAMES.map(name =>
      join(homeDir, name),
    ).filter(pathIsDirectory)

    if (legacyDirs.length === 0 && legacyGlobalConfigFiles.length === 0) {
      return true
    }

    for (const legacyDir of legacyDirs) {
      copyMissingPathSync(legacyDir, awakenedDir)
    }

    for (const legacyFile of legacyGlobalConfigFiles) {
      const awakenedFile = legacyFile.replace(
        /^\.(?:claude|openclaude)/,
        GLOBAL_CONFIG_BASENAME,
      )
      copyMissingPathSync(join(homeDir, legacyFile), join(homeDir, awakenedFile))
    }

    for (const legacyBase of LEGACY_GLOBAL_CONFIG_BASENAMES) {
      const legacyOAuthFiles = readdirSync(homeDir).filter(file =>
        file.startsWith(`${legacyBase}-`) && file.endsWith('.json'),
      )
      for (const legacyFile of legacyOAuthFiles) {
        const awakenedFile = legacyFile.replace(
          new RegExp(`^${legacyBase.replace('.', '\\.')}`),
          GLOBAL_CONFIG_BASENAME,
        )
        copyMissingPathSync(
          join(homeDir, legacyFile),
          join(homeDir, awakenedFile),
        )
      }
    }

    return true
  } catch {
    return false
  }
}

export function resolveClaudeConfigHomeDir(options?: {
  configDirEnv?: string
  homeDir?: string
}): string {
  if (options?.configDirEnv) {
    return options.configDirEnv.normalize('NFC')
  }

  const homeDir = options?.homeDir ?? homedir()
  return getAwakenedConfigHomePath(homeDir).normalize('NFC')
}

let claudeConfigHomeDirOverride: string | undefined

export function setClaudeConfigHomeDirForTesting(
  configDir: string | undefined,
): void {
  claudeConfigHomeDirOverride = configDir?.normalize('NFC')
}

// Memoized: 150+ callers, many on hot paths. Keyed off CLAUDE_CONFIG_DIR so
// tests that change the env var get a fresh value without explicit cache.clear.
export const getClaudeConfigHomeDir = memoize(
  (): string => {
    if (claudeConfigHomeDirOverride) {
      return claudeConfigHomeDirOverride
    }

    const configDirEnv = process.env.CLAUDE_CONFIG_DIR
    const homeDir = homedir()
    const migrationSucceeded = migrateLegacyClaudeConfigHome({
      configDirEnv,
      homeDir,
    })
    const awakenedDir = getAwakenedConfigHomePath(homeDir)

    if (!configDirEnv && !migrationSucceeded && !pathIsDirectory(awakenedDir)) {
      for (const legacyName of LEGACY_CONFIG_DIR_NAMES) {
        const legacyDir = join(homeDir, legacyName)
        if (pathExists(legacyDir)) {
          return legacyDir.normalize('NFC')
        }
      }
    }

    return resolveClaudeConfigHomeDir({
      configDirEnv,
      homeDir,
    })
  },
  () => `${claudeConfigHomeDirOverride ?? ''}\0${process.env.CLAUDE_CONFIG_DIR ?? ''}`,
)

export function getTeamsDir(): string {
  return join(getClaudeConfigHomeDir(), 'teams')
}

export function getProjectsDir(): string {
  return join(getClaudeConfigHomeDir(), 'projects')
}

/**
 * Check if NODE_OPTIONS contains a specific flag.
 * Splits on whitespace and checks for exact match to avoid false positives.
 */
export function hasNodeOption(flag: string): boolean {
  const nodeOptions = process.env.NODE_OPTIONS
  if (!nodeOptions) {
    return false
  }
  return nodeOptions.split(/\s+/).includes(flag)
}

export function isEnvTruthy(envVar: string | boolean | undefined): boolean {
  if (!envVar) return false
  if (typeof envVar === 'boolean') return envVar
  const normalizedValue = envVar.toLowerCase().trim()
  return ['1', 'true', 'yes', 'on'].includes(normalizedValue)
}

export function isEnvDefinedFalsy(
  envVar: string | boolean | undefined,
): boolean {
  if (envVar === undefined) return false
  if (typeof envVar === 'boolean') return !envVar
  if (!envVar) return false
  const normalizedValue = envVar.toLowerCase().trim()
  return ['0', 'false', 'no', 'off'].includes(normalizedValue)
}

/**
 * --bare / CLAUDE_CODE_SIMPLE — skip hooks, LSP, plugin sync, skill dir-walk,
 * attribution, background prefetches, and ALL keychain/credential reads.
 * Auth is strictly ANTHROPIC_API_KEY env or apiKeyHelper from --settings.
 * Explicit CLI flags (--plugin-dir, --add-dir, --mcp-config) still honored.
 * ~30 gates across the codebase.
 *
 * Checks argv directly (in addition to the env var) because several gates
 * run before main.tsx's action handler sets CLAUDE_CODE_SIMPLE=1 from --bare
 * — notably startKeychainPrefetch() at main.tsx top-level.
 */
export function isBareMode(): boolean {
  return (
    isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE) ||
    process.argv.includes('--bare')
  )
}

/**
 * Parses an array of environment variable strings into a key-value object
 * @param envVars Array of strings in KEY=VALUE format
 * @returns Object with key-value pairs
 */
export function parseEnvVars(
  rawEnvArgs: string[] | undefined,
): Record<string, string> {
  const parsedEnv: Record<string, string> = {}

  // Parse individual env vars
  if (rawEnvArgs) {
    for (const envStr of rawEnvArgs) {
      const [key, ...valueParts] = envStr.split('=')
      if (!key || valueParts.length === 0) {
        throw new Error(
          `Invalid environment variable format: ${envStr}, environment variables should be added as: -e KEY1=value1 -e KEY2=value2`,
        )
      }
      parsedEnv[key] = valueParts.join('=')
    }
  }
  return parsedEnv
}

/**
 * Get the AWS region with fallback to default
 * Matches the Anthropic Bedrock SDK's region behavior
 */
export function getAWSRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
}

/**
 * Get the default Vertex AI region
 */
export function getDefaultVertexRegion(): string {
  return process.env.CLOUD_ML_REGION || 'us-east5'
}

/**
 * Check if bash commands should maintain project working directory (reset to original after each command)
 * @returns true if CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR is set to a truthy value
 */
export function shouldMaintainProjectWorkingDir(): boolean {
  return isEnvTruthy(process.env.CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR)
}

/**
 * Check if running on Homespace (ant-internal cloud environment)
 */
export function isRunningOnHomespace(): boolean {
  return (
    process.env.USER_TYPE === 'ant' &&
    isEnvTruthy(process.env.COO_RUNNING_ON_HOMESPACE)
  )
}

/**
 * Conservative check for whether Claude Code is running inside a protected
 * (privileged or ASL3+) COO namespace or cluster.
 *
 * Conservative means: when signals are ambiguous, assume protected. We would
 * rather over-report protected usage than miss it. Unprotected environments
 * are homespace, namespaces on the open allowlist, and no k8s/COO signals
 * at all (laptop/local dev).
 *
 * Used for telemetry to measure auto-mode usage in sensitive environments.
 */
export function isInProtectedNamespace(): boolean {
  // USER_TYPE is build-time --define'd; in external builds this block is
  // DCE'd so the require() and namespace allowlist never appear in the bundle.
  if (process.env.USER_TYPE === 'ant') {
    /* eslint-disable @typescript-eslint/no-require-imports */
    return (
      require('./protectedNamespace.js') as typeof import('./protectedNamespace.js')
    ).checkProtectedNamespace()
    /* eslint-enable @typescript-eslint/no-require-imports */
  }
  return false
}

// @[MODEL LAUNCH]: Add a Vertex region override env var for the new model.
/**
 * Model prefix → env var for Vertex region overrides.
 * Order matters: more specific prefixes must come before less specific ones
 * (e.g., 'claude-opus-4-1' before 'claude-opus-4').
 */
const VERTEX_REGION_OVERRIDES: ReadonlyArray<[string, string]> = [
  ['claude-haiku-4-5', 'VERTEX_REGION_CLAUDE_HAIKU_4_5'],
  ['claude-3-5-haiku', 'VERTEX_REGION_CLAUDE_3_5_HAIKU'],
  ['claude-3-5-sonnet', 'VERTEX_REGION_CLAUDE_3_5_SONNET'],
  ['claude-3-7-sonnet', 'VERTEX_REGION_CLAUDE_3_7_SONNET'],
  ['claude-opus-4-1', 'VERTEX_REGION_CLAUDE_4_1_OPUS'],
  ['claude-opus-4', 'VERTEX_REGION_CLAUDE_4_0_OPUS'],
  ['claude-sonnet-4-6', 'VERTEX_REGION_CLAUDE_4_6_SONNET'],
  ['claude-sonnet-4-5', 'VERTEX_REGION_CLAUDE_4_5_SONNET'],
  ['claude-sonnet-4', 'VERTEX_REGION_CLAUDE_4_0_SONNET'],
]

/**
 * Get the Vertex AI region for a specific model.
 * Different models may be available in different regions.
 */
export function getVertexRegionForModel(
  model: string | undefined,
): string | undefined {
  if (model) {
    const match = VERTEX_REGION_OVERRIDES.find(([prefix]) =>
      model.startsWith(prefix),
    )
    if (match) {
      return process.env[match[1]] || getDefaultVertexRegion()
    }
  }
  return getDefaultVertexRegion()
}
