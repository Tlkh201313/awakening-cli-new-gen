import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { DialogAwakenedPersonality } from "../../component/dialog-awakened-personality"
import * as PersonalityStore from "@/personality/store"
import type { Config } from "@awakened-ai/sdk/v2"

const id = "internal:personality"

let apiRef: TuiPluginApi | undefined

function worktree(api: TuiPluginApi) {
  return api.state.path.worktree || api.state.path.directory || process.cwd()
}

function sessionID(api: TuiPluginApi) {
  const route = api.route.current
  if (route.name !== "session" || !("params" in route)) return
  const value = route.params?.sessionID
  return typeof value === "string" ? value : undefined
}

async function setActivePersonality(api: TuiPluginApi, id: string) {
  const active = id === "default" ? null : id
  const response = await api.client.config.update({
    config: {
      ...api.state.config,
      awakenedPersonality: {
        ...(api.state.config as { awakenedPersonality?: Record<string, unknown> }).awakenedPersonality,
        active,
      },
    } as Config,
  })
  if (response.error) {
    const message =
      typeof response.error === "object" && response.error !== null && "message" in response.error
        ? String((response.error as { message?: unknown }).message)
        : "Failed to update config"
    throw new Error(message)
  }
  const label = (await PersonalityStore.list(worktree(api))).find((item) => item.id === id)?.name ?? id
  api.ui.toast({ variant: "success", message: `Personality: ${label}` })
}

async function runGenerate(api: TuiPluginApi, description: string) {
  const sid = sessionID(api)
  if (!sid) {
    api.ui.toast({ variant: "error", message: "Open a session first, then run /personality generate …" })
    return
  }
  const session = api.state.session.get(sid)
  const agent = session?.agent ?? "build"
  const model = session?.model ? `${session.model.providerID}/${session.model.id}` : undefined
  await api.client.session.command({
    sessionID: sid,
    command: "personality-generate",
    arguments: description || "Create a helpful custom personality for this project",
    agent,
    model,
  })
  api.ui.toast({ variant: "info", message: "Generating personality…" })
  api.ui.dialog.clear()
}

export function dispatchPersonalitySlash(name: string, args?: string) {
  if (!apiRef) return false
  if (name !== "personality" && name !== "persona" && name !== "personality-mode") return false

  const api = apiRef
  const parts = (args ?? "").trim().split(/\s+/).filter(Boolean)
  const sub = parts[0]?.toLowerCase()
  const rest = parts.slice(1).join(" ")

  if (!sub) {
    api.ui.dialog.replace(() => <DialogAwakenedPersonality />)
    return true
  }

  if (sub === "list" || sub === "ls") {
    void PersonalityStore.list(worktree(api)).then((items) => {
      const active = (api.state.config as { awakenedPersonality?: { active?: string | null } }).awakenedPersonality
        ?.active
      const lines = items.map((item) => `${item.id === (active ?? "default") ? "●" : " "} ${item.id} — ${item.name}`)
      api.ui.toast({ variant: "info", message: lines.slice(0, 8).join("\n"), duration: 8000 })
    })
    return true
  }

  if (sub === "use" || sub === "set" || sub === "apply") {
    const id = parts[1]
    if (!id) {
      api.ui.dialog.replace(() => <DialogAwakenedPersonality />)
      return true
    }
    void setActivePersonality(api, id).catch((error) => {
      api.ui.toast({ variant: "error", message: error instanceof Error ? error.message : String(error) })
    })
    return true
  }

  if (sub === "reset" || sub === "clear" || sub === "default") {
    void setActivePersonality(api, "default").catch((error) => {
      api.ui.toast({ variant: "error", message: error instanceof Error ? error.message : String(error) })
    })
    return true
  }

  if (sub === "generate" || sub === "gen" || sub === "create") {
    void runGenerate(api, rest).catch((error) => {
      api.ui.toast({ variant: "error", message: error instanceof Error ? error.message : String(error) })
    })
    return true
  }

  if (sub === "import" || sub === "add") {
    const source = rest || parts.slice(1).join(" ")
    if (!source) {
      api.ui.dialog.replace(() => (
        <api.ui.DialogPrompt
          title="Import personality"
          placeholder="path/to/personality.md"
          onConfirm={(value) => {
            void PersonalityStore.importFile(worktree(api), value.trim())
              .then((saved) => {
                api.ui.toast({ variant: "success", message: `Imported ${saved.id}` })
                void setActivePersonality(api, saved.id)
              })
              .catch((error) => {
                api.ui.toast({ variant: "error", message: error instanceof Error ? error.message : String(error) })
              })
          }}
          onCancel={() => api.ui.dialog.clear()}
        />
      ))
      return true
    }
    void PersonalityStore.importFile(worktree(api), source)
      .then((saved) => {
        api.ui.toast({ variant: "success", message: `Imported ${saved.id}` })
        return setActivePersonality(api, saved.id)
      })
      .catch((error) => {
        api.ui.toast({ variant: "error", message: error instanceof Error ? error.message : String(error) })
      })
    return true
  }

  if (sub === "remove" || sub === "rm" || sub === "delete") {
    const id = parts[1]
    if (!id) {
      api.ui.toast({ variant: "error", message: "Usage: /personality remove <id>" })
      return true
    }
    void PersonalityStore.removeCustom(worktree(api), id)
      .then((removed) => {
        if (!removed) {
          api.ui.toast({ variant: "error", message: `No custom personality: ${id}` })
          return
        }
        api.ui.toast({ variant: "success", message: `Removed ${id}` })
      })
      .catch((error) => {
        api.ui.toast({ variant: "error", message: error instanceof Error ? error.message : String(error) })
      })
    return true
  }

  if (sub === "edit" || sub === "open") {
    const id = parts[1]
    if (!id) {
      api.ui.toast({ variant: "error", message: "Usage: /personality edit <id>" })
      return true
    }
    const path = PersonalityStore.customPath(worktree(api), id)
    api.ui.toast({
      variant: "info",
      message: `Edit custom personality:\n${path}\n(builtins: edit via /personality generate)`,
      duration: 8000,
    })
    return true
  }

  if (sub === "help" || sub === "?") {
    api.ui.toast({
      variant: "info",
      message:
        "/personality · use · list · generate · import · remove · edit · reset\nAliases: /persona /personality-mode",
      duration: 8000,
    })
    return true
  }

  void setActivePersonality(api, sub).catch(() => {
    api.ui.dialog.replace(() => <DialogAwakenedPersonality />)
  })
  return true
}

const tui: TuiPlugin = async (api) => {
  apiRef = api
  api.keymap.registerLayer({
    commands: [
      {
        name: "personality.show",
        title: "Awakened personality",
        desc: "Choose communication tone and style",
        category: "Session",
        namespace: "palette",
        slashName: "personality",
        slashAliases: ["persona", "personality-mode"],
        run() {
          api.ui.dialog.replace(() => <DialogAwakenedPersonality />)
        },
      },
    ],
  })
}

const plugin: InternalTuiPlugin = {
  id,
  tui,
}

export default plugin
