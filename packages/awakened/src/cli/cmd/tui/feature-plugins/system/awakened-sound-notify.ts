import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import type { Event } from "@awakened-ai/sdk/v2"
import notifier from "node-notifier"
import os from "os"

const id = "internal:awakened-sound-notify"

type SessionError = Extract<Event, { type: "session.error" }>["properties"]["error"]

function sessionErrorMessage(error: SessionError) {
  if (error?.name === "MessageAbortedError") return "Session aborted"
  const data = error?.data
  if (data && typeof data === "object" && "message" in data && data.message === "SSE read timed out") {
    return "Model stopped responding"
  }
  return "Session error"
}

function sendDesktopNotification(title: string, message: string) {
  const platform = os.type()
  let platformNotifier: any = notifier
  if (platform === "Windows_NT") {
    const { WindowsToaster } = notifier
    platformNotifier = new WindowsToaster({ withFallback: false })
  } else if (platform === "Linux" || platform.match(/BSD$/)) {
    const { NotifySend } = notifier
    platformNotifier = new NotifySend({ withFallback: false })
  }
  
  platformNotifier.notify({
    title,
    message,
    sound: true, // Let the OS play the default notification sound
  })
}

function notifyEvent(api: TuiPluginApi, sessionID: string | undefined, message: string) {
  const session = sessionID ? api.state.session.get(sessionID) : undefined
  const isSubagent = session?.parentID !== undefined
  
  // Don't spam desktop notifications for subagents
  if (isSubagent) return

  const title = session?.title ? `Awakening: ${session.title}` : "Awakening CLI"
  sendDesktopNotification(title, message)
}

const tui: TuiPlugin = async (api) => {
  const active = new Set<string>()
  const errored = new Set<string>()
  const questions = new Set<string>()
  const permissions = new Set<string>()

  api.event.on("question.asked", (event) => {
    if (questions.has(event.properties.id)) return
    questions.add(event.properties.id)
    notifyEvent(api, event.properties.sessionID, "Question needs input")
  })

  api.event.on("question.replied", (event) => {
    questions.delete(event.properties.requestID)
  })

  api.event.on("question.rejected", (event) => {
    questions.delete(event.properties.requestID)
  })

  api.event.on("permission.asked", (event) => {
    if (permissions.has(event.properties.id)) return
    permissions.add(event.properties.id)
    notifyEvent(api, event.properties.sessionID, "Permission needs input")
  })

  api.event.on("permission.replied", (event) => {
    permissions.delete(event.properties.requestID)
  })

  api.event.on("session.status", (event) => {
    const sessionID = event.properties.sessionID
    if (event.properties.status.type === "busy" || event.properties.status.type === "retry") {
      active.add(sessionID)
      errored.delete(sessionID)
      return
    }

    if (event.properties.status.type !== "idle") return
    if (!active.has(sessionID)) return
    active.delete(sessionID)

    if (errored.has(sessionID)) {
      errored.delete(sessionID)
      return
    }

    notifyEvent(api, sessionID, "Session done")
  })

  api.event.on("session.error", (event) => {
    const sessionID = event.properties.sessionID
    if (!sessionID) return
    if (!active.has(sessionID)) return
    errored.add(sessionID)
    notifyEvent(api, sessionID, sessionErrorMessage(event.properties.error))
  })
}

const plugin: InternalTuiPlugin = {
  id,
  tui,
}

export default plugin
