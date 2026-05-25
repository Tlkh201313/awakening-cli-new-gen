import type { MarketplaceSource } from "./types"

export const OFFICIAL_MARKETPLACES: Array<{
  name: string
  source: MarketplaceSource
  autoUpdate?: boolean
}> = [
  {
    name: "claude-plugins-official",
    source: { source: "github", repo: "anthropics/claude-plugins-official" },
    autoUpdate: true,
  },
  {
    name: "superpowers",
    source: { source: "github", repo: "obra/superpowers" },
    autoUpdate: true,
  },
]
