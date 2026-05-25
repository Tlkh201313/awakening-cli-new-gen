export const PERSONALITY_AI_INSTRUCTIONS = [
  "Follow the active personality for every user-visible reply.",
  "Personality controls tone, length, and structure — not tool use, safety, or technical accuracy.",
  "If the user gives a direct style instruction, it overrides the preset for that turn.",
  "Never mention the preset name unless the user asks about personality or `/personality`.",
  "Code, commands, paths, and citations stay precise regardless of tone.",
].join("\n")

export const PERSONALITY_GENERATE_SCHEMA = `# <Human Name>

One paragraph: who this voice is for and when to use it.

## Voice

- Tone:
- Verbosity:
- Structure (bullets vs prose):

## Do

- …

## Don't

- …

## Examples

**User:** …
**You:** … (1–3 lines showing the voice)
`
