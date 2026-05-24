/**
 * Locate SoX on Windows — winget installs often omit PATH until a new login.
 */
import { existsSync } from 'fs'
import { readdirSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'
import { awakenedEnv } from '../constants/brand.js'
import { logForDebugging } from '../utils/debug.js'

let cachedSoxPath: string | null | undefined
let cachedWingetPath: string | null | undefined

function pathExists(filePath: string): boolean {
  try {
    return existsSync(filePath)
  } catch {
    return false
  }
}

function tryWhere(command: string): string | null {
  const result = spawnSync('cmd.exe', ['/d', '/s', '/c', `where ${command}`], {
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
  })
  if (result.status !== 0 || !result.stdout?.trim()) return null
  const line = result.stdout.trim().split(/\r?\n/)[0]?.trim()
  return line && pathExists(line) ? line : null
}

function scanShallowForSox(dir: string, depth = 0): string | null {
  if (depth > 4 || !pathExists(dir)) return null
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isFile() && /^sox\.exe$/i.test(entry.name)) return full
      if (entry.isDirectory()) {
        const found = scanShallowForSox(full, depth + 1)
        if (found) return found
      }
    }
  } catch {
    return null
  }
  return null
}

const WINDOWS_SOX_CANDIDATES = [
  'C:\\Program Files\\SoX\\sox.exe',
  'C:\\Program Files (x86)\\SoX\\sox.exe',
  'C:\\Program Files\\sox\\sox.exe',
  'C:\\Program Files (x86)\\sox-14-4-2\\sox.exe',
  'C:\\Program Files (x86)\\sox\\sox.exe',
]

export function resolveWindowsSoxExecutable(): string | null {
  if (process.platform !== 'win32') return null
  if (cachedSoxPath !== undefined) return cachedSoxPath

  const fromEnv =
    awakenedEnv('SOX_PATH') ??
    process.env.SOX_PATH ??
    process.env.SOX_BINARY
  if (fromEnv && pathExists(fromEnv)) {
    cachedSoxPath = fromEnv
    logForDebugging(`[voice] SoX from env: ${fromEnv}`)
    return cachedSoxPath
  }

  for (const candidate of WINDOWS_SOX_CANDIDATES) {
    if (pathExists(candidate)) {
      cachedSoxPath = candidate
      logForDebugging(`[voice] SoX found: ${candidate}`)
      return cachedSoxPath
    }
  }

  const wingetRoot = join(
    process.env.LOCALAPPDATA ?? '',
    'Microsoft',
    'WinGet',
    'Packages',
  )
  const fromWinget = scanShallowForSox(wingetRoot)
  if (fromWinget) {
    cachedSoxPath = fromWinget
    logForDebugging(`[voice] SoX found under WinGet: ${fromWinget}`)
    return cachedSoxPath
  }

  const fromWhere = tryWhere('sox') ?? tryWhere('rec')
  if (fromWhere) {
    cachedSoxPath = fromWhere
    logForDebugging(`[voice] SoX from where: ${fromWhere}`)
    return cachedSoxPath
  }

  cachedSoxPath = null
  return null
}

export function resetWindowsSoxPathCacheForTesting(): void {
  cachedSoxPath = undefined
  cachedWingetPath = undefined
}

function hasWinget(): boolean {
  if (cachedWingetPath !== undefined) return cachedWingetPath !== null
  const found = tryWhere('winget')
  cachedWingetPath = found ?? null
  return found !== null
}

export function windowsSoxInstallHint(): string {
  if (hasWinget()) {
    return [
      'Install SoX: winget install ChrisBagwell.SoX',
      'Then restart the terminal, or set AWAKENED_SOX_PATH to sox.exe',
      '(e.g. C:\\Program Files (x86)\\sox-14-4-2\\sox.exe)',
    ].join('\n')
  }
  return 'Install SoX for Windows (https://sourceforge.net/projects/sox/files/sox/)'
}
