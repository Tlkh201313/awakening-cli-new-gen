import { Effect } from "effect"
import { Config } from "@/config/config"
import { ALL_AWAKENED_CAPABILITY_IDS, type AwakenedCapabilityId } from "./ids"

let testDisabledOverride: AwakenedCapabilityId[] | null | undefined

const LEGACY_CAPABILITY_IDS: Record<string, AwakenedCapabilityId> = {
  "awakened-agents": "awakened-subagents",
}

export function setTestDisabledAwakenedCapabilities(disabled: AwakenedCapabilityId[] | null): void {
  testDisabledOverride = disabled
}

function normalizeCapabilityId(id: string): AwakenedCapabilityId | undefined {
  const mapped = LEGACY_CAPABILITY_IDS[id] ?? id
  if ((ALL_AWAKENED_CAPABILITY_IDS as string[]).includes(mapped)) return mapped as AwakenedCapabilityId
}

export const getDisabledAwakenedCapabilityIds = Effect.fn("AwakenedCapabilities.getDisabled")(function* () {
  if (testDisabledOverride !== undefined) return testDisabledOverride ?? []
  const config = yield* Config.Service
  const cfg = yield* config.get()
  const raw = cfg.awakenedCapabilities?.disabled ?? []
  return raw.flatMap((id) => {
    const normalized = normalizeCapabilityId(id)
    return normalized ? [normalized] : []
  })
})

export const isAwakenedCapabilityEnabled = Effect.fn("AwakenedCapabilities.isEnabled")(function* (
  id: AwakenedCapabilityId,
) {
  const disabled = yield* getDisabledAwakenedCapabilityIds()
  return !disabled.includes(id)
})

export const getEnabledAwakenedCapabilityIds = Effect.fn("AwakenedCapabilities.getEnabled")(function* () {
  const disabled = yield* getDisabledAwakenedCapabilityIds()
  return ALL_AWAKENED_CAPABILITY_IDS.filter((id) => !disabled.includes(id))
})