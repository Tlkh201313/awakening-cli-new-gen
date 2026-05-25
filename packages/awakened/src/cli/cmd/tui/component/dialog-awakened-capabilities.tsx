import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { InputRenderable, ScrollBoxRenderable, TextAttributes } from "@opentui/core"
import { useRenderer, useTerminalDimensions } from "@opentui/solid"
import { reconcile } from "solid-js/store"
import { useTheme, selectedForeground, tint } from "@tui/context/theme"
import { useDialog } from "@tui/ui/dialog"
import { DialogHeader } from "@tui/ui/dialog-chrome"
import { DialogButton } from "@tui/ui/dialog-chrome"
import { SquarePromptBorder } from "@tui/component/border"
import { useSDK } from "@tui/context/sdk"
import { useSync } from "@tui/context/sync"
import { useToast } from "@tui/ui/toast"
import { useAwakenedModeStack, useBindings } from "@tui/keymap"
import { ALL_AWAKENED_CAPABILITY_IDS, type AwakenedCapabilityId } from "@/capabilities/ids"
import { BUNDLED_AUTO_CAPABILITIES } from "@/capabilities/registry"
import {
  AWAKENED_TOKEN_MODES,
  nextAwakenedTokenMode,
  normalizeAwakenedTokenMode,
  tokenModeLabel,
  type AwakenedTokenMode,
} from "@/capabilities/tokenMode"
import type { Config } from "@awakened-ai/sdk/v2"
import { getScrollAcceleration } from "../util/scroll"
import { useTuiConfig } from "../context/tui-config"
import { Locale } from "@/util/locale"
import { FadeIn } from "../util/motion"
import { useKV } from "../context/kv"
import { createDelayedFadeIn } from "../util/signal"
import {
  BorderedPanel,
  MiniToggle,
  ModeHint,
  SectionTitle,
  StatStrip,
  tokenModeColor,
} from "../feature-plugins/sidebar/shared"
import {
  nextWebSearchProviderPreference,
  webSearchProviderPreferenceLabel,
  type WebSearchProviderPreference,
} from "@/tool/websearch"

const DIALOG_MODE = "awakened-capabilities"

type CapabilityRow = {
  id: AwakenedCapabilityId
  title: string
  description: string
  category: string
}

const CATEGORY_ORDER = ["Agent", "Skills", "Catalogs", "Engineering", "Domain"] as const

const CATEGORY_BY_ID: Record<AwakenedCapabilityId, (typeof CATEGORY_ORDER)[number]> = {
  "awakened-subagents": "Agent",
  "awakened-superpowers": "Agent",
  "awakened-memory": "Agent",
  "awakened-simplify": "Agent",
  "awakened-antigravity": "Skills",
  "awakened-productivity": "Skills",
  "awakened-graphify": "Skills",
  "awakened-context7": "Skills",
  "awakened-cursor": "Catalogs",
  "awakened-composio": "Catalogs",
  "awakened-anthropic": "Catalogs",
  "awakened-vercel": "Catalogs",
  "awakened-github-awesome": "Catalogs",
  "awakened-design": "Engineering",
  "awakened-devops": "Catalogs",
  "awakened-ai-ml": "Catalogs",
  "awakened-mcp-skills": "Catalogs",
  "awakened-claude-plugins": "Catalogs",
  "awakened-testing": "Engineering",
  "awakened-codereview": "Engineering",
  "awakened-frontend": "Engineering",
  "awakened-devtools": "Engineering",
  "awakened-aws": "Engineering",
  "awakened-browser": "Engineering",
  "awakened-research": "Domain",
  "awakened-marketing": "Domain",
  "awakened-security": "Domain",
  "awakened-docs": "Domain",
}

export function DialogAwakenedCapabilities() {
  const dialog = useDialog()
  const sdk = useSDK()
  const sync = useSync()
  const toast = useToast()
  const { theme } = useTheme()
  const renderer = useRenderer()
  const modeStack = useAwakenedModeStack()
  const tuiConfig = useTuiConfig()
  const kv = useKV()
  const dimensions = useTerminalDimensions()
  const scrollAcceleration = createMemo(() => getScrollAcceleration(tuiConfig))
  const animations = () => kv.get("animations_enabled", true)

  dialog.setSize("large")

  const [selected, setSelected] = createSignal(0)
  const [saving, setSaving] = createSignal(false)
  const [filter, setFilter] = createSignal("")
  const [ready, setReady] = createSignal(false)
  const panelAlpha = createDelayedFadeIn(ready, animations, 60, 180)
  const listAlpha = createDelayedFadeIn(ready, animations, 120, 200)

  onMount(() => {
    setReady(true)
    const popMode = modeStack.push(DIALOG_MODE)
    onCleanup(popMode)
  })

  const initialConfig = createMemo(() => {
    const config = sync.data.config as Config & {
      awakenedCapabilities?: {
        disabled?: string[]
        autoSubagents?: boolean
        autoCapabilities?: boolean
        tokenMode?: AwakenedTokenMode
        warmConnection?: boolean
        webSearchProvider?: WebSearchProviderPreference
      }
    }
    return {
      disabled: new Set(config.awakenedCapabilities?.disabled ?? []),
      autoSubagents: config.awakenedCapabilities?.autoSubagents !== false,
      autoCapabilities: config.awakenedCapabilities?.autoCapabilities !== false,
      tokenMode: normalizeAwakenedTokenMode(config.awakenedCapabilities?.tokenMode),
      warmConnection: config.awakenedCapabilities?.warmConnection !== false,
      webSearchProvider: (config.awakenedCapabilities?.webSearchProvider ?? "auto") as WebSearchProviderPreference,
    }
  })

  const initialEnabled = createMemo(() =>
    ALL_AWAKENED_CAPABILITY_IDS.filter((id) => !initialConfig().disabled.has(id)),
  )

  const [enabled, setEnabled] = createSignal<AwakenedCapabilityId[]>(initialEnabled())
  const [autoSubagents, setAutoSubagents] = createSignal(initialConfig().autoSubagents)
  const [autoCapabilities, setAutoCapabilities] = createSignal(initialConfig().autoCapabilities)
  const [tokenMode, setTokenMode] = createSignal<AwakenedTokenMode>(initialConfig().tokenMode)
  const [warmConnection, setWarmConnection] = createSignal(initialConfig().warmConnection)
  const [webSearchProvider, setWebSearchProvider] = createSignal<WebSearchProviderPreference>(
    initialConfig().webSearchProvider,
  )

  const rows = createMemo<CapabilityRow[]>(() =>
    BUNDLED_AUTO_CAPABILITIES.map((cap) => ({
      id: cap.id,
      title: cap.displayName,
      description: cap.description,
      category: CATEGORY_BY_ID[cap.id] ?? "Domain",
    })),
  )

  const filtered = createMemo(() => {
    const needle = filter().trim().toLowerCase()
    if (!needle) return rows()
    return rows().filter(
      (row) =>
        row.title.toLowerCase().includes(needle) ||
        row.description.toLowerCase().includes(needle) ||
        row.category.toLowerCase().includes(needle),
    )
  })

  const grouped = createMemo(() => {
    const map = new Map<string, CapabilityRow[]>()
    for (const row of filtered()) {
      const list = map.get(row.category) ?? []
      list.push(row)
      map.set(row.category, list)
    }
    return CATEGORY_ORDER.flatMap((category) => {
      const items = map.get(category)
      if (!items?.length) return []
      return [[category, items] as const]
    })
  })

  const flat = createMemo(() => grouped().flatMap(([_, items]) => items))

  const enabledCount = createMemo(() => enabled().length)
  const dirty = createMemo(() => {
    const initial = new Set(initialEnabled())
    const current = new Set(enabled())
    if (initial.size !== current.size) return true
    for (const id of initial) if (!current.has(id)) return true
    if (autoSubagents() !== initialConfig().autoSubagents) return true
    if (autoCapabilities() !== initialConfig().autoCapabilities) return true
    if (tokenMode() !== initialConfig().tokenMode) return true
    if (warmConnection() !== initialConfig().warmConnection) return true
    if (webSearchProvider() !== initialConfig().webSearchProvider) return true
    return false
  })

  const listHeight = createMemo(() =>
    Math.min(flat().length + grouped().length + 2, Math.max(8, Math.floor(dimensions().height / 2) - 10)),
  )

  const categoryStats = createMemo(() => {
    const enabledSet = new Set(enabled())
    return Object.fromEntries(
      CATEGORY_ORDER.map((category) => {
        const items = rows().filter((row) => row.category === category)
        const on = items.filter((row) => enabledSet.has(row.id)).length
        return [category, { on, total: items.length }]
      }),
    ) as Record<(typeof CATEGORY_ORDER)[number], { on: number; total: number }>
  })

  let scroll: ScrollBoxRenderable | undefined
  let filterInput: InputRenderable

  function isPicked(id: AwakenedCapabilityId) {
    return enabled().includes(id)
  }

  function toggle(id: AwakenedCapabilityId) {
    if (isPicked(id)) {
      setEnabled(enabled().filter((item) => item !== id))
      return
    }
    setEnabled([...enabled(), id])
  }

  function enableAll() {
    setEnabled([...ALL_AWAKENED_CAPABILITY_IDS])
  }

  function disableAll() {
    setEnabled([])
  }

  function moveTo(index: number) {
    const list = flat()
    if (!list.length) return
    const next = ((index % list.length) + list.length) % list.length
    setSelected(next)
    if (!scroll) return
    const target = scroll.getChildren().find((child: { id?: string }) => child.id === list[next]?.id)
    if (!target) return
    const y = target.y - scroll.y
    if (y >= scroll.height) scroll.scrollBy(y - scroll.height + 1)
    if (y < 0) scroll.scrollBy(y)
  }

  async function save() {
    if (saving()) return
    setSaving(true)
    const disabled = ALL_AWAKENED_CAPABILITY_IDS.filter((id) => !enabled().includes(id))
    try {
      const response = await sdk.client.config.update(
        {
          config: {
            ...sync.data.config,
            awakenedCapabilities: {
              ...(sync.data.config as { awakenedCapabilities?: Record<string, unknown> }).awakenedCapabilities,
              disabled,
              autoSubagents: autoSubagents(),
              autoCapabilities: autoCapabilities(),
              tokenMode: tokenMode(),
              warmConnection: warmConnection(),
              webSearchProvider: webSearchProvider(),
            },
          } as Config,
        },
        { throwOnError: true },
      )
      if (response.data) sync.set("config", reconcile(response.data))
      toast.show({
        message: `Saved · ${enabledCount()} packs · ${tokenModeLabel(tokenMode())}`,
        variant: "success",
      })
      dialog.clear()
    } catch (error) {
      toast.error(error)
    } finally {
      setSaving(false)
    }
  }

  useBindings(() => ({
    mode: DIALOG_MODE,
    commands: [
      {
        name: "awakened.capabilities.save",
        title: "Save capability settings",
        category: "System",
        run() {
          void save()
        },
      },
      {
        name: "awakened.capabilities.enable_all",
        title: "Enable all capability packs",
        category: "System",
        run: enableAll,
      },
      {
        name: "awakened.capabilities.disable_all",
        title: "Disable all capability packs",
        category: "System",
        run: disableAll,
      },
    ],
    bindings: [
      { key: "up", desc: "Previous pack", group: "Awakened", cmd: () => moveTo(selected() - 1) },
      { key: "k", desc: "Previous pack", group: "Awakened", cmd: () => moveTo(selected() - 1) },
      { key: "down", desc: "Next pack", group: "Awakened", cmd: () => moveTo(selected() + 1) },
      { key: "j", desc: "Next pack", group: "Awakened", cmd: () => moveTo(selected() + 1) },
      {
        key: "space",
        desc: "Toggle pack",
        group: "Awakened",
        cmd: () => {
          const row = flat()[selected()]
          if (!row) return
          toggle(row.id)
        },
      },
      { key: "a", desc: "Enable all", group: "Awakened", cmd: enableAll },
      { key: "n", desc: "Disable all", group: "Awakened", cmd: disableAll },
      { key: "m", desc: "Cycle token mode", group: "Awakened", cmd: () => setTokenMode(nextAwakenedTokenMode(tokenMode())) },
      { key: "s", desc: "Toggle auto subagents", group: "Awakened", cmd: () => setAutoSubagents((value) => !value) },
      { key: "c", desc: "Toggle auto skills", group: "Awakened", cmd: () => setAutoCapabilities((value) => !value) },
      { key: "w", desc: "Toggle keep-alive", group: "Awakened", cmd: () => setWarmConnection((value) => !value) },
      {
        key: "r",
        desc: "Cycle web search provider",
        group: "Awakened",
        cmd: () => setWebSearchProvider(nextWebSearchProviderPreference(webSearchProvider())),
      },
      { key: "return", desc: "Save", group: "Awakened", cmd: () => void save() },
      { key: "escape", desc: "Cancel", group: "Awakened", cmd: () => dialog.clear() },
    ],
  }))

  const fg = () => selectedForeground(theme)

  return (
    <box gap={1} paddingBottom={1}>
      <box paddingLeft={3} paddingRight={3} gap={1}>
        <DialogHeader title="✦ Awakened" hint="Packs · tools · cost · speed" />

        <FadeIn delay={40} duration={180}>
          <box opacity={panelAlpha()}>
            <BorderedPanel border={theme.borderSubtle} background={theme.backgroundPanel}>
              <StatStrip enabled={enabledCount()} total={ALL_AWAKENED_CAPABILITY_IDS.length} dirty={dirty()} theme={theme} />
            </BorderedPanel>
          </box>
        </FadeIn>

        <FadeIn delay={70} duration={180}>
          <box opacity={panelAlpha()}>
            <BorderedPanel border={theme.borderSubtle} background={theme.backgroundPanel}>
              <SectionTitle title="Cost & speed" color={theme.accent} detail="m · s · c · w · r" />
              <box flexDirection="row" gap={1} flexWrap="wrap">
                <For each={AWAKENED_TOKEN_MODES}>
                  {(mode) => {
                    const active = () => tokenMode() === mode
                    return (
                      <box
                        paddingLeft={1}
                        paddingRight={1}
                        backgroundColor={active() ? tint(tokenModeColor(mode, theme), theme.backgroundElement, 0.65) : undefined}
                        border={active() ? SquarePromptBorder.border : undefined}
                        borderColor={active() ? tokenModeColor(mode, theme) : undefined}
                        customBorderChars={SquarePromptBorder.customBorderChars}
                        onMouseUp={() => setTokenMode(mode)}
                      >
                        <text
                          fg={active() ? tokenModeColor(mode, theme) : theme.textMuted}
                          attributes={active() ? TextAttributes.BOLD : TextAttributes.DIM}
                        >
                          {tokenModeLabel(mode)}
                        </text>
                      </box>
                    )
                  }}
                </For>
              </box>
              <ModeHint mode={tokenMode()} theme={theme} />
              <box flexDirection="row" gap={1} flexWrap="wrap" paddingTop={0}>
                <MiniToggle
                  label="Subagents"
                  hotkey="s"
                  on={autoSubagents()}
                  theme={theme}
                  onPress={() => setAutoSubagents((value) => !value)}
                />
                <MiniToggle
                  label="Auto skills"
                  hotkey="c"
                  on={autoCapabilities()}
                  theme={theme}
                  onPress={() => setAutoCapabilities((value) => !value)}
                />
                <MiniToggle
                  label="Keep-alive"
                  hotkey="w"
                  on={warmConnection()}
                  theme={theme}
                  onPress={() => setWarmConnection((value) => !value)}
                />
              </box>
            </BorderedPanel>
          </box>
        </FadeIn>

        <FadeIn delay={80} duration={180}>
          <box opacity={panelAlpha()}>
            <BorderedPanel border={theme.borderSubtle} background={theme.backgroundPanel}>
              <SectionTitle title="Research tools" color={theme.accent} detail="r to cycle" />
              <box flexDirection="row" gap={1} flexWrap="wrap">
                <For each={["auto", "exa", "parallel"] as const}>
                  {(provider) => {
                    const active = () => webSearchProvider() === provider
                    return (
                      <box
                        paddingLeft={1}
                        paddingRight={1}
                        backgroundColor={active() ? tint(theme.accent, theme.backgroundElement, 0.65) : undefined}
                        border={active() ? SquarePromptBorder.border : undefined}
                        borderColor={active() ? theme.accent : undefined}
                        customBorderChars={SquarePromptBorder.customBorderChars}
                        onMouseUp={() => setWebSearchProvider(provider)}
                      >
                        <text
                          fg={active() ? theme.accent : theme.textMuted}
                          attributes={active() ? TextAttributes.BOLD : TextAttributes.DIM}
                        >
                          {webSearchProviderPreferenceLabel(provider)}
                        </text>
                      </box>
                    )
                  }}
                </For>
              </box>
              <text fg={theme.textMuted} attributes={TextAttributes.DIM} wrapMode="word">
                Web search defaults to fast mode with automatic provider fallback. Auto picks a stable Exa/Parallel mix per session.
              </text>
            </BorderedPanel>
          </box>
        </FadeIn>

        <FadeIn delay={90} duration={180}>
          <box paddingTop={0}>
            <input
              onInput={(value) => {
                setFilter(value)
                moveTo(0)
              }}
              focusedBackgroundColor={theme.backgroundPanel}
              cursorColor={theme.primary}
              focusedTextColor={theme.text}
              ref={(r) => {
                filterInput = r
                filterInput.traits = { status: "FILTER" }
                setTimeout(() => {
                  if (!filterInput?.isDestroyed) filterInput.focus()
                }, 1)
              }}
              placeholder="Filter capability packs…"
              placeholderColor={theme.textMuted}
            />
          </box>
        </FadeIn>
      </box>

      <Show
        when={flat().length > 0}
        fallback={
          <box paddingLeft={4} paddingRight={4} paddingTop={1}>
            <text fg={theme.textMuted}>No packs match your filter</text>
          </box>
        }
      >
        <scrollbox
          paddingLeft={1}
          paddingRight={1}
          opacity={listAlpha()}
          scrollbarOptions={{ visible: false }}
          scrollAcceleration={scrollAcceleration()}
          ref={(r: ScrollBoxRenderable) => (scroll = r)}
          maxHeight={listHeight()}
        >
          <For each={grouped()}>
            {([category, items], groupIndex) => (
              <box gap={0}>
                <box paddingTop={groupIndex() > 0 ? 1 : 0} paddingLeft={3} paddingRight={3} flexDirection="row" gap={2}>
                  <text fg={theme.accent} attributes={TextAttributes.BOLD}>
                    {category}
                  </text>
                  <text fg={theme.textMuted} attributes={TextAttributes.DIM}>
                    {categoryStats()[category]?.on ?? 0}/{categoryStats()[category]?.total ?? 0}
                  </text>
                </box>
                <For each={items}>
                  {(row) => {
                    const index = () => flat().findIndex((item) => item.id === row.id)
                    const active = () => index() === selected()
                    const picked = () => isPicked(row.id)
                    const changed = () => picked() !== initialEnabled().includes(row.id)
                    return (
                      <box
                        id={row.id}
                        flexDirection="row"
                        paddingLeft={2}
                        paddingRight={3}
                        gap={1}
                        backgroundColor={active() ? theme.backgroundElement : undefined}
                        border={active() ? ["left"] : undefined}
                        borderColor={active() ? theme.primary : undefined}
                        onMouseOver={() => setSelected(index())}
                        onMouseUp={() => {
                          if (renderer.getSelection()?.getSelectedText()) return
                          toggle(row.id)
                        }}
                      >
                        <text flexShrink={0} fg={active() ? fg() : picked() ? theme.success : theme.textMuted}>
                          {picked() ? "✓" : "○"}
                        </text>
                        <box flexGrow={1}>
                          <text
                            fg={active() ? fg() : picked() ? theme.text : theme.textMuted}
                            attributes={active() ? TextAttributes.BOLD : undefined}
                          >
                            {Locale.truncate(row.title, 44)}
                            <Show when={changed()}>
                              <span style={{ fg: theme.warning }}> •</span>
                            </Show>
                          </text>
                          <text fg={active() ? tint(theme.textMuted, theme.secondary, 0.45) : theme.textMuted} attributes={TextAttributes.DIM}>
                            {Locale.truncate(row.description, 68)}
                          </text>
                        </box>
                      </box>
                    )
                  }}
                </For>
              </box>
            )}
          </For>
        </scrollbox>
      </Show>

      <box
        paddingLeft={3}
        paddingRight={3}
        paddingTop={1}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        border={SquarePromptBorder.border}
        borderColor={theme.borderSubtle}
        customBorderChars={SquarePromptBorder.customBorderChars}
        opacity={panelAlpha()}
      >
        <box flexDirection="column" gap={0}>
          <text fg={theme.textMuted}>
            <span style={{ fg: theme.text, bold: true }}>↑↓</span> move · <span style={{ fg: theme.text, bold: true }}>space</span> toggle ·{" "}
            <span style={{ fg: theme.text, bold: true }}>a</span>/<span style={{ fg: theme.text, bold: true }}>n</span> all/none
          </text>
          <text fg={theme.textMuted} attributes={TextAttributes.DIM}>
            Settings: m mode · s subagents · c skills · w keep-alive · r search
          </text>
        </box>
        <box flexDirection="row" gap={1}>
          <DialogButton label="cancel" onPress={() => dialog.clear()} delay={110} />
          <DialogButton
            label={saving() ? "Saving…" : dirty() ? "save ●" : "save"}
            active={!saving()}
            onPress={() => {
              if (saving()) return
              void save()
            }}
            delay={130}
          />
        </box>
      </box>
    </box>
  )
}
