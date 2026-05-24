export const AWAKENED_CAPABILITY_IDS = {
  browser: 'awakened-browser',
  research: 'awakened-research',
  marketing: 'awakened-marketing',
  antigravity: 'awakened-antigravity',
  graphify: 'awakened-graphify',
  productivity: 'awakened-productivity',
  agents: 'awakened-agents',
} as const

export type AwakenedCapabilityId =
  (typeof AWAKENED_CAPABILITY_IDS)[keyof typeof AWAKENED_CAPABILITY_IDS]

export const ALL_AWAKENED_CAPABILITY_IDS: AwakenedCapabilityId[] = [
  AWAKENED_CAPABILITY_IDS.browser,
  AWAKENED_CAPABILITY_IDS.research,
  AWAKENED_CAPABILITY_IDS.marketing,
  AWAKENED_CAPABILITY_IDS.antigravity,
  AWAKENED_CAPABILITY_IDS.graphify,
  AWAKENED_CAPABILITY_IDS.productivity,
  AWAKENED_CAPABILITY_IDS.agents,
]
