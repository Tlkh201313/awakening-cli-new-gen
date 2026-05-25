import { describe, expect, test } from "bun:test"
import {
  matchesAwakenedBrandDesign,
  matchesAwakenedDesignCapability,
  matchesStaticHtmlUi,
  matchesVisualDesignWork,
} from "../../../src/capabilities/triggers/design"
import { matchesFrameworkFrontend } from "../../../src/capabilities/triggers/frontend"

describe("design triggers", () => {
  test("matches static html website requests", () => {
    expect(matchesStaticHtmlUi("make html website in Downloads with only 1 html file")).toBe(true)
    expect(matchesStaticHtmlUi("build a landing page as a single html file")).toBe(true)
    expect(matchesStaticHtmlUi("create index.html with inline css")).toBe(true)
  })

  test("does not match unrelated html mentions", () => {
    expect(matchesStaticHtmlUi("parse html from the api response")).toBe(false)
    expect(matchesStaticHtmlUi("fix the html escaping in the serializer")).toBe(false)
  })

  test("matches awakened brand requests", () => {
    expect(matchesAwakenedBrandDesign("use awakened design tokens for the page")).toBe(true)
    expect(matchesAwakenedBrandDesign("match the v2 design system")).toBe(true)
  })

  test("matches visual design skill work", () => {
    expect(matchesVisualDesignWork("polish the ui and run an a11y audit")).toBe(true)
    expect(matchesVisualDesignWork("use @frontend-design for the hero section")).toBe(true)
  })

  test("aggregates awakened design capability", () => {
    expect(matchesAwakenedDesignCapability("make html website with awakened branding")).toBe(true)
  })
})

describe("frontend triggers", () => {
  test("matches framework work", () => {
    expect(matchesFrameworkFrontend("build a next.js component with tailwind")).toBe(true)
  })

  test("does not match static html-only requests", () => {
    expect(matchesFrameworkFrontend("make html website in Downloads")).toBe(false)
  })
})
