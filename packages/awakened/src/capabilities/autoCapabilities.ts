import { Effect } from "effect"

import * as Log from "@awakened-ai/core/util/log"

import { ALL_AWAKENED_CAPABILITY_IDS, type AwakenedCapabilityId } from "./ids"

import { BUNDLED_AUTO_CAPABILITIES } from "./registry"

import { getDisabledAwakenedCapabilityIds } from "./settings"
import { normalizeAwakenedTokenMode, resolveCapabilityLimits, type AwakenedTokenMode } from "./tokenMode"
import { Config } from "@/config/config"

import type { AutoCapabilityAttachment, AutoCapabilityContext, AutoCapabilityDefinition } from "./types"



const log = Log.create({ service: "capabilities" })



export const MAX_PER_TURN = 2
export const MAX_BOOTSTRAP_TURN = 6



const sentByAgent = new Map<string, Set<AwakenedCapabilityId>>()



export function resetSentAutoCapabilities(agentKey = ""): void {

  sentByAgent.delete(agentKey)

}



export function getSentAutoCapabilities(agentKey = ""): Set<AwakenedCapabilityId> {

  return new Set(sentByAgent.get(agentKey) ?? [])

}



export function resolveAutoCapabilityAttachments(options: {

  userText: string | null

  toolNames: string[]

  agentKey?: string

  agentMode?: AutoCapabilityContext["agentMode"]

  autoSubagents?: boolean

  autoCapabilities?: boolean

  tokenMode?: AwakenedTokenMode

  disabled?: AwakenedCapabilityId[]

}): AutoCapabilityAttachment[] {

  const text = options.userText?.trim() ?? ""

  if (!text) return []



  const agentKey = options.agentKey ?? ""

  const sent = sentByAgent.get(agentKey) ?? new Set<AwakenedCapabilityId>()

  if (!sentByAgent.has(agentKey)) sentByAgent.set(agentKey, sent)



  const disabled = new Set(options.disabled ?? [])

  const bootstrap =

    sent.size === 0 && options.agentMode === "primary" && options.autoCapabilities !== false

  const ctx: AutoCapabilityContext = {

    userText: text,

    toolNames: options.toolNames,

    agentMode: options.agentMode,

    autoSubagents: options.autoSubagents,

    autoCapabilities: options.autoCapabilities,

    bootstrap,

  }



  const matched = BUNDLED_AUTO_CAPABILITIES.filter(

    (cap) => !disabled.has(cap.id) && !sent.has(cap.id) && cap.shouldActivate(ctx),

  ).sort((a, b) => b.priority - a.priority)



  if (matched.length === 0) return []



  const limits = resolveCapabilityLimits(normalizeAwakenedTokenMode(options.tokenMode))

  const toSend = matched.slice(0, bootstrap ? limits.maxBootstrap : limits.maxPerTurn)

  for (const cap of toSend) sent.add(cap.id)



  log.info("auto capabilities", {

    sent: toSend.map((cap) => cap.id),

    bootstrap,

    session: [...sent],

  })



  return toSend.map((cap) => ({

    skillName: cap.displayName,

    capabilityId: cap.id,

    content: cap.getContent(),

  }))

}



export const getAutoCapabilityAttachments = Effect.fn("AwakenedCapabilities.getAttachments")(function* (options: {
  userText: string | null
  toolNames: string[]
  agentKey?: string
  agentMode?: AutoCapabilityContext["agentMode"]
  autoSubagents?: boolean
  autoCapabilities?: boolean
}) {
  const config = yield* Config.Service
  const cfg = yield* config.get()
  const disabled = yield* getDisabledAwakenedCapabilityIds()
  return resolveAutoCapabilityAttachments({
    ...options,
    disabled,
    tokenMode: cfg.awakenedCapabilities?.tokenMode,
  })
})


