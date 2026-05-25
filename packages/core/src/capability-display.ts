export const AWAKENED_CAPABILITY_METADATA_KEY = "awakenedCapability" as const

export type AwakenedCapabilityBadge = {
  id: string
  label: string
}

export function awakenedCapabilityMetadata(id: string, label: string) {
  return {
    [AWAKENED_CAPABILITY_METADATA_KEY]: { id, label },
  }
}

export function readAwakenedCapabilityMetadata(metadata?: Record<string, unknown>): AwakenedCapabilityBadge | undefined {
  if (!metadata) return
  const raw = metadata[AWAKENED_CAPABILITY_METADATA_KEY]
  if (!raw || typeof raw !== "object") return
  const id = "id" in raw && typeof raw.id === "string" ? raw.id : undefined
  const label = "label" in raw && typeof raw.label === "string" ? raw.label : undefined
  if (!id || !label) return
  return { id, label }
}

export function listAwakenedCapabilityBadges(
  parts: ReadonlyArray<{ type: string; synthetic?: boolean; metadata?: Record<string, unknown> }>,
) {
  const seen = new Set<string>()
  const badges: AwakenedCapabilityBadge[] = []
  for (const part of parts) {
    if (part.type !== "text" || !part.synthetic) continue
    const badge = readAwakenedCapabilityMetadata(part.metadata)
    if (!badge || seen.has(badge.id)) continue
    seen.add(badge.id)
    badges.push(badge)
  }
  return badges
}
