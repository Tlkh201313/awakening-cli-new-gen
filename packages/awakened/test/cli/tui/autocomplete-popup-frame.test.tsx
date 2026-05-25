/** @jsxImportSource @opentui/solid */
import { testRender } from "@opentui/solid"
import { expect, test } from "bun:test"
import { AwakenedFrameBorder, SplitBorder } from "../../../src/cli/cmd/tui/component/border"

function markerColumn(frame: string, marker: string, rowIndex: number) {
  const row = frame.split("\n")[rowIndex] ?? ""
  return row.indexOf(marker)
}

function AutocompleteRow(props: { active: boolean; label: string }) {
  const paddingLeft = props.active ? 1 : 2
  return (
    <box
      paddingLeft={paddingLeft}
      paddingRight={2}
      flexDirection="row"
      gap={1}
      border={props.active ? ["left"] : undefined}
      customBorderChars={SplitBorder.customBorderChars}
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

test("full autocomplete popup keeps row columns aligned", async () => {
  const app = await testRender(
    () => (
      <box flexDirection="column" width={40} height={8}>
        <box
          border={AwakenedFrameBorder.border}
          customBorderChars={AwakenedFrameBorder.customBorderChars}
        >
          <scrollbox height={4} scrollbarOptions={{ visible: false }}>
            <AutocompleteRow active label="/help" />
            <AutocompleteRow active={false} label="/model" />
          </scrollbox>
        </box>
      </box>
    ),
    { width: 40, height: 8 },
  )

  try {
    await app.renderOnce()
    const frame = app.captureCharFrame()
    const lines = frame.split("\n")
    const activeLine = lines.findIndex((line) => line.includes("/help"))
    const inactiveLine = lines.findIndex((line) => line.includes("/model"))
    expect(markerColumn(frame, "/", activeLine)).toBe(markerColumn(frame, "/", inactiveLine))
  } finally {
    app.renderer.destroy()
  }
})
