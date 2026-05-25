import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const URL_RE = /https?:\/\/\S+/i
const BROWSER_RE =
  /\b(browser|screenshot|webpage|website|click\b|login page|sign[- ]?in|form fill|cookie banner|devtools|playwright|puppeteer|selenium|scrape.{0,12}page|visual check|headless chrome|remote debugging)\b/i

export const awakenedBrowserCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.browser,
  displayName: "Awakened Browser",
  description: "WebFetch and bash for browser-oriented tasks",
  priority: 90,
  shouldActivate(ctx) {
    return URL_RE.test(ctx.userText) || BROWSER_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Browser

## When to use

Browser-oriented work (pages, URLs, scraping, visual checks) in awakened.

## Tools

- **WebFetch** — fetch and read static pages or API responses.
- **bash** — run CLI browser tools (curl, playwright CLI, etc.) when WebFetch is not enough.

Prefer WebFetch for simple page content; use bash for scripted browser automation or local CLI tools.
`
  },
}
