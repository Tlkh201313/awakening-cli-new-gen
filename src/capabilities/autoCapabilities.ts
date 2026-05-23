import type { Attachment } from '../utils/attachments.js'
import type { Tools } from '../Tool.js'
import { logForDebugging } from '../utils/debug.js'
import { BUNDLED_AUTO_CAPABILITIES } from './registry.js'
import { isAwakenedCapabilityEnabled } from './settings.js'
import type { AutoCapabilityContext } from './types.js'
import type { AwakenedCapabilityId } from './ids.js'

const MAX_PER_TURN = 2

const sentByAgent = new Map<string, Set<AwakenedCapabilityId>>()

export function resetSentAutoCapabilities(agentKey = ''): void {
  sentByAgent.delete(agentKey)
}

export function getSentAutoCapabilities(agentKey = ''): Set<AwakenedCapabilityId> {
  return new Set(sentByAgent.get(agentKey) ?? [])
}

export function getAutoCapabilityAttachments(options: {
  userText: string | null
  tools: Tools
  agentId?: string
}): Attachment[] {
  const text = options.userText?.trim() ?? ''
  if (!text) return []

  const agentKey = options.agentId ?? ''
  let sent = sentByAgent.get(agentKey)
  if (!sent) {
    sent = new Set()
    sentByAgent.set(agentKey, sent)
  }

  const ctx: AutoCapabilityContext = {
    userText: text,
    tools: options.tools,
  }

  const matched = BUNDLED_AUTO_CAPABILITIES.filter(
    cap =>
      isAwakenedCapabilityEnabled(cap.id) &&
      !sent.has(cap.id) &&
      cap.shouldActivate(ctx),
  ).sort((a, b) => b.priority - a.priority)

  if (matched.length === 0) return []

  const toSend = matched.slice(0, MAX_PER_TURN)
  for (const cap of toSend) {
    sent.add(cap.id)
  }

  logForDebugging(
    `Awakened capabilities: ${toSend.map(c => c.id).join(', ')} (session sent: ${[...sent].join(', ')})`,
  )

  return toSend.map(cap => ({
    type: 'reading_skill' as const,
    skillName: cap.displayName,
    capabilityId: cap.id,
    content: cap.getContent(),
  }))
}
