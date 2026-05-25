import { awakenedSubagentsCapability } from "./bundled/awakenedSubagents"
import { awakenedAntigravityCapability } from "./bundled/awakenedAntigravity"
import { awakenedAwsCapability } from "./bundled/awakenedAws"
import { awakenedBrowserCapability } from "./bundled/awakenedBrowser"
import { awakenedCodeReviewCapability } from "./bundled/awakenedCodeReview"
import { awakenedContext7Capability } from "./bundled/awakenedContext7"
import { awakenedDevToolsCapability } from "./bundled/awakenedDevTools"
import { awakenedDocsCapability } from "./bundled/awakenedDocs"
import { awakenedFrontendCapability } from "./bundled/awakenedFrontend"
import { awakenedGraphifyCapability } from "./bundled/awakenedGraphify"
import { awakenedMarketingCapability } from "./bundled/awakenedMarketing"
import { awakenedMemoryCapability } from "./bundled/awakenedMemory"
import { awakenedProductivityCapability } from "./bundled/awakenedProductivity"
import { awakenedResearchCapability } from "./bundled/awakenedResearch"
import { awakenedSecurityCapability } from "./bundled/awakenedSecurity"
import { awakenedSimplifyCapability } from "./bundled/awakenedSimplify"
import { awakenedSuperpowersCapability } from "./bundled/awakenedSuperpowers"
import { awakenedTestingCapability } from "./bundled/awakenedTesting"
import { CATALOG_CAPABILITIES } from "./bundled/awakenedCatalogs"
import type { AutoCapabilityDefinition } from "./types"

export const BUNDLED_AUTO_CAPABILITIES: AutoCapabilityDefinition[] = [
  awakenedBrowserCapability,
  awakenedResearchCapability,
  awakenedMarketingCapability,
  awakenedAntigravityCapability,
  awakenedGraphifyCapability,
  awakenedProductivityCapability,
  ...CATALOG_CAPABILITIES,
  awakenedSubagentsCapability,
  awakenedSuperpowersCapability,
  awakenedSecurityCapability,
  awakenedDevToolsCapability,
  awakenedTestingCapability,
  awakenedCodeReviewCapability,
  awakenedAwsCapability,
  awakenedDocsCapability,
  awakenedFrontendCapability,
  awakenedContext7Capability,
  awakenedMemoryCapability,
  awakenedSimplifyCapability,
]

export function getAwakenedCapabilityById(id: string): AutoCapabilityDefinition | undefined {
  return BUNDLED_AUTO_CAPABILITIES.find((cap) => cap.id === id)
}
