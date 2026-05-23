/** Hardware stats command implementation */
import { Box, Text } from '../../ink.js'
import React from 'react'
import { getHardwareStats } from '../../utils/hardwareStats.js'
import type { LocalJSXCommandCall } from '../../types/command.js'

export const call: LocalJSXCommandCall = async (onDone) => {
  return <Hardware onDone={onDone} />
}

function Hardware({ onDone }: { onDone?: () => void }) {
  const stats = getHardwareStats()
  return (
    <Box flexDirection="column">
      <Text bold>Hardware Stats</Text>
      <Text>CPU Cores: {stats.cpuCores}</Text>
      <Text>RAM: {stats.ramMb} MiB ({stats.ramTier})</Text>
      <Text>Performance mode: {stats.performanceMode ? 'on' : 'off'}</Text>
      <Text>Platform: {stats.platform}</Text>
      <Text>Architecture: {stats.arch}</Text>
    </Box>
  )
}
