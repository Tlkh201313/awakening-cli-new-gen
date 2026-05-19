import { describe, expect, it } from 'bun:test'
import {
  formatCoAuthorTrailer,
  parseCoAuthor,
  stripMatchingQuotes,
  USAGE,
} from './commit-message.js'

describe('commit-message command helpers', () => {
  it('parses quoted co-author names with a plain email', () => {
    expect(parseCoAuthor('"GPT 5.5" noreply@Awakened.dev')).toEqual({
      name: 'GPT 5.5',
      email: 'noreply@Awakened.dev',
    })
  })

  it('parses co-author trailers with angle-bracket emails', () => {
    expect(parseCoAuthor('Awakened (gpt-5.5) <noreply@Awakened.dev>')).toEqual(
      {
        name: 'Awakened (gpt-5.5)',
        email: 'noreply@Awakened.dev',
      },
    )
  })

  it('rejects co-author trailers with empty sanitized names', () => {
    expect(parseCoAuthor('"  " noreply@Awakened.dev')).toBeNull()
    expect(parseCoAuthor('"  " <noreply@Awakened.dev>')).toBeNull()
  })

  it('strips one pair of matching quotes from custom attribution text', () => {
    expect(stripMatchingQuotes('"Generated with Awakened"')).toBe(
      'Generated with Awakened',
    )
    expect(stripMatchingQuotes("'Generated with Awakened'")).toBe(
      'Generated with Awakened',
    )
    expect(stripMatchingQuotes('"Generated with Awakened')).toBe(
      '"Generated with Awakened',
    )
  })

  it('formats a sanitized co-author trailer', () => {
    expect(
      formatCoAuthorTrailer('Awakened <gpt>\n', '<noreply@Awakened.dev>'),
    ).toBe('Co-Authored-By: Awakened gpt <noreply@Awakened.dev>')
  })

  it('makes set scope explicit with example text', () => {
    expect(USAGE).toContain(
      'Controls only the attribution text appended after /commit messages.',
    )
    expect(USAGE).toContain(
      '/commit-message set "Generated with Awakened using GPT-5.5"',
    )
    expect(USAGE).not.toContain('/commit-message set-attribution')
  })
})
