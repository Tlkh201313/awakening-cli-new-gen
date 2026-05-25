export type MarkdownLink = {
  href: string
  label: string
}

const urlPattern = /^https?:\/\/[^\s<>"'`)\]]+$/

function normalizeUrl(input: string) {
  const href = input.trim().replace(/[),.;:!?]+$/, "")
  if (!urlPattern.test(href)) return
  try {
    const url = new URL(href)
    if (url.protocol !== "http:" && url.protocol !== "https:") return
    return url.toString()
  } catch {
    return
  }
}

export function parseMarkdownLinks(content: string) {
  const seen = new Set<string>()
  const links: MarkdownLink[] = []

  for (const match of content.matchAll(/\[([^\]]*)\]\(([^)\s]+)\)/g)) {
    const href = normalizeUrl(match[2])
    if (!href || seen.has(href)) continue
    seen.add(href)
    links.push({ href, label: match[1] || href })
  }

  for (const match of content.matchAll(/https?:\/\/[^\s<>"'`)\]]+/g)) {
    const href = normalizeUrl(match[0])
    if (!href || seen.has(href)) continue
    seen.add(href)
    links.push({ href, label: href })
  }

  return links
}
