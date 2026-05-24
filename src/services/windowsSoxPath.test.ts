import { describe, expect, test, afterEach } from 'bun:test'
import { resetWindowsSoxPathCacheForTesting } from './windowsSoxPath.js'

describe('resolveWindowsSoxExecutable', () => {
  afterEach(() => {
    resetWindowsSoxPathCacheForTesting()
    delete process.env.AWAKENED_SOX_PATH
    delete process.env.SOX_PATH
  })

  test('uses AWAKENED_SOX_PATH when file exists', async () => {
    if (process.platform !== 'win32') return
    const { writeFileSync, unlinkSync } = await import('fs')
    const { join } = await import('path')
    const { tmpdir } = await import('os')
    const fake = join(tmpdir(), `sox-test-${Date.now()}.exe`)
    writeFileSync(fake, '')
    process.env.AWAKENED_SOX_PATH = fake
    const { resolveWindowsSoxExecutable } = await import('./windowsSoxPath.js')
    expect(resolveWindowsSoxExecutable()).toBe(fake)
    unlinkSync(fake)
  })
})
