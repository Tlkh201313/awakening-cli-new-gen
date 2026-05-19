import { describe, expect, test } from 'bun:test'
import {
  CHARS_PER_TOKEN,
  DEFAULT_CHAR_BUDGET,
  getCharBudget,
  formatCommandsWithinBudget,
  MAX_LISTING_DESC_CHARS,
  SKILL_BUDGET_CONTEXT_PERCENT,
} from './prompt.js'

describe('getCharBudget', () => {
  test('returns env override when set', () => {
    const prev = process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET
    process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = '1234'
    expect(getCharBudget(32_000)).toBe(1234)
    if (prev === undefined) {
      delete process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET
    } else {
      process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = prev
    }
  })

  test('defaults to DEFAULT_CHAR_BUDGET without tokens', () => {
    expect(getCharBudget()).toBe(DEFAULT_CHAR_BUDGET)
  })

  test('32k context uses higher percent tier', () => {
    const tokens = 32_000
    const expected = Math.floor(tokens * CHARS_PER_TOKEN * 0.008)
    expect(getCharBudget(tokens)).toBe(expected)
  })

  test('50k context uses default percent tier', () => {
    const tokens = 50_000
    const expected = Math.floor(
      tokens * CHARS_PER_TOKEN * SKILL_BUDGET_CONTEXT_PERCENT,
    )
    expect(getCharBudget(tokens)).toBe(expected)
  })

  test('200k context uses lower percent tier', () => {
    const tokens = 200_000
    const expected = Math.floor(tokens * CHARS_PER_TOKEN * 0.005)
    expect(getCharBudget(tokens)).toBe(expected)
  })
})

describe('formatCommandsWithinBudget', () => {
  const makeCommand = (
    name: string,
    description: string,
    whenToUse?: string,
    source: 'builtin' | 'bundled' | 'plugin' = 'plugin',
  ) =>
    ({
      type: 'prompt',
      name,
      description,
      whenToUse,
      source,
      progressMessage: 'working',
      contentLength: 0,
      getPromptForCommand: async () => [],
    }) as any

  test('returns empty string for empty commands', () => {
    expect(formatCommandsWithinBudget([])).toBe('')
  })

  test('fits all full descriptions within budget', () => {
    const cmds = [
      makeCommand('a', 'short one'),
      makeCommand('b', 'short two'),
    ]
    expect(formatCommandsWithinBudget(cmds, 50_000)).toBe(
      '- a: short one\n- b: short two',
    )
  })

  test('long bundled descriptions are not truncated', () => {
    const longDesc = 'a'.repeat(MAX_LISTING_DESC_CHARS + 100)
    const bundled = makeCommand('bundled-skill', longDesc, undefined, 'bundled')
    const result = formatCommandsWithinBudget([bundled], 32_000)
    expect(result).toContain(longDesc)
    expect(result).not.toContain('\u2026')
  })

  test('non-bundled descriptions are truncated when over budget', () => {
    const longDesc = 'b'.repeat(500)
    const cmds = [
      makeCommand('regular', longDesc),
      makeCommand('regular2', longDesc),
    ]
    const result = formatCommandsWithinBudget(cmds, 32_000)
    // Non-bundled should be truncated to fit budget
    expect(result).not.toContain(longDesc)
  })

  test('bundled keeps full descriptions while non-bundled is trimmed', () => {
    const bundledLong = 'x'.repeat(400)
    const regularLong = 'y'.repeat(400)
    const bundled = makeCommand('bundled-skill', bundledLong, undefined, 'bundled')
    const regular = makeCommand('regular-skill', regularLong)
    const result = formatCommandsWithinBudget([bundled, regular], 32_000)
    // Bundled should preserve its long description
    expect(result).toContain(bundledLong)
    // Regular should be truncated
    expect(result).not.toContain(regularLong)
  })

  test('extreme budget falls back to names-only for non-bundled', () => {
    const bundledLong = 'z'.repeat(500)
    const bundled = makeCommand('bundled-skill', bundledLong, undefined, 'bundled')
    // Create many regular commands so fullTotal exceeds budget and maxDescLen < MIN_DESC_LENGTH
    const regulars = Array.from({ length: 200 }, (_, i) =>
      makeCommand(`r${i}`, `desc ${i}`),
    )
    // 32k tokens gives ~1024 char budget; 200 commands with 500-char bundled description exceeds it
    const result = formatCommandsWithinBudget(
      [bundled, ...regulars],
      32_000,
    )
    // Bundled still appears with full description
    expect(result).toContain(bundledLong)
    // Non-bundled should be names-only in extreme case
    expect(result).toContain('- r0')
    expect(result).toContain('- r199')
    // No regular command descriptions should appear
    expect(result).not.toContain('desc 0')
    expect(result).not.toContain('desc 199')
  })
})
