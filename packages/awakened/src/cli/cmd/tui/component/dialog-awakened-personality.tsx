import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { TextAttributes } from "@opentui/core"
import { reconcile } from "solid-js/store"
import { useTheme, selectedForeground } from "@tui/context/theme"
import { useDialog } from "@tui/ui/dialog"
import { DialogHeader } from "@tui/ui/dialog-chrome"
import { DialogButton } from "@tui/ui/dialog-chrome"
import { useSDK } from "@tui/context/sdk"
import { useSync } from "@tui/context/sync"
import { useProject } from "@tui/context/project"
import { useToast } from "@tui/ui/toast"
import { useBindings } from "@tui/keymap"
import type { Config } from "@awakened-ai/sdk/v2"
import { getActivePersonalityId } from "@/personality"
import * as PersonalityStore from "@/personality/store"
import type { PersonalityEntry } from "@/personality/store"
import { BorderedPanel, SectionTitle } from "../feature-plugins/sidebar/shared"

const DIALOG_MODE = "awakened-personality"

export function DialogAwakenedPersonality() {
  const dialog = useDialog()
  const sdk = useSDK()
  const sync = useSync()
  const project = useProject()
  const toast = useToast()
  const { theme } = useTheme()

  dialog.setSize("large")

  const [selected, setSelected] = createSignal(0)
  const [saving, setSaving] = createSignal(false)
  const [entries, setEntries] = createSignal<PersonalityEntry[]>([])
  const [loading, setLoading] = createSignal(true)

  const worktree = () => {
    const p = project.instance.path()
    return p.worktree || p.directory || process.cwd()
  }

  const activeId = createMemo(() =>
    getActivePersonalityId(sync.data.config as Parameters<typeof getActivePersonalityId>[0]),
  )

  createEffect(() => {
    void (async () => {
      setLoading(true)
      setEntries(await PersonalityStore.list(worktree()))
      setLoading(false)
    })()
  })

  const rows = createMemo(() => entries())

  async function setActive(id: string) {
    if (saving()) return
    setSaving(true)
    const active = id === "default" ? null : id
    try {
      const response = await sdk.client.config.update(
        {
          config: {
            ...sync.data.config,
            awakenedPersonality: {
              ...(sync.data.config as { awakenedPersonality?: Record<string, unknown> }).awakenedPersonality,
              active,
            },
          } as Config,
        },
        { throwOnError: true },
      )
      if (response.data) sync.set("config", reconcile(response.data))
      const label = entries().find((item) => item.id === id)?.name ?? id
      toast.show({ message: `Personality: ${label}`, variant: "success" })
      dialog.clear()
    } catch (error) {
      toast.error(error)
    } finally {
      setSaving(false)
    }
  }

  useBindings(() => ({
    mode: DIALOG_MODE,
    bindings: [
      { key: "up", desc: "Previous", group: "Personality", cmd: () => setSelected((value) => Math.max(0, value - 1)) },
      { key: "k", desc: "Previous", group: "Personality", cmd: () => setSelected((value) => Math.max(0, value - 1)) },
      {
        key: "down",
        desc: "Next",
        group: "Personality",
        cmd: () => setSelected((value) => Math.min(rows().length - 1, value + 1)),
      },
      {
        key: "j",
        desc: "Next",
        group: "Personality",
        cmd: () => setSelected((value) => Math.min(rows().length - 1, value + 1)),
      },
      {
        key: "return",
        desc: "Use personality",
        group: "Personality",
        cmd: () => {
          const row = rows()[selected()]
          if (!row) return
          void setActive(row.id)
        },
      },
      { key: "escape", desc: "Cancel", group: "Personality", cmd: () => dialog.clear() },
    ],
  }))

  const fg = () => selectedForeground(theme)

  return (
    <box gap={1} paddingBottom={1}>
      <box paddingLeft={3} paddingRight={3} gap={1}>
        <DialogHeader title="Personality" hint="Tone and communication style" />

        <BorderedPanel border={theme.borderSubtle} background={theme.backgroundPanel}>
          <SectionTitle title="Active" color={theme.accent} detail={activeId()} />
          <text fg={theme.textMuted} wrapMode="word">
            /personality use · generate · import · remove · edit · reset
          </text>
          <text fg={theme.textMuted} wrapMode="word">
            AI follows preset tone for replies; tools and accuracy unchanged
          </text>
        </BorderedPanel>
      </box>

      <Show when={!loading()} fallback={<text fg={theme.textMuted}>Loading personalities…</text>}>
        <box paddingLeft={2} paddingRight={2} gap={0}>
          <For each={rows()}>
            {(row, index) => {
              const active = () => row.id === activeId()
              const focused = () => index() === selected()
              return (
                <box
                  paddingLeft={1}
                  paddingRight={1}
                  backgroundColor={focused() ? theme.backgroundElement : undefined}
                  onMouseUp={() => void setActive(row.id)}
                >
                  <text
                    fg={active() ? theme.success : focused() ? fg() : theme.text}
                    attributes={active() || focused() ? TextAttributes.BOLD : TextAttributes.DIM}
                  >
                    {active() ? "● " : "  "}
                    {row.name}
                    <span style={{ fg: theme.textMuted }}> · {row.source}</span>
                  </text>
                  <text fg={theme.textMuted} wrapMode="word">
                    {row.description}
                  </text>
                </box>
              )
            }}
          </For>
        </box>
      </Show>

      <box paddingLeft={3} paddingRight={3} flexDirection="row" gap={2}>
        <DialogButton label="Use selected" onPress={() => void setActive(rows()[selected()]?.id ?? "default")} />
        <DialogButton label="Cancel" onPress={() => dialog.clear()} />
      </box>
    </box>
  )
}
