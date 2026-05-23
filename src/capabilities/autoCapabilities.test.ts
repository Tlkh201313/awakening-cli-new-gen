import { describe, expect, test } from 'bun:test'
import { AWAKENED_CAPABILITY_IDS } from './ids.js'
import {
  getAutoCapabilityAttachments,
  getSentAutoCapabilities,
  resetSentAutoCapabilities,
} from './autoCapabilities.js'
import { setTestDisabledAwakenedCapabilities } from './settings.js'

describe('getAutoCapabilityAttachments', () => {
  test('surfaces Awakened Browser for URL in user text', () => {
    resetSentAutoCapabilities()
    setTestDisabledAwakenedCapabilities([])
    const attachments = getAutoCapabilityAttachments({
      userText: 'open https://example.com and click login',
      tools: [{ name: 'MiniBrowser' } as never],
    })
    expect(
      attachments.some(
        a =>
          a.type === 'reading_skill' &&
          a.skillName === 'Awakened Browser',
      ),
    ).toBe(true)
  })

  test('surfaces Awakened Research for training keywords', () => {
    resetSentAutoCapabilities()
    setTestDisabledAwakenedCapabilities([])
    const attachments = getAutoCapabilityAttachments({
      userText: 'help me fine-tune with LoRA and evaluate on a benchmark',
      tools: [],
    })
    expect(
      attachments.some(
        a =>
          a.type === 'reading_skill' &&
          a.skillName === 'Awakened Research',
      ),
    ).toBe(true)
  })

  test('surfaces Awakened Marketing for GTM keywords', () => {
    resetSentAutoCapabilities()
    setTestDisabledAwakenedCapabilities([])
    const attachments = getAutoCapabilityAttachments({
      userText: 'run a cold email outbound experiment for our ICP',
      tools: [],
    })
    expect(
      attachments.some(
        a =>
          a.type === 'reading_skill' &&
          a.skillName === 'Awakened Marketing',
      ),
    ).toBe(true)
  })

  test('surfaces Awakened Skills Vault for antigravity mention', () => {
    resetSentAutoCapabilities()
    setTestDisabledAwakenedCapabilities([])
    const attachments = getAutoCapabilityAttachments({
      userText: 'install npx antigravity-awesome-skills and use @brainstorming',
      tools: [],
    })
    expect(
      attachments.some(
        a =>
          a.type === 'reading_skill' &&
          a.skillName === 'Awakened Skills Vault',
      ),
    ).toBe(true)
  })

  test('surfaces Awakened Graphify for graphify keywords', () => {
    resetSentAutoCapabilities()
    setTestDisabledAwakenedCapabilities([])
    const attachments = getAutoCapabilityAttachments({
      userText: 'run /graphify on this massive codebase to reduce tokens',
      tools: [],
    })
    expect(
      attachments.some(
        a =>
          a.type === 'reading_skill' &&
          a.skillName === 'Awakened Graphify',
      ),
    ).toBe(true)
  })

  test('surfaces Awakened Productivity for voltagent keywords', () => {
    resetSentAutoCapabilities()
    setTestDisabledAwakenedCapabilities([])
    const attachments = getAutoCapabilityAttachments({
      userText: 'browse awesome-agent-skills on officialskills.sh for stripe skill',
      tools: [],
    })
    expect(
      attachments.some(
        a =>
          a.type === 'reading_skill' &&
          a.skillName === 'Awakened Productivity',
      ),
    ).toBe(true)
  })

  test('respects disabled setting', () => {
    resetSentAutoCapabilities()
    setTestDisabledAwakenedCapabilities([AWAKENED_CAPABILITY_IDS.marketing])
    const attachments = getAutoCapabilityAttachments({
      userText: 'SEO landing page CRO audit',
      tools: [],
    })
    expect(attachments).toHaveLength(0)
  })

  test('does not resurface same capability in one session', () => {
    resetSentAutoCapabilities()
    setTestDisabledAwakenedCapabilities([])
    getAutoCapabilityAttachments({
      userText: 'SEO landing page CRO audit',
      tools: [],
    })
    const second = getAutoCapabilityAttachments({
      userText: 'another marketing funnel question',
      tools: [],
    })
    expect(second).toHaveLength(0)
    expect(getSentAutoCapabilities().has(AWAKENED_CAPABILITY_IDS.marketing)).toBe(
      true,
    )
  })
})
