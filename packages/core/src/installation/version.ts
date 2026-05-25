declare global {
  const AWAKENED_VERSION: string
  const AWAKENED_CHANNEL: string
}

export const InstallationVersion = typeof AWAKENED_VERSION === "string" ? AWAKENED_VERSION : "local"
export const InstallationChannel = typeof AWAKENED_CHANNEL === "string" ? AWAKENED_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
