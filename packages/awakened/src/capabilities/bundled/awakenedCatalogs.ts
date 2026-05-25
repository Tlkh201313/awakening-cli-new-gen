import type { AwakenedCapabilityId } from "../ids"
import { buildCatalogContent, SKILL_CATALOGS, type CatalogDefinition } from "../catalog-definitions"
import type { AutoCapabilityDefinition } from "../types"

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
      return buildCatalogContent(catalog)
    },
  }
}

export const CATALOG_CAPABILITIES: AutoCapabilityDefinition[] = SKILL_CATALOGS.map(fromCatalog)
