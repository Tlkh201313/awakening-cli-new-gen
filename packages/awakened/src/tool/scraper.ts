import { Effect, Schema } from "effect"
import { Parser } from "htmlparser2"
import TurndownService from "turndown"
import * as Tool from "./tool"
import DESCRIPTION from "./scraper.txt"

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024
const DEFAULT_TIMEOUT = 30_000
const MAX_TIMEOUT = 120_000
const MAX_PAGES = 20
const MAX_DEPTH = 3

const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
})
turndownService.remove(["script", "style", "meta", "link", "nav", "footer", "header"])

type CrawlResult = {
  url: string
  title: string
  markdown: string
  links: string[]
  status: number
}

export const Parameters = Schema.Struct({
  url: Schema.String.annotate({ description: "The URL to scrape" }),
  extract: Schema.Literals(["markdown", "text", "links", "structured"])
    .annotate({
      description: "Extraction mode: markdown (clean MD), text (plain text), links (all URLs), structured (JSON with title/headings/links). Defaults to markdown.",
      default: "markdown",
    })
    .pipe(Schema.optional, Schema.withDecodingDefault(Effect.succeed("markdown" as const))),
  deep: Schema.optional(Schema.Boolean).annotate({
    description: "Enable deep crawling — follow internal links up to max_depth. Defaults to false.",
  }),
  max_depth: Schema.optional(Schema.Number).annotate({
    description: "Max crawl depth for deep mode (1-3). Defaults to 1.",
  }),
  max_pages: Schema.optional(Schema.Number).annotate({
    description: "Max pages to crawl in deep mode (1-20). Defaults to 5.",
  }),
  selector: Schema.optional(Schema.String).annotate({
    description: "CSS selector to extract specific content (e.g. 'article', '.main-content', '#readme')",
  }),
  timeout: Schema.optional(Schema.Number).annotate({ description: "Optional timeout in seconds (max 120)" }),
})

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"

function extractTextFromHTML(html: string): string {
  let text = ""
  let skipDepth = 0
  const blockTags = new Set(["p", "div", "br", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "section", "article"])

  const parser = new Parser({
    onopentag(name) {
      if (skipDepth > 0 || ["script", "style", "noscript", "iframe", "object", "embed"].includes(name)) {
        skipDepth++
      }
    },
    ontext(input) {
      if (skipDepth === 0) text += input
    },
    onclosetag(name) {
      if (skipDepth > 0) {
        skipDepth--
        return
      }
      if (blockTags.has(name)) text += "\n"
    },
  })

  parser.write(html)
  parser.end()
  return text.trim()
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = []
  const seen = new Set<string>()
  const base = new URL(baseUrl)

  const parser = new Parser({
    onopentag(name, attrs) {
      if (name === "a" && attrs.href) {
        try {
          const url = new URL(attrs.href, base)
          if (url.protocol === "http:" || url.protocol === "https:") {
            const normalized = url.origin + url.pathname + url.search
            if (!seen.has(normalized)) {
              seen.add(normalized)
              links.push(normalized)
            }
          }
        } catch {}
      }
    },
  })

  parser.write(html)
  parser.end()
  return links
}

function extractTitle(html: string): string {
  let title = ""
  let inTitle = false
  const parser = new Parser({
    onopentag(name) {
      if (name === "title") inTitle = true
    },
    ontext(input) {
      if (inTitle) title += input
    },
    onclosetag(name) {
      if (name === "title") inTitle = false
    },
  })
  parser.write(html)
  parser.end()
  return title.trim()
}

function extractStructured(html: string, url: string): string {
  const title = extractTitle(html)
  const headings: string[] = []
  const links = extractLinks(html, url)
  let currentH = ""
  let skipDepth = 0

  const parser = new Parser({
    onopentag(name, attrs) {
      if (skipDepth > 0 || ["script", "style"].includes(name)) {
        skipDepth++
        return
      }
      if (/^h[1-6]$/.test(name)) {
        currentH = ""
      }
    },
    ontext(input) {
      if (skipDepth > 0) return
      if (currentH !== undefined) currentH += input
    },
    onclosetag(name) {
      if (skipDepth > 0) {
        skipDepth--
        return
      }
      if (/^h[1-6]$/.test(name) && currentH.trim()) {
        headings.push(currentH.trim())
        currentH = ""
      }
    },
  })

  parser.write(html)
  parser.end()

  return JSON.stringify({ url, title, headings, links: links.slice(0, 50) }, null, 2)
}

function selectContent(html: string, selector: string | undefined): string {
  if (!selector) return html
  const parts: string[] = []
  let depth = 0
  let capturing = false
  let skipDepth = 0
  const tagStack: string[] = []

  const parser = new Parser({
    onopentag(name, attrs) {
      if (skipDepth > 0) {
        skipDepth++
        return
      }
      tagStack.push(name)
      const classes = (attrs.class || "").split(/\s+/)
      const id = attrs.id || ""

      if (!capturing) {
        const sel = selector.toLowerCase()
        if (
          name === sel ||
          classes.some((c: string) => c.toLowerCase() === sel) ||
          id.toLowerCase() === sel ||
          classes.some((c: string) => sel.startsWith(".") && c.toLowerCase() === sel.slice(1)) ||
          (sel.startsWith("#") && id.toLowerCase() === sel.slice(1))
        ) {
          capturing = true
          depth = 0
        }
      }
      if (capturing) {
        depth++
        const attrsStr = Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(" ")
        parts.push(`<${name}${attrsStr ? " " + attrsStr : ""}>`)
      }
    },
    ontext(input) {
      if (skipDepth > 0) return
      if (capturing) parts.push(input)
    },
    onclosetag(name) {
      if (skipDepth > 0) {
        skipDepth--
        return
      }
      tagStack.pop()
      if (capturing) {
        parts.push(`</${name}>`)
        depth--
        if (depth <= 0) capturing = false
      }
    },
  })

  parser.write(html)
  parser.end()
  return parts.join("")
}

function isInternal(url: string, base: URL): boolean {
  try {
    const u = new URL(url)
    return u.origin === base.origin
  } catch {
    return false
  }
}

export const AwakenedScraperTool = Tool.define(
  "scraper",
  Effect.gen(function* () {
    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          if (!params.url.startsWith("http://") && !params.url.startsWith("https://")) {
            throw new Error("URL must start with http:// or https://")
          }

          yield* ctx.ask({
            permission: "scraper",
            patterns: [params.url],
            always: ["*"],
            metadata: { url: params.url, extract: params.extract, deep: params.deep },
          })

          const timeout = Math.min((params.timeout ?? DEFAULT_TIMEOUT / 1000) * 1000, MAX_TIMEOUT)
          const deep = params.deep ?? false
          const maxDepth = Math.min(Math.max(params.max_depth ?? 1, 1), MAX_DEPTH)
          const maxPages = Math.min(Math.max(params.max_pages ?? 5, 1), MAX_PAGES)

          const fetchPage = (url: string) =>
            Effect.gen(function* () {
              const controller = new AbortController()
              const timer = setTimeout(() => controller.abort(), timeout)

              try {
                const response = yield* Effect.promise(() =>
                  fetch(url, {
                    headers: {
                      "User-Agent": UA,
                      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                      "Accept-Language": "en-US,en;q=0.9",
                    },
                    signal: controller.signal,
                  }),
                )

                clearTimeout(timer)

                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }

                const contentType = response.headers.get("content-type") || ""
                const mime = contentType.split(";")[0]?.trim().toLowerCase() || ""
                if (!mime.includes("html") && !mime.includes("xhtml") && !mime.includes("xml")) {
                  throw new Error(`Not an HTML page (${mime})`)
                }

                const html = yield* Effect.promise(() => response.text())
                return html
              } finally {
                clearTimeout(timer)
              }
            }).pipe(Effect.orDie)

          if (!deep) {
            const html = yield* fetchPage(params.url)
            const content = params.selector ? selectContent(html, params.selector) : html
            const result = processPage(content, params.url, params.extract as string)
            return {
              output: result,
              title: `Scraped: ${params.url}`,
              metadata: { url: params.url, pages: 1, maxDepth: 0, urls: [params.url] },
            }
          }

          const base = new URL(params.url)
          const visited = new Set<string>()
          const results: CrawlResult[] = []
          const queue: { url: string; depth: number }[] = [{ url: params.url, depth: 0 }]

          while (queue.length > 0 && results.length < maxPages) {
            const batch = queue.splice(0, 3)
            const batchResults = yield* Effect.forEach(
              batch,
              (item) =>
                Effect.gen(function* () {
                  if (visited.has(item.url) || visited.size >= maxPages) return null
                  visited.add(item.url)

                  const html = yield* fetchPage(item.url).pipe(Effect.catch(() => Effect.succeed(null)))
                  if (!html) return null

                  const links = extractLinks(html, item.url).filter((l) => isInternal(l, base))
                  const title = extractTitle(html)
                  const markdown = convertHTMLToMarkdown(
                    params.selector ? selectContent(html, params.selector) : html,
                  )

                  if (item.depth < maxDepth) {
                    for (const link of links) {
                      if (!visited.has(link)) {
                        queue.push({ url: link, depth: item.depth + 1 })
                      }
                    }
                  }

                  return { url: item.url, title, markdown, links, status: 200 } as CrawlResult
                }).pipe(Effect.orDie),
              { concurrency: 3 },
            )

            for (const r of batchResults) {
              if (r) results.push(r)
            }
          }

          const output = results
            .map((r) => {
              const header = `## ${r.title || r.url}\n\nURL: ${r.url}\n\n`
              return header + r.markdown
            })
            .join("\n\n---\n\n")

          return {
            output: output || "No pages were successfully scraped.",
            title: `Deep scrape: ${params.url} (${results.length} pages)`,
            metadata: {
              url: params.url,
              pages: results.length,
              maxDepth,
              urls: results.map((r) => r.url),
            },
          }
        }).pipe(Effect.orDie),
    }
  }),
)

function convertHTMLToMarkdown(html: string): string {
  return turndownService.turndown(html)
}

function processPage(html: string, url: string, extract: string): string {
  switch (extract) {
    case "markdown":
      return convertHTMLToMarkdown(html)
    case "text":
      return extractTextFromHTML(html)
    case "links":
      return extractLinks(html, url).join("\n")
    case "structured":
      return extractStructured(html, url)
    default:
      return convertHTMLToMarkdown(html)
  }
}
