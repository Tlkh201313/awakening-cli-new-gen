import path from "path"
import type { TuiPluginApi } from "@awakened-ai/plugin/tui"
import { Process } from "@/util/process"

const awakenedPackageRoot = path.join(import.meta.dir, "../../../../../../")

export async function installVoiceDeps(api: TuiPluginApi) {
  try {
    const result = await Process.run(["bun", "run", "install-voice"], { cwd: awakenedPackageRoot })
    if (result.code !== 0) throw new Error(result.stderr?.toString().trim() || "install-voice failed")
    api.ui.toast({
      variant: "success",
      message: "Offline voice model ready",
      duration: 5000,
    })
  } catch (error) {
    api.ui.toast({
      variant: "error",
      message: error instanceof Error ? error.message : "Voice install failed",
      duration: 8000,
    })
  }
}
