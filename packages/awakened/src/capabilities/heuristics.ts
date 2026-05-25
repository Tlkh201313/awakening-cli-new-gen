/** Broad software-engineering intent — used for first-turn auto capability routing. */
export const DEV_TASK_RE =
  /\b(implement|fix|add|build|refactor|review|test|deploy|debug|bug|feature|migrate|write|docs?|security|aws|cloud|browser|e2e|playwright|memory|remember|simplify|graphify|skill|subagent|ui|component|react|next\.?js|tailwind|auth|api|pr|diff|merge|audit|lambda|stripe|vercel|typecheck|lint|ci|error|fail(?:ing|ed)?|spec|jest|bun test|playwright|mcp|lsp|config|awakened)\b/i

export function bootstrapMatch(userText: string) {
  return userText.trim().length > 0 && DEV_TASK_RE.test(userText)
}
