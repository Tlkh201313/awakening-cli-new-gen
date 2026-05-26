const MAX_INTERNED = 1000
const MAX_STRING_LENGTH = 100

const pool = new Map<string, string>()
const prewarmValues = [
  "user", "assistant", "system", "tool",
  "pending", "running", "completed", "error",
  "text", "file", "tool", "compaction",
  "primary", "subagent", "all",
  "read", "write", "edit", "shell", "glob", "grep",
  "build", "plan", "explore", "debugger", "reviewer",
]

export function intern<T extends string>(str: T): T {
  if (str.length > MAX_STRING_LENGTH) return str
  const existing = pool.get(str)
  if (existing !== undefined) return existing as T
  if (pool.size >= MAX_INTERNED) {
    const first = pool.keys().next().value
    if (first !== undefined) pool.delete(first)
  }
  pool.set(str, str)
  return str
}

export function internAll<T extends string>(strings: T[]): T[] {
  return strings.map(intern)
}

export function prewarm(): void {
  for (const value of prewarmValues) {
    pool.set(value, value)
  }
}

export function internStats() {
  return { size: pool.size, max: MAX_INTERNED }
}

prewarm()
