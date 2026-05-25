import type { AssistantMessage } from "@awakened-ai/sdk/v2"
import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { TextAttributes } from "@opentui/core"
import { createMemo, Show } from "solid-js"
import { Locale } from "@/util/locale"

const id = "internal:usage"

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function sessionID(api: TuiPluginApi) {
  const route = api.route.current
  if (route.name !== "session" || !("params" in route)) return
  const sessionID = route.params?.sessionID
  return typeof sessionID === "string" ? sessionID : undefined
}

function DialogUsage(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current
  const id = createMemo(() => sessionID(props.api))
  const session = createMemo(() => {
    const value = id()
    if (!value) return
    return props.api.state.session.get(value)
  })
  const messages = createMemo(() => {
    const value = id()
    if (!value) return []
    return props.api.state.session.messages(value)
  })

  const context = createMemo(() => {
    const last = messages().findLast(
      (item): item is AssistantMessage => item.role === "assistant" && item.tokens.output > 0,
    )
    if (!last) return

    const tokens =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    if (tokens <= 0) return

    const model = props.api.state.provider.find((item) => item.id === last.providerID)?.models[last.modelID]
    return {
      tokens,
      limit: model?.limit.context,
      model: `${last.providerID}/${last.modelID}`,
      agent: last.agent,
    }
  })

  const totals = createMemo(() => {
    const s = session()
    if (!s?.tokens) return
    const t = s.tokens
    const all = t.input + t.output + t.reasoning + t.cache.read + t.cache.write
    if (all <= 0 && (s.cost ?? 0) <= 0) return
    return { ...t, all, cost: s.cost ?? 0 }
  })

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <text fg={theme().text} attributes={TextAttributes.BOLD}>
        Usage
      </text>
      <Show
        when={id()}
        fallback={<text fg={theme().textMuted}>Open a session to see token usage</text>}
      >
        <Show
          when={totals()}
          fallback={<text fg={theme().textMuted}>No usage recorded yet</text>}
        >
          {(item) => (
            <box gap={0}>
              <text fg={theme().text}>
                Session cost <span style={{ fg: theme().textMuted }}>{money.format(item().cost)}</span>
              </text>
              <text fg={theme().text}>
                Session tokens <span style={{ fg: theme().textMuted }}>{Locale.number(item().all)}</span>
              </text>
              <text fg={theme().textMuted}>Input {Locale.number(item().input)}</text>
              <text fg={theme().textMuted}>Output {Locale.number(item().output)}</text>
              <Show when={item().reasoning > 0}>
                <text fg={theme().textMuted}>Reasoning {Locale.number(item().reasoning)}</text>
              </Show>
              <Show when={item().cache.read > 0 || item().cache.write > 0}>
                <text fg={theme().textMuted}>
                  Cache read {Locale.number(item().cache.read)} · write {Locale.number(item().cache.write)}
                </text>
              </Show>
              <text fg={theme().textMuted}>{messages().length} messages</text>
            </box>
          )}
        </Show>
        <Show when={context()}>
          {(item) => {
            const limit = item().limit
            return (
              <box gap={0}>
                <text fg={theme().text} attributes={TextAttributes.BOLD}>
                  Context window
                </text>
                <text fg={theme().textMuted}>
                  {Locale.number(item().tokens)}
                  {limit ? ` (${Math.round((item().tokens / limit) * 100)}% of ${Locale.number(limit)})` : ""}
                </text>
                <text fg={theme().textMuted}>
                  {item().agent} · {item().model}
                </text>
              </box>
            )
          }}
        </Show>
        <text fg={theme().textMuted}>Run awakened stats for project-wide usage</text>
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.keymap.registerLayer({
    commands: [
      {
        name: "session.usage",
        title: "Session usage",
        desc: "Token and cost breakdown for the current session",
        category: "Session",
        namespace: "palette",
        slashName: "usage",
        slashAliases: ["cost", "tokens"],
        run() {
          api.ui.dialog.replace(() => <DialogUsage api={api} />)
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
