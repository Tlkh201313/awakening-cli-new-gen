import { MINI_BROWSER_TOOL_NAME } from '../../tools/MiniBrowserTool/constants.js'
import { AWAKENED_CAPABILITY_IDS } from '../ids.js'
import type { AutoCapabilityDefinition } from '../types.js'

const URL_RE = /https?:\/\/\S+/i
const BROWSER_RE =
  /\b(browser|screenshot|webpage|website|click\b|login page|sign[- ]?in|form fill|cookie banner|devtools|playwright|puppeteer|selenium|scrape.{0,12}page|visual check|headless chrome|remote debugging)\b/i

export const awakenedBrowserCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.browser,
  displayName: 'Awakened Browser',
  description:
    'Chrome CDP automation (mini-browser / MiniBrowser tool)',
  priority: 90,
  shouldActivate({ userText, tools }) {
    if (!tools.some(t => t.name === MINI_BROWSER_TOOL_NAME)) return false
    return URL_RE.test(userText) || BROWSER_RE.test(userText)
  },
  getContent() {
    return `# Awakened Browser

Upstream: https://github.com/runablehq/mini-browser (\`mb\` CLI, Chrome DevTools port 9222).

## When to use

Real browser work (SPAs, clicks, forms, screenshots) — not static fetches. Prefer **${MINI_BROWSER_TOOL_NAME}** over Bash \`mb\`.

## Setup

1. \`MiniBrowser\` → \`start_chrome\` (or \`mb-start-chrome\`) once per session.
2. \`go\` + \`url\`, then \`snap\` / \`shot\` / \`click\` / \`type\` / \`fill\`.

Dismiss cookie overlays before clicking. Use \`wait\` after \`go\` on heavy SPAs.
`
  },
}
