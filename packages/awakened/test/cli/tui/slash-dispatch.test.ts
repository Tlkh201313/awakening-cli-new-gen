import { describe, expect, test } from "bun:test"
import { dispatchPromptSlash, parsePromptSlash } from "../../../src/cli/cmd/tui/component/prompt/slash-dispatch"

describe("slash dispatch", () => {
  test("parsePromptSlash reads command name and args", () => {
    expect(parsePromptSlash("/connect")).toEqual({ name: "connect", args: "" })
    expect(parsePromptSlash("/models extra")).toEqual({ name: "models", args: "extra" })
    expect(parsePromptSlash("/provider\nline two")).toEqual({ name: "provider", args: "\nline two" })
  })

  test("dispatchPromptSlash runs local keymap commands", () => {
    const calls: string[] = []
    const keymap = {
      getCommandEntries: () => [
        {
          command: {
            name: "provider.connect",
            slashName: "connect",
            slashAliases: ["provider"],
          },
        },
      ],
      dispatchCommand: (name: string) => {
        calls.push(name)
      },
    }

    expect(dispatchPromptSlash(keymap as never, "connect")).toBe(true)
    expect(calls).toEqual(["provider.connect"])

    calls.length = 0
    expect(dispatchPromptSlash(keymap as never, "provider")).toBe(true)
    expect(calls).toEqual(["provider.connect"])
  })
})
