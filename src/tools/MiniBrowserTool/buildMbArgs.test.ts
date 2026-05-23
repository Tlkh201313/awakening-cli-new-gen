import { describe, expect, test } from 'bun:test'
import { buildMbSubcommandArgs } from './buildMbArgs.js'

describe('buildMbSubcommandArgs', () => {
  test('go with url and flags', () => {
    expect(
      buildMbSubcommandArgs({
        action: 'go',
        url: 'https://example.com',
        timeout_ms: 5000,
        json_output: true,
      }),
    ).toEqual([
      'go',
      'https://example.com',
      '--timeout',
      '5000',
      '--json',
    ])
  })

  test('snap', () => {
    expect(buildMbSubcommandArgs({ action: 'snap' })).toEqual(['snap'])
  })

  test('tab_new with url', () => {
    expect(
      buildMbSubcommandArgs({
        action: 'tab_new',
        url: 'https://a.test',
      }),
    ).toEqual(['tab', 'new', 'https://a.test'])
  })
})
