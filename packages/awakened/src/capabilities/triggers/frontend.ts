/** Framework UI implementation in the repo — React, Vue, Svelte, etc. */
export const FRAMEWORK_FRONTEND_RE =
  /\b(react\b|next\.?js|vue\b|svelte|solidjs|jsx|tsx|\.tsx\b|\.jsx\b|tailwind|css module|component library|app router|server component|client component|core web vitals|lighthouse)\b/i

export function matchesFrameworkFrontend(text: string) {
  return FRAMEWORK_FRONTEND_RE.test(text)
}
