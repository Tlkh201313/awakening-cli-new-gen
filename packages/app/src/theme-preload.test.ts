import { beforeEach, describe, expect, test } from "bun:test"

const src = await Bun.file(new URL("../public/aw-theme-preload.js", import.meta.url)).text()

const run = () => Function(src)()

beforeEach(() => {
  document.head.innerHTML = ""
  document.documentElement.removeAttribute("data-theme")
  document.documentElement.removeAttribute("data-color-scheme")
  localStorage.clear()
  Object.defineProperty(window, "matchMedia", {
    value: () =>
      ({
        matches: false,
      }) as MediaQueryList,
    configurable: true,
  })
})

describe("theme preload", () => {
  test("migrates legacy aw-1 to aw-2 before mount", () => {
    localStorage.setItem("awakened-theme-id", "aw-1")
    localStorage.setItem("awakened-theme-css-light", "--background-base:#fff;")
    localStorage.setItem("awakened-theme-css-dark", "--background-base:#000;")

    run()

    expect(document.documentElement.dataset.theme).toBe("aw-2")
    expect(document.documentElement.dataset.colorScheme).toBe("light")
    expect(localStorage.getItem("awakened-theme-id")).toBe("aw-2")
    expect(localStorage.getItem("awakened-theme-css-light")).toBeNull()
    expect(localStorage.getItem("awakened-theme-css-dark")).toBeNull()
    expect(document.getElementById("aw-theme-preload")).toBeNull()
  })

  test("keeps cached css for non-default themes", () => {
    localStorage.setItem("awakened-theme-id", "nightowl")
    localStorage.setItem("awakened-theme-css-light", "--background-base:#fff;")

    run()

    expect(document.documentElement.dataset.theme).toBe("nightowl")
    expect(document.getElementById("aw-theme-preload")?.textContent).toContain("--background-base:#fff;")
  })
})
