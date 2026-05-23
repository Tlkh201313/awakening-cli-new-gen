/**
 * Lightweight Awakened CLI benchmarks for README numbers.
 * Run: bun run scripts/benchmark-awakened.ts
 */

import { performance } from 'node:perf_hooks'
import { Writable } from 'node:stream'

;(globalThis as { MACRO?: { VERSION: string; DISPLAY_VERSION: string } }).MACRO =
  {
    VERSION: 'bench',
    DISPLAY_VERSION: 'bench',
  }

function ms(start: number): number {
  return Math.round(performance.now() - start)
}

async function benchStartupLogo(): Promise<{
  animatedMs: number
  fastMs: number
}> {
  const { printStartupScreen } = await import('../src/components/StartupScreen.js')
  const { saveGlobalConfig, getGlobalConfig } = await import('../src/utils/config.js')
  const { enableConfigs } = await import('../src/utils/config.js')
  enableConfigs()

  const origIsTTY = process.stdout.isTTY
  const origWrite = process.stdout.write.bind(process.stdout)
  const sink = new Writable({ write(_chunk, _enc, cb) { cb() } })
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true })
  process.stdout.write = sink.write.bind(sink) as typeof process.stdout.write

  const saved = getGlobalConfig()
  saveGlobalConfig(c => ({ ...c, numStartups: 0 }))
  const t0 = performance.now()
  printStartupScreen()
  const animatedMs = ms(t0)

  saveGlobalConfig(c => ({ ...c, numStartups: 5 }))
  const t1 = performance.now()
  printStartupScreen()
  const fastMs = ms(t1)

  saveGlobalConfig(() => saved)
  process.stdout.write = origWrite
  Object.defineProperty(process.stdout, 'isTTY', {
    value: origIsTTY,
    configurable: true,
  })

  return { animatedMs, fastMs }
}

function benchStreamThrottle(): Promise<{ coalescedRuns: number }> {
  return import('../src/utils/streamUiThrottle.js').then(async mod => {
    mod.resetStreamUiThrottleState()
    let runs = 0
    for (let i = 0; i < 50; i++) {
      mod.scheduleStreamingTextUiUpdate(() => {
        runs++
      })
    }
    await new Promise(r => setTimeout(r, 80))
    mod.flushStreamUiThrottleState()
    return { coalescedRuns: runs }
  })
}

const logo = await benchStartupLogo()
const throttle = await benchStreamThrottle()

console.log(JSON.stringify({ logo, throttle, platform: process.platform }, null, 2))
