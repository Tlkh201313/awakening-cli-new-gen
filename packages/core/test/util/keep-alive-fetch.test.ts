import { describe, expect, test } from "bun:test"
import { keepAliveFetch } from "../../src/util/keep-alive-fetch"

describe("keepAliveFetch", () => {
  test("is a fetch function", () => {
    expect(typeof keepAliveFetch).toBe("function")
  })
})
