/** User wants Awakened product visual language (TUI v2, themes, branding). */
export const AWAKENED_BRAND_RE =
  /\b(awakened design|awakened branding|awakened theme|awakened ui|awakened v2|v2 design(?:\s+system|\s+tokens?)?|packages\/ui\/src\/v2|--v2-|✦ awakened|awakened\.jsonc theme|mytheme\.json|dialog-awakened)\b/i

/**
 * Static HTML/CSS deliverables — single-file sites, landings, marketing pages.
 * Intentionally excludes bare "html" in API/docs contexts.
 */
export const STATIC_HTML_UI_RE =
  /\b(?:(?:single|one|1)\s+(?:html|page|file)|(?:html|static)\s+(?:website|site|page|file|landing)|landing\s+page|marketing\s+page|web\s+page|(?:build|make|create|design|polish)\s+(?:a|an|the|this|my)?\s*(?:html|static|web)\s+(?:page|site|website|file)|index\.html|(?:self[- ]contained|single[- ]file)\s+(?:html|page|site|website)|(?:website|site|page)\s+(?:in|with|using)\s+(?:html|css|only\s+1\s+html))\b/i

/** Visual / UX craft — skills, mockups, accessibility reviews, layout polish. */
export const VISUAL_DESIGN_SKILL_RE =
  /\b(@frontend-design|frontend-design skill|ui[- ]ux|ui designer|tailwind patterns|@tailwind-patterns|form cro|wcag|a11y audit|accessibility audit|visual design|hero section|wireframe|mockup|design system|brand design|polish the ui|improve the ui|make it look|styling|css layout|color palette|typography|responsive layout)\b/i

export function matchesAwakenedBrandDesign(text: string) {
  return AWAKENED_BRAND_RE.test(text)
}

export function matchesStaticHtmlUi(text: string) {
  return STATIC_HTML_UI_RE.test(text)
}

export function matchesVisualDesignWork(text: string) {
  return VISUAL_DESIGN_SKILL_RE.test(text)
}

export function matchesAwakenedDesignCapability(text: string) {
  return matchesAwakenedBrandDesign(text) || matchesStaticHtmlUi(text) || matchesVisualDesignWork(text)
}
