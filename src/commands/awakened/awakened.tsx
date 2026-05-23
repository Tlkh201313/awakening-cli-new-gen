import React from 'react'
import { AwakenedCapabilitiesPanel } from '../../components/capabilities/AwakenedCapabilitiesPanel.js'
import type { LocalJSXCommandCall } from '../../types/command.js'

export const call: LocalJSXCommandCall = async onDone => {
  return <AwakenedCapabilitiesPanel onDone={onDone} />
}
