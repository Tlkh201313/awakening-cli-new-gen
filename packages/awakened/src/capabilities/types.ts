import type { AwakenedCapabilityId } from "./ids"

export type AutoCapabilityContext = {
  userText: string
  toolNames: string[]
  agentMode?: "primary" | "subagent" | "all"
  autoSubagents?: boolean
  autoCapabilities?: boolean
  bootstrap?: boolean
}

export type AutoCapabilityDefinition = {
  id: AwakenedCapabilityId
  displayName: string
  description: string
  priority: number
  shouldActivate: (ctx: AutoCapabilityContext) => boolean
  getContent: () => string
}

export type AutoCapabilityAttachment = {
  skillName: string
  capabilityId: AwakenedCapabilityId
  content: string
}
