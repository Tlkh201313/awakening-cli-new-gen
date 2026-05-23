import { afterEach, describe, expect, mock, test } from 'bun:test'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs'
import * as fsPromises from 'fs/promises'
import { homedir, tmpdir } from 'os'
import { join } from 'path'
import { acquireEnvMutex, releaseEnvMutex } from '../entrypoints/sdk/shared.js'

const originalEnv = { ...process.env }
const originalArgv = [...process.argv]

async function importFreshEnvUtils() {
  return import(`./envUtils.ts?ts=${Date.now()}-${Math.random()}`)
}

async function importFreshSettings() {
  return import(`./settings/settings.ts?ts=${Date.now()}-${Math.random()}`)
}

async function importFreshLocalInstaller() {
  return import(`./localInstaller.ts?ts=${Date.now()}-${Math.random()}`)
}

async function importFreshPlans() {
  return import(`./plans.ts?ts=${Date.now()}-${Math.random()}`)
}

afterEach(() => {
  try {
    process.env = { ...originalEnv }
    process.argv = [...originalArgv]
    mock.restore()
  } finally {
    releaseEnvMutex()
  }
})

describe('Awakened paths', () => {
  test('defaults user config home to ~/.awakened', async () => {
    await acquireEnvMutex()
    delete process.env.CLAUDE_CONFIG_DIR
    const { resolveClaudeConfigHomeDir } = await importFreshEnvUtils()

    expect(
      resolveClaudeConfigHomeDir({
        homeDir: homedir(),
      }),
    ).toBe(join(homedir(), '.awakened'))
  })

  test('hard-cuts user config home to ~/.awakened by default', async () => {
    await acquireEnvMutex()
    delete process.env.CLAUDE_CONFIG_DIR
    const { resolveClaudeConfigHomeDir } = await importFreshEnvUtils()

    expect(
      resolveClaudeConfigHomeDir({
        homeDir: homedir(),
      }),
    ).toBe(join(homedir(), '.awakened'))
  })

  test('migrates legacy config home and global config files to .awakened', async () => {
    await acquireEnvMutex()
    const tempHome = mkdtempSync(join(tmpdir(), 'Awakened-paths-test-'))
    try {
      mkdirSync(join(tempHome, '.claude', 'skills', 'legacy-skill'), {
        recursive: true,
      })
      writeFileSync(
        join(tempHome, '.claude', 'skills', 'legacy-skill', 'SKILL.md'),
        'legacy skill',
      )
      writeFileSync(join(tempHome, '.claude', 'settings.json'), '{}')
      writeFileSync(join(tempHome, '.claude.json'), '{"legacy":true}')
      writeFileSync(
        join(tempHome, '.claude-custom-oauth.json'),
        '{"custom":true}',
      )

      const { migrateLegacyClaudeConfigHome } = await importFreshEnvUtils()

      expect(migrateLegacyClaudeConfigHome({ homeDir: tempHome })).toBe(true)
      expect(
        readFileSync(
          join(tempHome, '.awakened', 'skills', 'legacy-skill', 'SKILL.md'),
          'utf8',
        ),
      ).toBe('legacy skill')
      expect(existsSync(join(tempHome, '.awakened', 'settings.json'))).toBe(
        true,
      )
      expect(readFileSync(join(tempHome, '.awakened.json'), 'utf8')).toBe(
        '{"legacy":true}',
      )
      expect(
        readFileSync(join(tempHome, '.awakened-custom-oauth.json'), 'utf8'),
      ).toBe('{"custom":true}')
    } finally {
      rmSync(tempHome, { recursive: true, force: true })
    }
  })

  test('migration preserves existing .awakened data while copying missing legacy data', async () => {
    await acquireEnvMutex()
    const tempHome = mkdtempSync(join(tmpdir(), 'Awakened-paths-test-'))
    try {
      mkdirSync(join(tempHome, '.claude', 'skills', 'legacy-skill'), {
        recursive: true,
      })
      mkdirSync(join(tempHome, '.awakened', 'skills'), { recursive: true })
      writeFileSync(join(tempHome, '.claude', 'settings.json'), 'legacy')
      writeFileSync(join(tempHome, '.awakened', 'settings.json'), 'current')
      writeFileSync(
        join(tempHome, '.claude', 'skills', 'legacy-skill', 'SKILL.md'),
        'legacy skill',
      )

      const { migrateLegacyClaudeConfigHome } = await importFreshEnvUtils()

      expect(migrateLegacyClaudeConfigHome({ homeDir: tempHome })).toBe(true)
      expect(
        readFileSync(join(tempHome, '.awakened', 'settings.json'), 'utf8'),
      ).toBe('current')
      expect(
        readFileSync(
          join(tempHome, '.awakened', 'skills', 'legacy-skill', 'SKILL.md'),
          'utf8',
        ),
      ).toBe('legacy skill')
    } finally {
      rmSync(tempHome, { recursive: true, force: true })
    }
  })

  test('migration skips explicit CLAUDE_CONFIG_DIR overrides', async () => {
    await acquireEnvMutex()
    const tempHome = mkdtempSync(join(tmpdir(), 'Awakened-paths-test-'))
    try {
      mkdirSync(join(tempHome, '.claude'), { recursive: true })
      writeFileSync(join(tempHome, '.claude', 'settings.json'), 'legacy')

      const { migrateLegacyClaudeConfigHome } = await importFreshEnvUtils()

      expect(
        migrateLegacyClaudeConfigHome({
          configDirEnv: join(tempHome, 'custom-config'),
          homeDir: tempHome,
        }),
      ).toBe(true)
      expect(existsSync(join(tempHome, '.awakened'))).toBe(false)
    } finally {
      rmSync(tempHome, { recursive: true, force: true })
    }
  })

  test('migration fails closed when .awakened collides with a non-directory', async () => {
    await acquireEnvMutex()
    const tempHome = mkdtempSync(join(tmpdir(), 'Awakened-paths-test-'))
    try {
      writeFileSync(join(tempHome, '.awakened'), 'not a directory')
      mkdirSync(join(tempHome, '.claude'), { recursive: true })
      writeFileSync(join(tempHome, '.claude', 'settings.json'), 'legacy')

      const { migrateLegacyClaudeConfigHome } = await importFreshEnvUtils()

      expect(migrateLegacyClaudeConfigHome({ homeDir: tempHome })).toBe(false)
    } finally {
      rmSync(tempHome, { recursive: true, force: true })
    }
  })

  test('migration ignores non-directory legacy config homes', async () => {
    await acquireEnvMutex()
    const tempHome = mkdtempSync(join(tmpdir(), 'Awakened-paths-test-'))
    try {
      writeFileSync(join(tempHome, '.claude'), 'not a directory')

      const { migrateLegacyClaudeConfigHome } = await importFreshEnvUtils()

      expect(migrateLegacyClaudeConfigHome({ homeDir: tempHome })).toBe(true)
      expect(existsSync(join(tempHome, '.awakened'))).toBe(false)
    } finally {
      rmSync(tempHome, { recursive: true, force: true })
    }
  })

  test('config home falls back to legacy when migration fails on a non-directory .awakened collision', async () => {
    await acquireEnvMutex()
    const tempHome = mkdtempSync(join(tmpdir(), 'Awakened-paths-test-'))
    try {
      writeFileSync(join(tempHome, '.awakened'), 'not a directory')
      mkdirSync(join(tempHome, '.claude'), { recursive: true })
      mock.module('os', () => ({
        homedir: () => tempHome,
        tmpdir,
      }))
      delete process.env.CLAUDE_CONFIG_DIR

      const { getClaudeConfigHomeDir } = await importFreshEnvUtils()

      expect(getClaudeConfigHomeDir()).toBe(join(tempHome, '.claude'))
    } finally {
      rmSync(tempHome, { recursive: true, force: true })
    }
  })

  test('default plans directory uses ~/.awakened/plans', async () => {
    await acquireEnvMutex()
    delete process.env.CLAUDE_CONFIG_DIR
    const { getDefaultPlansDirectory } = await importFreshPlans()

    expect(getDefaultPlansDirectory({ homeDir: homedir() })).toBe(
      join(homedir(), '.awakened', 'plans'),
    )
  })

  test('default plans directory respects explicit CLAUDE_CONFIG_DIR', async () => {
    await acquireEnvMutex()
    const { getDefaultPlansDirectory } = await importFreshPlans()

    expect(
      getDefaultPlansDirectory({ configDirEnv: '/tmp/custom-Awakened' }),
    ).toBe(join('/tmp/custom-Awakened', 'plans'))
  })

  test('default plans directory normalizes generated path to NFC', async () => {
    await acquireEnvMutex()
    const { getDefaultPlansDirectory } = await importFreshPlans()

    expect(
      getDefaultPlansDirectory({ homeDir: '/tmp/cafe\u0301' }),
    ).toBe(join('/tmp/caf\u00e9', '.awakened', 'plans'))
  })

  test('default plans directory normalizes explicit CLAUDE_CONFIG_DIR to NFC', async () => {
    await acquireEnvMutex()
    const { getDefaultPlansDirectory } = await importFreshPlans()

    expect(
      getDefaultPlansDirectory({ configDirEnv: '/tmp/cafe\u0301-Awakened' }),
    ).toBe(join('/tmp/caf\u00e9-Awakened', 'plans'))
  })

  test('uses CLAUDE_CONFIG_DIR override when provided', async () => {
    await acquireEnvMutex()
    process.env.CLAUDE_CONFIG_DIR = '/tmp/custom-Awakened'
    const { getClaudeConfigHomeDir, resolveClaudeConfigHomeDir } =
      await importFreshEnvUtils()

    expect(getClaudeConfigHomeDir()).toBe('/tmp/custom-Awakened')
    expect(
      resolveClaudeConfigHomeDir({
        configDirEnv: '/tmp/custom-Awakened',
      }),
    ).toBe('/tmp/custom-Awakened')
  })

  test('project and local settings paths use .awakened', async () => {
    await acquireEnvMutex()
    const { getRelativeSettingsFilePathForSource } = await importFreshSettings()

    expect(getRelativeSettingsFilePathForSource('projectSettings')).toBe(
      '.awakened/settings.json',
    )
    expect(getRelativeSettingsFilePathForSource('localSettings')).toBe(
      '.awakened/settings.local.json',
    )
  })

  test('local installer uses Awakened wrapper path', async () => {
    await acquireEnvMutex()
    // Force .awakened config home so the test doesn't fall back to
    // ~/.claude when ~/.awakened doesn't exist on this machine.
    process.env.CLAUDE_CONFIG_DIR = join(homedir(), '.awakened')
    const { getLocalClaudePath } = await importFreshLocalInstaller()

    expect(getLocalClaudePath()).toBe(
      join(homedir(), '.awakened', 'local', 'awakened'),
    )
  })

  test('local installation detection matches .awakened path', async () => {
    await acquireEnvMutex()
    const { isManagedLocalInstallationPath } =
      await importFreshLocalInstaller()

    expect(
      isManagedLocalInstallationPath(
        `${join(homedir(), '.awakened', 'local')}/node_modules/.bin/awakened`,
      ),
    ).toBe(true)
  })

  test('local installation detection still matches legacy .claude path', async () => {
    await acquireEnvMutex()
    const { isManagedLocalInstallationPath } =
      await importFreshLocalInstaller()

    expect(
      isManagedLocalInstallationPath(
        `${join(homedir(), '.claude', 'local')}/node_modules/.bin/claude`,
      ),
    ).toBe(true)
  })

  test('candidate local install dirs include both Awakened and legacy claude paths', async () => {
    await acquireEnvMutex()
    const { getCandidateLocalInstallDirs } = await importFreshLocalInstaller()

    expect(
      getCandidateLocalInstallDirs({
        configHomeDir: join(homedir(), '.awakened'),
        homeDir: homedir(),
      }),
    ).toEqual([
      join(homedir(), '.awakened', 'local'),
      join(homedir(), '.claude', 'local'),
    ])
  })

  test('legacy local installs are detected when they still expose the claude binary', async () => {
    await acquireEnvMutex()
    mock.module('fs/promises', () => ({
      ...fsPromises,
      access: async (path: string) => {
        if (
          path === join(homedir(), '.claude', 'local', 'node_modules', '.bin', 'claude')
        ) {
          return
        }
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      },
    }))

    const { getDetectedLocalInstallDir, localInstallationExists } =
      await importFreshLocalInstaller()

    expect(await localInstallationExists()).toBe(true)
    expect(await getDetectedLocalInstallDir()).toBe(
      join(homedir(), '.claude', 'local'),
    )
  })
})
