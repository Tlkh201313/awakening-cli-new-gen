import { awakenedAgentsCapability } from './bundled/awakenedAgents.js'
import { awakenedAntigravityCapability } from './bundled/awakenedAntigravity.js'
import { awakenedBrowserCapability } from './bundled/awakenedBrowser.js'
import { awakenedGraphifyCapability } from './bundled/awakenedGraphify.js'
import { awakenedMarketingCapability } from './bundled/awakenedMarketing.js'
import { awakenedProductivityCapability } from './bundled/awakenedProductivity.js'
import { awakenedResearchCapability } from './bundled/awakenedResearch.js'
import type { AutoCapabilityDefinition } from './types.js'

export const BUNDLED_AUTO_CAPABILITIES: AutoCapabilityDefinition[] = [
  awakenedBrowserCapability,
  awakenedResearchCapability,
  awakenedMarketingCapability,
  awakenedAntigravityCapability,
  awakenedGraphifyCapability,
  awakenedProductivityCapability,
  awakenedAgentsCapability,
]

export function getAwakenedCapabilityById(
  id: string,
): AutoCapabilityDefinition | undefined {
  return BUNDLED_AUTO_CAPABILITIES.find(c => c.id === id)
}
