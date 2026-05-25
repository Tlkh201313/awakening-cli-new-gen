import type { AwakenedCapabilityId } from "../ids"
import { SKILL_CATALOGS, type CatalogDefinition } from "../catalog-definitions"
import type { AutoCapabilityDefinition } from "../types"

function content(catalog: CatalogDefinition) {
  const browse = catalog.browse ? `- Browse: ${catalog.browse}\n` : ""
  return `# ${catalog.displayName}

Upstream: ${catalog.upstream}

## Install

${catalog.install}
${browse}
## Focus

${catalog.focus}

## Examples (one skill per task)

${catalog.examples.map((item) => `- ${item}`).join("\n")}

## Rules

1. Match intent → **one** SKILL.md — never load whole catalogs into context.
2. Read skill from install path; follow repo README for agent compatibility.
3. Built-in Awakened skills (frontend, testing, …) win when they cover the task.
`
}

function fromCatalog(catalog: CatalogDefinition): AutoCapabilityDefinition {
  return {
    id: catalog.id as AwakenedCapabilityId,
    displayName: catalog.displayName,
    description: catalog.description,
    priority: catalog.priority,
    shouldActivate(ctx) {
      return catalog.regex.test(ctx.userText)
    },
    getContent() {
      return content(catalog)
    },
  }
}

export const CATALOG_CAPABILITIES: AutoCapabilityDefinition[] = SKILL_CATALOGS.map(fromCatalog)
