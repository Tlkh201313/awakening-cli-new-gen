/** Live hardware panel — CPU/RAM bars, heap, client tuning */
import { Box, Text, useInput } from '../../ink.js'
import React, { useCallback, useEffect, useState } from 'react'
import {
  formatMiB,
  getHardwareSnapshotLive,
  renderPercentBar,
  type HardwareSnapshot,
} from '../../utils/hardwareStats.js'
import type { LocalJSXCommandCall } from '../../types/command.js'

export const call: LocalJSXCommandCall = async onDone => {
  return <HardwarePanel onDone={onDone} />
}

function pressureLabel(level: HardwareSnapshot['memoryPressure']): string {
  if (level === 2) return 'critical'
  if (level === 1) return 'elevated'
  return 'normal'
}

function StatRow({
  label,
  value,
  bar,
  percent,
}: {
  label: string
  value: string
  bar?: string
  percent?: number
}) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text dimColor>{label.padEnd(14)}</Text>
        <Text>{value}</Text>
        {percent !== undefined ? (
          <Text dimColor>{`  ${percent}%`}</Text>
        ) : null}
      </Box>
      {bar ? (
        <Text>
          <Text color="yellow">{bar}</Text>
        </Text>
      ) : null}
    </Box>
  )
}

function HardwarePanel({ onDone }: { onDone?: () => void }) {
  const [snap, setSnap] = useState<HardwareSnapshot | null>(null)

  const refresh = useCallback(async () => {
    setSnap(await getHardwareSnapshotLive())
  }, [])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), 2000)
    return () => clearInterval(id)
  }, [refresh])

  useInput((_input, key) => {
    if (key.escape) onDone?.()
  })

  if (!snap) {
    return (
      <Box flexDirection="column">
        <Text bold>Hardware</Text>
        <Text dimColor>Sampling…</Text>
      </Box>
    )
  }

  const heapPercent =
    snap.heapTotalMb > 0
      ? Math.round((snap.heapUsedMb / snap.heapTotalMb) * 100)
      : 0

  const cpuPct = snap.cpuPercent ?? 0
  const cpuNote =
    snap.cpuPercent === null ? 'n/a' : `${snap.cpuPercent}% (approx)`

  return (
    <Box flexDirection="column" paddingBottom={1}>
      <Text bold>Awakened — Hardware</Text>
      <Text dimColor>Esc close · refreshes every 1s</Text>
      <Box marginTop={1} flexDirection="column">
        <StatRow
          label="System RAM"
          value={`${formatMiB(snap.ramUsedMb)} / ${formatMiB(snap.ramTotalMb)}`}
          percent={snap.ramUsedPercent}
          bar={renderPercentBar(snap.ramUsedPercent)}
        />
        <StatRow
          label="CLI heap"
          value={`${formatMiB(snap.heapUsedMb)} / ${formatMiB(snap.heapTotalMb)}`}
          percent={heapPercent}
          bar={renderPercentBar(heapPercent)}
        />
        <StatRow
          label="RSS"
          value={formatMiB(snap.rssMb)}
        />
        <StatRow
          label="CPU"
          value={`${snap.cpuCores} cores · ${cpuNote}`}
          percent={snap.cpuPercent ?? undefined}
          bar={snap.cpuPercent !== null ? renderPercentBar(cpuPct) : undefined}
        />
        {snap.loadAvg1 !== null && snap.loadAvg1 > 0 ? (
          <StatRow
            label="Load (1m)"
            value={snap.loadAvg1.toFixed(2)}
          />
        ) : null}
        <StatRow
          label="RAM tier"
          value={`${snap.ramTier} (${formatMiB(snap.ramTotalMb)} total)`}
        />
        <StatRow
          label="Pressure"
          value={pressureLabel(snap.memoryPressure)}
        />
        <StatRow
          label="Perf mode"
          value={snap.performanceMode ? 'on' : 'off'}
        />
        <StatRow
          label="Stream flush"
          value={`${snap.streamFlushMs}ms (UI coalesce)`}
        />
        <Text dimColor>
          {snap.platform}/{snap.arch} · lower flush = snappier tokens, more CPU
        </Text>
      </Box>
    </Box>
  )
}
