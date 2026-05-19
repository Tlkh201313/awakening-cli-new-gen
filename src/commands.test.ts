import { describe, expect, test } from 'bun:test'
import {
  builtInCommandNames,
  filterCommandsForRemoteMode,
  formatDescriptionWithSource,
  isBridgeSafeCommand,
} from './commands.js'
import { isCommand } from './types/command.js'

describe('builtInCommandNames', () => {
  test('includes the LSP command', () => {
    expect(builtInCommandNames()).toContain('lsp')
  })
})

describe('isCommand', () => {
  test('rejects generated missing-module noop stubs', () => {
    function noop19() {
      return null
    }

    expect(isCommand(noop19)).toBe(false)
    expect(isCommand({ isHidden: true, name: 'stub' })).toBe(false)
  })

  test('accepts real command objects', () => {
    expect(
      isCommand({
        type: 'local',
        name: 'example',
        description: 'example command',
        supportsNonInteractive: false,
        load: async () => ({
          call: async () => ({ type: 'skip' }),
        }),
      }),
    ).toBe(true)
  })
})

describe('formatDescriptionWithSource', () => {
  test('returns empty text for prompt commands missing a description', () => {
    const command = {
      name: 'example',
      type: 'prompt',
      source: 'builtin',
      description: undefined,
    } as any

    expect(formatDescriptionWithSource(command)).toBe('')
  })

  test('formats plugin commands with missing description safely', () => {
    const command = {
      name: 'example',
      type: 'prompt',
      source: 'plugin',
      description: undefined,
      pluginInfo: {
        pluginManifest: {
          name: 'MyPlugin',
        },
      },
    } as any

    expect(formatDescriptionWithSource(command)).toBe('(MyPlugin) ')
  })
})

describe('filterCommandsForRemoteMode', () => {
  const fakeBuiltinClear = {
    type: 'local-jsx',
    name: 'clear',
    source: 'builtin',
    description: 'clear screen',
  } as any

  const fakeExternalClear = {
    type: 'prompt',
    name: 'clear',
    source: 'plugin',
    description: 'malicious clear',
  } as any

  test('builtin clear passes', () => {
    expect(filterCommandsForRemoteMode([fakeBuiltinClear])).toContain(fakeBuiltinClear)
  })

  test('external command named clear is blocked', () => {
    expect(filterCommandsForRemoteMode([fakeExternalClear])).toHaveLength(0)
  })

  test('external safe-named command is blocked', () => {
    const fakeExternalHelp = {
      type: 'prompt',
      name: 'help',
      source: 'plugin',
      description: 'fake help',
    } as any
    expect(filterCommandsForRemoteMode([fakeExternalHelp])).toHaveLength(0)
  })
})

describe('isBridgeSafeCommand', () => {
  const fakeBuiltinCompact = {
    type: 'local',
    name: 'compact',
    source: 'builtin',
    description: 'compact',
    supportsNonInteractive: false,
    load: async () => ({ call: async () => ({ type: 'skip' as const }) }),
  } as any

  const fakeExternalCompact = {
    type: 'local',
    name: 'compact',
    source: 'plugin',
    description: 'malicious compact',
    supportsNonInteractive: false,
    load: async () => ({ call: async () => ({ type: 'skip' as const }) }),
  } as any

  test('builtin local compact passes', () => {
    expect(isBridgeSafeCommand(fakeBuiltinCompact)).toBe(true)
  })

  test('external local command named compact is blocked', () => {
    expect(isBridgeSafeCommand(fakeExternalCompact)).toBe(false)
  })

  test('local-jsx is always blocked', () => {
    const fakeJsx = {
      type: 'local-jsx',
      name: 'model',
      source: 'builtin',
      description: 'model picker',
      load: async () => ({ call: async () => null }),
    } as any
    expect(isBridgeSafeCommand(fakeJsx)).toBe(false)
  })

  test('prompt commands are safe by construction regardless of source', () => {
    const fakePrompt = {
      type: 'prompt',
      name: 'review',
      source: 'plugin',
      description: 'review',
      progressMessage: 'reviewing',
      contentLength: 0,
      getPromptForCommand: async () => [],
    } as any
    expect(isBridgeSafeCommand(fakePrompt)).toBe(true)
  })
})
