/** @jsxImportSource @opentui/solid */
import { testRender } from "@opentui/solid"
import { expect, test } from "bun:test"

function markerColumn(frame: string, marker: string, rowIndex: number) {
  const row = frame.split("\n")[rowIndex] ?? ""
  return row.indexOf(marker)
}

function Row(props: { active: boolean; label: string; compensate: boolean }) {
  const paddingLeft = props.compensate ? (props.active ? 1 : 2) : 2
  return (
    <box
      paddingLeft={paddingLeft}
      border={props.active ? ["left"] : undefined}
      flexDirection="row"
      gap={1}
    >
      <text flexShrink={0} wrapMode="none">
        {props.label}
      </text>
      <text flexShrink={0} wrapMode="none">
        desc
      </text>
    </box>
  )
}

test("autocomplete row border consumes one column", async () => {
  const app = await testRender(
    () => (
      <box flexDirection="column" width={40} height={4}>
        <Row active label="ACTIVE" compensate={false} />
        <Row active={false} label="INACTV" compensate={false} />
      </box>
    ),
    { width: 40, height: 4 },
  )

  try {
    await app.renderOnce()
    const frame = app.captureCharFrame()
    expect(markerColumn(frame, "A", 0) - markerColumn(frame, "I", 1)).toBe(1)
  } finally {
    app.renderer.destroy()
  }
})

test("autocomplete row padding compensates for left border", async () => {
  const app = await testRender(
    () => (
      <box flexDirection="column" width={40} height={4}>
        <Row active label="ACTIVE" compensate />
        <Row active={false} label="INACTV" compensate />
      </box>
    ),
    { width: 40, height: 4 },
  )

  try {
    await app.renderOnce()
    const frame = app.captureCharFrame()
    expect(markerColumn(frame, "A", 0)).toBe(markerColumn(frame, "I", 1))
  } finally {
    app.renderer.destroy()
  }
})
