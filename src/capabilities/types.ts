import type { AwakenedCapabilityId } from './ids.js'
import type { Tools } from '../Tool.js'

export type AutoCapabilityContext = {
  userText: string
  tools: Tools
}

export type AutoCapabilityDefinition = {
  /** Stable settings / storage id */
  id: AwakenedCapabilityId
  /** Shown in "Reading skill {displayName}" */
  displayName: string
  description: string
  /** Priority when multiple match (higher wins first); max 2 per turn */
  priority: number
  shouldActivate: (ctx: AutoCapabilityContext) => boolean
  getContent: () => string
}
