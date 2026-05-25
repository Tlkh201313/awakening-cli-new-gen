import { createMemo } from "solid-js"
import { BANNER_WIDTH } from "@/cli/banner"
import { createSimpleContext } from "./helper"
import { useKV } from "./kv"

export const HOME_STYLE_IDS = ["signature", "compact", "framed", "minimal"] as const
export type HomeStyleId = (typeof HOME_STYLE_IDS)[number]

export type HomeStyleDef = {
  title: string
  description: string
  status: "full" | "slim" | "inline"
  banner: "ascii" | "wordmark"
  tagline: boolean
  promptBorder: "round" | "square" | "awakened"
  frame: boolean
  startupFx: boolean
}

export const HOME_STYLES: Record<HomeStyleId, HomeStyleDef> = {
  signature: {
    title: "Signature",
    description: "Full wordmark, status panel, and tagline",
    status: "full",
    banner: "ascii",
    tagline: true,
    promptBorder: "awakened",
    frame: false,
    startupFx: true,
  },
  compact: {
    title: "Compact",
    description: "Wordmark with a slim status bar",
    status: "slim",
    banner: "ascii",
    tagline: false,
    promptBorder: "awakened",
    frame: false,
    startupFx: true,
  },
  framed: {
    title: "Framed",
    description: "Matching diamond borders on wordmark and prompt",
    status: "full",
    banner: "ascii",
    tagline: true,
    promptBorder: "awakened",
    frame: true,
    startupFx: true,
  },
  minimal: {
    title: "Minimal",
    description: "Text header with inline status",
    status: "inline",
    banner: "wordmark",
    tagline: false,
    promptBorder: "awakened",
    frame: false,
    startupFx: false,
  },
}

export function isHomeStyleId(value: string): value is HomeStyleId {
  return HOME_STYLE_IDS.includes(value as HomeStyleId)
}

export function homeLayout(width: number, style: HomeStyleDef) {
  const horizontalPadding = 4
  const contentWidth = Math.min(BANNER_WIDTH, Math.max(40, width - horizontalPadding))
  const narrow = width < BANNER_WIDTH + horizontalPadding
  const banner = narrow && style.banner === "ascii" ? "wordmark" : style.banner
  const promptMaxWidth = Math.min(Math.max(contentWidth, 48), width - horizontalPadding)

  return {
    contentWidth,
    promptMaxWidth,
    banner,
    narrow,
    horizontalPadding,
    gap: style.frame ? 0 : style.status === "inline" ? 1 : 1,
    showFrame: style.frame && banner === "ascii",
    showTagline: style.tagline && banner === "ascii",
    showStartupFx: style.startupFx,
    promptBorder: style.promptBorder,
    status: style.status,
  }
}

export const { use: useHomeStyle, provider: HomeStyleProvider } = createSimpleContext({
  name: "HomeStyle",
  init: () => {
    const kv = useKV()
    const styleId = createMemo(() => {
      const value = kv.get("home_style", "signature")
      return isHomeStyleId(value) ? value : "signature"
    })

    return {
      get selected() {
        return styleId()
      },
      current() {
        return HOME_STYLES[styleId()]
      },
      layout(width: number) {
        return homeLayout(width, HOME_STYLES[styleId()])
      },
      all() {
        return HOME_STYLES
      },
      set(id: HomeStyleId) {
        if (!isHomeStyleId(id)) return false
        kv.set("home_style", id)
        return true
      },
    }
  },
})
