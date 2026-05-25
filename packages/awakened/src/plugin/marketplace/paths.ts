import path from "path"
import { Global } from "@awakened-ai/core/global"

export function pluginsRoot() {
  return path.join(Global.Path.config, "plugins")
}

export function knownMarketplacesFile() {
  return path.join(pluginsRoot(), "known_marketplaces.json")
}

export function marketplacesCacheDir() {
  return path.join(pluginsRoot(), "marketplaces")
}

export function pluginSourceCacheDir(key: string) {
  return path.join(Global.Path.cache, "plugin-sources", key)
}

export function localMarketplacePluginDir(marketplace: string, name: string) {
  return path.join(pluginsRoot(), "installed", marketplace, name)
}
