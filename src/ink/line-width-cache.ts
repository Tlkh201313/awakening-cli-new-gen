import { LRUCache } from 'lru-cache'
import { stringWidth } from './stringWidth.js'

// During streaming, text grows but completed lines are immutable.
// Caching stringWidth per-line avoids re-measuring hundreds of
// unchanged lines on every token (~50x reduction in stringWidth calls).
// LRU eviction preserves hot entries (blank lines, common indentation)
// instead of wiping the whole cache every 4096 unique lines.
const cache = new LRUCache<string, number>({
  max: 4096,
})

export function lineWidth(line: string): number {
  const cached = cache.get(line)
  if (cached !== undefined) return cached

  const width = stringWidth(line)
  cache.set(line, width)
  return width
}
