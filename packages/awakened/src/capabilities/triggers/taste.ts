/** Taste-Skill / premium anti-slop frontend work. */
export const TASTE_SKILL_RE =
  /\b(awakened[- ]?taste|taste[- ]?skill|tasteskill|design[- ]?taste|anti[- ]?slop|premium ui|high[- ]?end ui|look premium|no generic ui|stop the slop|boring generic|gradient hero|ai slop|dribbble|bento grid|gsap\b|framer motion hero|redesign the ui|polish (?:the )?(?:landing|website|page)|notion[- ]?like ui|linear[- ]?like ui)\b/i

export function matchesAwakenedTasteCapability(text: string) {
  return TASTE_SKILL_RE.test(text)
}
