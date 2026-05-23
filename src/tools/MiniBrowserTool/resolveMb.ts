import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { execFileNoThrow } from '../../utils/execFileNoThrow.js'

const require = createRequire(import.meta.url)

export type MbRunner =
  | { kind: 'node-script'; scriptPath: string }
  | { kind: 'mb-bin' }
  | { kind: 'npx' }

let cachedRunner: MbRunner | null | undefined

export function getMbRunner(): MbRunner {
  if (cachedRunner !== undefined) return cachedRunner ?? { kind: 'npx' }
  try {
    const pkgPath = require.resolve('@runablehq/mini-browser/package.json')
    const root = dirname(pkgPath)
    const mbJs = join(root, 'dist', 'mb.js')
    if (existsSync(mbJs)) {
      cachedRunner = { kind: 'node-script', scriptPath: mbJs }
      return cachedRunner
    }
  } catch {
    // package not installed — fall through
  }
  cachedRunner = { kind: 'mb-bin' }
  return cachedRunner
}

/** Reset runner cache (tests). */
export function resetMbRunnerCache(): void {
  cachedRunner = undefined
}

export function buildMbArgv(subcommandArgs: string[]): {
  file: string
  args: string[]
} {
  const runner = getMbRunner()
  switch (runner.kind) {
    case 'node-script':
      return { file: process.execPath, args: [runner.scriptPath, ...subcommandArgs] }
    case 'npx':
      return {
        file: 'npx',
        args: ['-y', '@runablehq/mini-browser', ...subcommandArgs],
      }
    case 'mb-bin':
      return { file: 'mb', args: subcommandArgs }
  }
}

export async function runMbCommand(
  subcommandArgs: string[],
  options: { signal?: AbortSignal; timeout?: number },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { file, args } = buildMbArgv(subcommandArgs)
  const result = await execFileNoThrow(file, args, {
    abortSignal: options.signal,
    timeout: options.timeout ?? 120_000,
    preserveOutputOnError: true,
  })
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  }
}

function resolveMbStartChromeBin(): string | null {
  try {
    const pkgPath = require.resolve('@runablehq/mini-browser/package.json')
    const pkgRoot = dirname(pkgPath)
    const candidates = [
      join(pkgRoot, '..', '..', '.bin', 'mb-start-chrome'),
      join(pkgRoot, '..', '..', '.bin', 'mb-start-chrome.cmd'),
    ]
    for (const c of candidates) {
      if (existsSync(c)) return c
    }
  } catch {
    /* not installed */
  }
  return null
}

export async function runMbStartChrome(options: {
  signal?: AbortSignal
}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const startBin = resolveMbStartChromeBin()
  if (startBin) {
    return execFileNoThrow(startBin, [], {
      abortSignal: options.signal,
      timeout: 60_000,
      preserveOutputOnError: true,
    })
  }
  return execFileNoThrow('mb-start-chrome', [], {
    abortSignal: options.signal,
    timeout: 60_000,
    preserveOutputOnError: true,
  })
}
