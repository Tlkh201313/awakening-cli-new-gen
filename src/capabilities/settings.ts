import {
  getSettings_DEPRECATED,
  updateSettingsForSource,
} from '../utils/settings/settings.js'
import {
  ALL_AWAKENED_CAPABILITY_IDS,
  type AwakenedCapabilityId,
} from './ids.js'

/** Test-only override — avoids writing user settings.json during unit tests. */
let testDisabledOverride: AwakenedCapabilityId[] | null | undefined

export function setTestDisabledAwakenedCapabilities(
  disabled: AwakenedCapabilityId[] | null,
): void {
  testDisabledOverride = disabled
}

export function getDisabledAwakenedCapabilityIds(): AwakenedCapabilityId[] {
  if (testDisabledOverride !== undefined) {
    return testDisabledOverride ?? []
  }
  const raw = getSettings_DEPRECATED().awakenedCapabilities?.disabled ?? []
  return raw.filter((id): id is AwakenedCapabilityId =>
    (ALL_AWAKENED_CAPABILITY_IDS as string[]).includes(id),
  )
}

export function isAwakenedCapabilityEnabled(id: AwakenedCapabilityId): boolean {
  return !getDisabledAwakenedCapabilityIds().includes(id)
}

export function getEnabledAwakenedCapabilityIds(): AwakenedCapabilityId[] {
  return ALL_AWAKENED_CAPABILITY_IDS.filter(isAwakenedCapabilityEnabled)
}

export function setDisabledAwakenedCapabilityIds(
  disabled: AwakenedCapabilityId[],
): { error: Error | null } {
  return updateSettingsForSource('userSettings', {
    awakenedCapabilities: { disabled },
  })
}
