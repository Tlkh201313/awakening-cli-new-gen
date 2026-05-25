const FILLER_PATTERNS: [RegExp, string][] = [
  [/\bplease\b\s*/gi, ""],
  [/\bcan you\b\s*/gi, ""],
  [/\bcould you\b\s*/gi, ""],
  [/\bwould you\b\s*/gi, ""],
  [/\bi want you to\b\s*/gi, ""],
  [/\bi need you to\b\s*/gi, ""],
  [/\bi would like you to\b\s*/gi, ""],
  [/\bmake sure to\b\s*/gi, ""],
  [/\bmake sure you\b\s*/gi, ""],
  [/\bensure that\b\s*/gi, "ensure "],
  [/\bin order to\b\s*/gi, "to "],
  [/\bat this point in time\b\s*/gi, "now "],
  [/\bdue to the fact that\b\s*/gi, "because "],
  [/\bin the event that\b\s*/gi, "if "],
  [/\bfor the purpose of\b\s*/gi, "for "],
  [/\bprior to\b\s*/gi, "before "],
  [/\bsubsequent to\b\s*/gi, "after "],
  [/\bin addition\b\s*/gi, "also "],
  [/\bas well as\b\s*/gi, "and "],
  [/\bwith regard to\b\s*/gi, "about "],
  [/\bwith respect to\b\s*/gi, "about "],
  [/\bin terms of\b\s*/gi, "for "],
  [/\bit is important to note that\b\s*/gi, ""],
  [/\bit should be noted that\b\s*/gi, ""],
  [/\bplease note that\b\s*/gi, ""],
  [/\bkeep in mind that\b\s*/gi, ""],
  [/\bI'm going to\b\s*/gi, "I'll "],
  [/\blet me\b\s*/gi, ""],
  [/\bgo ahead and\b\s*/gi, ""],
  [/\bas soon as possible\b\s*/gi, "ASAP"],
  [/\bat the end of the day\b\s*/gi, ""],
  [/\bbasically\b\s*/gi, ""],
  [/\bactually\b\s*/gi, ""],
  [/\bjust\b\s*/gi, ""],
  [/\breally\b\s*/gi, ""],
  [/\bvery\b\s*/gi, ""],
  [/\bquite\b\s*/gi, ""],
  [/\bsimply\b\s*/gi, ""],
]

const VERBOSE_TO_CONCISE: [RegExp, string][] = [
  [/\brefactor the code\b/gi, "refactor"],
  [/\bfix the bug\b/gi, "fix bug"],
  [/\badd a new\b/gi, "add"],
  [/\bcreate a new\b/gi, "create"],
  [/\bimplement the\b/gi, "implement"],
  [/\bupdate the\b/gi, "update"],
  [/\bdelete the\b/gi, "delete"],
  [/\bremove the\b/gi, "remove"],
  [/\bchange the\b/gi, "change"],
  [/\bmodify the\b/gi, "modify"],
  [/\blook at the\b/gi, "check"],
  [/\btake a look at\b/gi, "check"],
  [/\bhave a look at\b/gi, "check"],
  [/\bdo a search\b/gi, "search"],
  [/\bmake a change\b/gi, "change"],
  [/\bgive me a summary\b/gi, "summarize"],
  [/\bprovide a summary\b/gi, "summarize"],
  [/\bwrite tests for\b/gi, "test"],
  [/\bwrite a test for\b/gi, "test"],
]

function collapseWhitespace(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim()
}

export function optimizePrompt(text: string): { optimized: string; savings: number } {
  if (!text.trim()) return { optimized: text, savings: 0 }

  let result = text

  for (const [pattern, replacement] of FILLER_PATTERNS) {
    result = result.replace(pattern, replacement)
  }

  for (const [pattern, replacement] of VERBOSE_TO_CONCISE) {
    result = result.replace(pattern, replacement)
  }

  result = collapseWhitespace(result)

  const savings = text.length - result.length
  return { optimized: result, savings }
}
