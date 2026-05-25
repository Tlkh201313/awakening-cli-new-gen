import type { ElectronAPI } from "../preload/types"

declare global {
  interface Window {
    api: ElectronAPI
    __AWAKENED__?: {
      deepLinks?: string[]
    }
  }
}
