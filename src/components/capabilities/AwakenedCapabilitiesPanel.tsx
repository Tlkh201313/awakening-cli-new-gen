import React, { useMemo, useState } from 'react'
import { BUNDLED_AUTO_CAPABILITIES } from '../../capabilities/registry.js'
import {
  ALL_AWAKENED_CAPABILITY_IDS,
  type AwakenedCapabilityId,
} from '../../capabilities/ids.js'
import {
  getDisabledAwakenedCapabilityIds,
  setDisabledAwakenedCapabilityIds,
} from '../../capabilities/settings.js'
import { Box, Text } from '../../ink.js'
import { SelectMulti } from '../CustomSelect/SelectMulti.js'
import { Dialog } from '../design-system/Dialog.js'

type Props = {
  onDone: (message?: string) => void
}

export function AwakenedCapabilitiesPanel({ onDone }: Props): React.ReactNode {
  const initiallyEnabled = useMemo(() => {
    const disabled = new Set(getDisabledAwakenedCapabilityIds())
    return ALL_AWAKENED_CAPABILITY_IDS.filter(id => !disabled.has(id))
  }, [])

  const [enabledIds, setEnabledIds] = useState<AwakenedCapabilityId[]>(
    initiallyEnabled,
  )

  const options = useMemo(
    () =>
      BUNDLED_AUTO_CAPABILITIES.map(cap => ({
        label: cap.displayName,
        value: cap.id,
        description: cap.description,
      })),
    [],
  )

  const handleSubmit = (selected: AwakenedCapabilityId[]) => {
    const disabled = ALL_AWAKENED_CAPABILITY_IDS.filter(
      id => !selected.includes(id),
    )
    const { error } = setDisabledAwakenedCapabilityIds(disabled)
    if (error) {
      onDone(`Failed to save: ${error.message}`)
      return
    }
    const onCount = selected.length
    const offCount = ALL_AWAKENED_CAPABILITY_IDS.length - onCount
    onDone(
      `Awakened capabilities: ${onCount} on, ${offCount} off. Auto-load shows "Reading skill …" when your message matches.`,
    )
  }

  return (
    <Dialog
      title="Awakened capabilities"
      subtitle="Auto-load domain packs when your task matches (not /skills)."
      onCancel={() => onDone()}
      hideInputGuide
    >
      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>↑↓ move · Space toggle · Enter save · Esc cancel</Text>
      </Box>
      <SelectMulti
        options={options}
        defaultValue={enabledIds}
        onChange={values => setEnabledIds(values)}
        onSubmit={handleSubmit}
        onCancel={() => onDone()}
        visibleOptionCount={6}
        hideIndexes
      />
      <Box marginTop={1}>
        <Text dimColor>
          {enabledIds.length}/{ALL_AWAKENED_CAPABILITY_IDS.length} enabled
        </Text>
      </Box>
    </Dialog>
  )
}
