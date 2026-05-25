export type MarketplaceSource =
  | { source: "github"; repo: string; ref?: string; path?: string }
  | { source: "git"; url: string; ref?: string; path?: string }
  | { source: "url"; url: string }
  | { source: "file"; path: string }
  | { source: "directory"; path: string }

export type PluginEntrySource =
  | string
  | { source: "npm"; package: string }
  | { source: "github"; repo: string; ref?: string; path?: string }
  | { source: "git"; url: string; ref?: string; path?: string }
  | { source: "git-subdir"; url: string; path: string; ref?: string; sha?: string }
  | { source: "url"; url: string; ref?: string; sha?: string }

export type PluginMarketplaceEntry = {
  name: string
  description?: string
  category?: string
  tags?: string[]
  source: PluginEntrySource
}

export type PluginMarketplace = {
  name: string
  description?: string
  owner?: { name: string; email?: string }
  plugins: PluginMarketplaceEntry[]
}

export type KnownMarketplace = {
  source: MarketplaceSource
  installLocation?: string
  autoUpdate?: boolean
}

export type KnownMarketplacesFile = Record<string, KnownMarketplace>

export type LoadedMarketplace = {
  name: string
  marketplace: PluginMarketplace
  root: string
  source: MarketplaceSource
}

export type MarketplaceInstallResult =
  | { ok: true; spec: string; message: string; dir: string; tui: boolean }
  | { ok: false; message: string; unsupported?: boolean }
