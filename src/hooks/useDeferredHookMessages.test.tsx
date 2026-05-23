import { PassThrough } from 'node:stream'
import { afterEach, describe, expect, test } from 'bun:test'
import React from 'react'
import { createRoot, Text } from '../ink.js'
import { useDeferredHookMessages } from './useDeferredHookMessages.js'

afterEach(() => {
  delete process.env.CLAUDE_CODE_DEFERRED_HOOK_WAIT_MS
})

describe('useDeferredHookMessages', () => {
  test('proceeds without waiting when SessionStart hooks exceed cap', async () => {
    process.env.CLAUDE_CODE_DEFERRED_HOOK_WAIT_MS = '50'

    let awaitPendingHooks: (() => Promise<void>) | undefined
    const pending = new Promise<never>(() => {})

    function Harness(): React.ReactNode {
      awaitPendingHooks = useDeferredHookMessages(pending, () => {})
      return <Text>ok</Text>
    }

    const { stdout, stdin } = createTestStreams()
    const root = await createRoot({
      stdout: stdout as unknown as NodeJS.WriteStream,
      stdin: stdin as unknown as NodeJS.ReadStream,
      patchConsole: false,
    })
    root.render(<Harness />)
    await Bun.sleep(0)

    const started = Date.now()
    await awaitPendingHooks!()
    const elapsed = Date.now() - started

    expect(elapsed).toBeLessThan(200)

    root.unmount()
    stdin.end()
    stdout.end()
  })
})

function createTestStreams(): {
  stdout: PassThrough
  stdin: PassThrough & {
    isTTY: boolean
    setRawMode: (mode: boolean) => void
    ref: () => void
    unref: () => void
  }
} {
  const stdout = new PassThrough()
  const stdin = new PassThrough() as PassThrough & {
    isTTY: boolean
    setRawMode: (mode: boolean) => void
    ref: () => void
    unref: () => void
  }
  stdin.isTTY = true
  stdin.setRawMode = () => {}
  stdin.ref = () => {}
  stdin.unref = () => {}
  ;(stdout as unknown as { columns: number }).columns = 120
  return { stdout, stdin }
}
