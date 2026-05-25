import type { AssistantMessage } from "@awakened-ai/sdk/v2"
import type { TuiPlugin, TuiPluginApi } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { createMemo, Show } from "solid-js"
import { progressBar, SidebarSection } from "./shared"

const id = "internal:sidebar-context"

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function View(props: { api: TuiPluginApi; session_id: string }) {
  const theme = () => props.api.theme.current
  const msg = createMemo(() => props.api.state.session.messages(props.session_id))
  const session = createMemo(() => props.api.state.session.get(props.session_id))
  const cost = createMemo(() => session()?.cost ?? 0)

  const state = createMemo(() => {
    const last = msg().findLast((item): item is AssistantMessage => item.role === "assistant" && item.tokens.output > 0)
    if (!last) {
      return {
        tokens: 0,
        percent: null as number | null,
        limit: undefined as number | undefined,
      }
    }

    const tokens =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    const model = props.api.state.provider.find((item) => item.id === last.providerID)?.models[last.modelID]
    return {
      tokens,
      percent: model?.limit.context ? Math.round((tokens / model.limit.context) * 100) : null,
      limit: model?.limit.context,
    }
  })

  return (
    <SidebarSection title="Context" color={theme().text}>
      <text fg={theme().textMuted}>{state().tokens.toLocaleString()} tokens</text>
      <Show when={state().percent !== null}>
        <text fg={theme().textMuted}>
          {state().percent}% used{" "}
          <span style={{ fg: theme().primary }}>
            {progressBar(state().percent ?? 0, 100, 14)}
          </span>
        </text>
      </Show>
      <text fg={theme().textMuted}>{money.format(cost())} spent</text>
    </SidebarSection>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 100,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} session_id={props.session_id} />
      },
    },
  })
}

const plugin: InternalTuiPlugin = {
  id,
  tui,
}

export default plugin
