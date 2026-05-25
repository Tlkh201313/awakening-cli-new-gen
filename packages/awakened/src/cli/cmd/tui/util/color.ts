import { RGBA } from "@opentui/core"
import { tint } from "@tui/context/theme"

export function fadeColor(color: RGBA, alpha: number) {
  return RGBA.fromValues(color.r, color.g, color.b, color.a * alpha)
}

export function fadeBackground(alpha: number, max = 150) {
  return RGBA.fromInts(0, 0, 0, Math.round(max * alpha))
}

export function activeRowSurface(accent: RGBA, base: RGBA, strength = 0.14) {
  return tint(base, accent, strength)
}

export function hoverSurface(base: RGBA, lift: RGBA, hover: boolean, strength = 0.08) {
  if (!hover) return base
  return tint(base, lift, strength)
}
