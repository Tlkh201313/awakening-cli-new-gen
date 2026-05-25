import { expect, test } from "bun:test"
import { openwhisprBridgeFile, openwhisprRepoDir } from "../../../src/cli/cmd/tui/util/voice/openwhispr-client"

test("openwhisprRepoDir points at vendor clone", () => {
  expect(openwhisprRepoDir()).toContain("vendor")
  expect(openwhisprRepoDir()).toContain("openwhispr")
})

test("openwhisprBridgeFile is in user home", () => {
  expect(openwhisprBridgeFile()).toContain(".openwhispr")
  expect(openwhisprBridgeFile()).toContain("cli-bridge.json")
})
