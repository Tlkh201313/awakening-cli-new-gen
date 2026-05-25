import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const SCRAPER_RE =
  /\b(scrape|scraping|web\s*crawl|deep\s*crawl|extract.*(?:from|page|website|url)|crawl\s*(?:site|page|url|website|docs)|fetch\s*(?:page|site|content|docs)|read.*(?:website|webpage|page)|markdown.*(?:from|page|url)|structured.*(?:extract|data)|css\s*selector.*extract)\b/i

export const awakenedScraperCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.scraper,
  displayName: "Awakened Scraper",
  description: "Web scraper & deep crawler — clean Markdown, CSS selectors, structured extraction",
  priority: 60,
  shouldActivate(ctx) {
    if (SCRAPER_RE.test(ctx.userText)) return true
    return primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Scraper

Use the \`scraper\` tool for web scraping and content extraction.

## When to use

| Task | Tool |
|------|------|
| Single page, simple fetch | \`webfetch\` |
| Clean Markdown from page | \`scraper\` (extract: "markdown") |
| Deep crawl a site/docs | \`scraper\` (deep: true, max_pages: 10) |
| Extract specific content | \`scraper\` (selector: "article", "#readme") |
| Get all links from page | \`scraper\` (extract: "links") |
| Structured data (headings, links as JSON) | \`scraper\` (extract: "structured") |

## Examples

\`\`\`json
// Single page → clean Markdown
{ "url": "https://docs.example.com/api", "extract": "markdown" }

// Deep crawl docs (up to 10 pages, depth 2)
{ "url": "https://docs.example.com", "deep": true, "max_depth": 2, "max_pages": 10 }

// Extract specific section
{ "url": "https://github.com/user/repo", "selector": "#readme" }
\`\`\`

## Distinction

| Pack | Focus |
|------|-------|
| **Awakened Scraper** | Deep crawling, CSS selectors, structured extraction |
| **WebFetch** | Simple single-page fetch, raw HTML |
| **Awakened Browser** | Interactive browser automation, screenshots |
| **Awakened Graphify** | Codebase knowledge graphs, not web content |
`
  },
}
