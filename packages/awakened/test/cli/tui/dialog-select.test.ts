import { expect, test } from "bun:test"
import { resolveMouseSelectedOption, type DialogSelectOption } from "../../../src/cli/cmd/tui/ui/dialog-select"

test("resolveMouseSelectedOption returns clicked option instead of current selection", () => {
  const options: DialogSelectOption<string>[] = [
    { title: "Alpha", value: "alpha" },
    { title: "Beta", value: "beta" },
  ]

  const result = resolveMouseSelectedOption(options, "beta")

  expect(result?.value).toBe("beta")
})
