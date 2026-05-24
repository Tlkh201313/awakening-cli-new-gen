import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  addProviderProfile,
  getProviderProfiles,
  updateProviderProfile,
} from './providerProfiles.js'

const originalConfigDir = process.env.CLAUDE_CONFIG_DIR

afterEach(() => {
  if (originalConfigDir === undefined) {
    delete process.env.CLAUDE_CONFIG_DIR
  } else {
    process.env.CLAUDE_CONFIG_DIR = originalConfigDir
  }
})

describe('provider API key persistence', () => {
  test('updateProviderProfile keeps existing key when edit leaves apiKey empty', () => {
    const dir = mkdtempSync(join(tmpdir(), 'awakened-provider-key-'))
    process.env.CLAUDE_CONFIG_DIR = dir
    try {
      const created = addProviderProfile(
        {
          provider: 'openai',
          name: 'Test',
          baseUrl: 'https://opengateway.gitlawb.com/v1',
          model: 'mimo-v2.5-pro',
          apiKey: 'ogw_live_test_key_12345',
        },
        { makeActive: true },
      )
      expect(created?.apiKey).toBe('ogw_live_test_key_12345')

      const updated = updateProviderProfile(created!.id, {
        provider: 'openai',
        name: 'Test renamed',
        baseUrl: 'https://opengateway.gitlawb.com/v1',
        model: 'mimo-v2.5-pro',
        apiKey: '',
      })
      expect(updated?.apiKey).toBe('ogw_live_test_key_12345')
      expect(getProviderProfiles().find(p => p.id === created!.id)?.apiKey).toBe(
        'ogw_live_test_key_12345',
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
