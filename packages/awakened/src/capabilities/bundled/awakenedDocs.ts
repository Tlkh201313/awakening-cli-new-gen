import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const DOCS_RE =
  /\b(write docs|documentation|readme|api docs|openapi|swagger|docstring|jsdoc|typedoc|mkdocs|docusaurus|changelog|contributing guide|architecture doc)\b/i

export const awakenedDocsCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.docs,
  displayName: "Awakened Docs",
  description: "Documentation and technical writing playbooks",
  priority: 62,
  shouldActivate(ctx) {
    return DOCS_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened Docs

Invoke Skill \`docs-writer\` for awakened-adapted technical writing.

## Workflow

1. **Audience** — developer onboarding vs end-user? adjust depth.
2. **Source of truth** — read code/config before documenting behavior.
3. **Structure** — overview → quick start → reference → troubleshooting.
4. **Verify** — commands in docs must be copy-pasteable and tested.

## Rules

- Do not document aspirational features — only what exists in the repo.
- Prefer updating existing README over new orphan markdown files unless asked.
- Match project tone; use complete sentences in user-facing docs.

## Catalog skills

- **doc-writer** / **technical-writer** in antigravity-awesome-skills
- Anthropic official **docx** / **pdf** skills for document *generation* (not repo docs)
`
  },
}
