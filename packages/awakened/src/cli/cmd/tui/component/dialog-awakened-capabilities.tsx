import { createMemo, createSignal, onMount } from "solid-js"
import { reconcile } from "solid-js/store"
import { useTheme } from "@tui/context/theme"
import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useSDK } from "@tui/context/sdk"
import { useSync } from "@tui/context/sync"
import { useToast } from "@tui/ui/toast"
import { AWAKENED_MODAL_MODE, useBindings } from "@tui/keymap"
import { ALL_AWAKENED_CAPABILITY_IDS, type AwakenedCapabilityId } from "@/capabilities/ids"
import { BUNDLED_AUTO_CAPABILITIES } from "@/capabilities/registry"
import {
  nextAwakenedTokenMode,
  normalizeAwakenedTokenMode,
  tokenModeLabel,
  type AwakenedTokenMode,
} from "@/capabilities/tokenMode"
import type { Config } from "@awakened-ai/sdk/v2"
import {
  nextWebSearchProviderPreference,
  webSearchProviderPreferenceLabel,
  type WebSearchProviderPreference,
} from "@/tool/websearch"
import * as fuzzysort from "fuzzysort"

const CATEGORY_ORDER = ["Settings", "Agent", "Skills", "Catalogs", "Engineering", "Domain"] as const

const CATEGORY_BY_ID: Record<AwakenedCapabilityId, Exclude<(typeof CATEGORY_ORDER)[number], "Settings">> = {
  "awakened-subagents": "Agent",
  "awakened-superpowers": "Agent",
  "awakened-memory": "Agent",
  "awakened-self-improvement": "Agent",
  "awakened-simplify": "Agent",
  "awakened-antigravity": "Skills",
  "awakened-productivity": "Skills",
  "awakened-graphify": "Skills",
  "awakened-context7": "Skills",
  "awakened-obsidian": "Skills",
  "awakened-cursor": "Catalogs",
  "awakened-composio": "Catalogs",
  "awakened-anthropic": "Catalogs",
  "awakened-vercel": "Catalogs",
  "awakened-github-awesome": "Catalogs",
  "awakened-design": "Engineering",
  "awakened-taste": "Engineering",
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
  "awakened-growth": "Domain",
  "awakened-dtc-marketing": "Domain",
  "awakened-business": "Domain",
  "awakened-security": "Domain",
  "awakened-docs": "Domain",
}

type SettingValue =
  | { kind: "token-mode" }
  | { kind: "auto-subagents" }
  | { kind: "auto-capabilities" }
  | { kind: "background-subagents" }
  | { kind: "warm-connection" }
  | { kind: "web-search" }

type OptionValue = SettingValue | { kind: "pack"; id: AwakenedCapabilityId }

export function DialogAwakenedCapabilities() {
  const dialog = useDialog()
  const sdk = useSDK()
  const sync = useSync()
  const toast = useToast()
  const { theme } = useTheme()
  onMount(() => {
    dialog.setSize("large")
  })

  const [query, setQuery] = createSignal("")
  const [saving, setSaving] = createSignal(false)

  const initialConfig = createMemo(() => {
    const config = sync.data.config as Config & {
      awakenedCapabilities?: {
        disabled?: string[]
        autoSubagents?: boolean
        autoCapabilities?: boolean
        backgroundSubagents?: boolean
        tokenMode?: AwakenedTokenMode
        warmConnection?: boolean
        webSearchProvider?: WebSearchProviderPreference
      }
    }
    return {
      disabled: new Set(config.awakenedCapabilities?.disabled ?? []),
      autoSubagents: config.awakenedCapabilities?.autoSubagents !== false,
      autoCapabilities: config.awakenedCapabilities?.autoCapabilities !== false,
      backgroundSubagents: config.awakenedCapabilities?.backgroundSubagents === true,
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
  const [backgroundSubagents, setBackgroundSubagents] = createSignal(initialConfig().backgroundSubagents)
  const [tokenMode, setTokenMode] = createSignal<AwakenedTokenMode>(initialConfig().tokenMode)
  const [warmConnection, setWarmConnection] = createSignal(initialConfig().warmConnection)
  const [webSearchProvider, setWebSearchProvider] = createSignal<WebSearchProviderPreference>(
    initialConfig().webSearchProvider,
  )

  const enabledSet = createMemo(() => new Set(enabled()))

  function toggle(id: AwakenedCapabilityId) {
    setEnabled((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      return [...current, id]
    })
  }

  function enableAll() {
    setEnabled([...ALL_AWAKENED_CAPABILITY_IDS])
  }

  function disableAll() {
    setEnabled([])
  }

  const dirty = createMemo(() => {
    const initial = new Set(initialEnabled())
    const current = enabledSet()
    if (initial.size !== current.size) return true
    for (const id of initial) if (!current.has(id)) return true
    if (autoSubagents() !== initialConfig().autoSubagents) return true
    if (autoCapabilities() !== initialConfig().autoCapabilities) return true
    if (backgroundSubagents() !== initialConfig().backgroundSubagents) return true
    if (tokenMode() !== initialConfig().tokenMode) return true
    if (warmConnection() !== initialConfig().warmConnection) return true
    if (webSearchProvider() !== initialConfig().webSearchProvider) return true
    return false
  })

  async function save() {
    if (saving() || !dirty()) return
    setSaving(true)
    try {
      const disabled = ALL_AWAKENED_CAPABILITY_IDS.filter((id) => !enabledSet().has(id))
      const response = await sdk.client.config.update(
        {
          config: {
            ...sync.data.config,
            awakenedCapabilities: {
              ...(sync.data.config as { awakenedCapabilities?: Record<string, unknown> }).awakenedCapabilities,
              disabled,
              autoSubagents: autoSubagents(),
              autoCapabilities: autoCapabilities(),
              backgroundSubagents: backgroundSubagents(),
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
        message: `Saved · ${enabled().length} packs · ${tokenModeLabel(tokenMode())}`,
        variant: "success",
      })
      dialog.clear()
    } catch (error) {
      toast.error(error)
    } finally {
      setSaving(false)
    }
  }

  function onSelect(value: OptionValue) {
    if (value.kind === "pack") {
      toggle(value.id)
      return
    }
    if (value.kind === "token-mode") {
      setTokenMode(nextAwakenedTokenMode(tokenMode()))
      return
    }
    if (value.kind === "auto-subagents") {
      setAutoSubagents((current) => !current)
      return
    }
    if (value.kind === "auto-capabilities") {
      setAutoCapabilities((current) => !current)
      return
    }
    if (value.kind === "background-subagents") {
      setBackgroundSubagents((current) => !current)
      return
    }
    if (value.kind === "warm-connection") {
      setWarmConnection((current) => !current)
      return
    }
    setWebSearchProvider(nextWebSearchProviderPreference(webSearchProvider()))
  }

  const options = createMemo(() => {
    const needle = query().trim()
    const settingOptions = [
      {
        value: { kind: "token-mode" } as OptionValue,
        title: `Token mode: ${tokenModeLabel(tokenMode())}`,
        description: "Cycle cost/speed preset",
        category: "Settings",
        footer: dirty() ? "unsaved" : undefined,
        onSelect: () => onSelect({ kind: "token-mode" }),
      },
      {
        value: { kind: "auto-subagents" } as OptionValue,
        title: "Auto subagents",
        description: autoSubagents() ? "On" : "Off",
        category: "Settings",
        gutter: () => <text fg={autoSubagents() ? theme.success : theme.textMuted}>{autoSubagents() ? "✓" : " "}</text>,
        onSelect: () => onSelect({ kind: "auto-subagents" }),
      },
      {
        value: { kind: "auto-capabilities" } as OptionValue,
        title: "Auto skills",
        description: autoCapabilities() ? "On" : "Off",
        category: "Settings",
        gutter: () => (
          <text fg={autoCapabilities() ? theme.success : theme.textMuted}>{autoCapabilities() ? "✓" : " "}</text>
        ),
        onSelect: () => onSelect({ kind: "auto-capabilities" }),
      },
      {
        value: { kind: "background-subagents" } as OptionValue,
        title: "Background subagents",
        description: backgroundSubagents() ? "On" : "Off",
        category: "Settings",
        gutter: () => (
          <text fg={backgroundSubagents() ? theme.success : theme.textMuted}>{backgroundSubagents() ? "✓" : " "}</text>
        ),
        onSelect: () => onSelect({ kind: "background-subagents" }),
      },
      {
        value: { kind: "warm-connection" } as OptionValue,
        title: "Keep-alive",
        description: warmConnection() ? "On" : "Off",
        category: "Settings",
        gutter: () => (
          <text fg={warmConnection() ? theme.success : theme.textMuted}>{warmConnection() ? "✓" : " "}</text>
        ),
        onSelect: () => onSelect({ kind: "warm-connection" }),
      },
      {
        value: { kind: "web-search" } as OptionValue,
        title: `Web search: ${webSearchProviderPreferenceLabel(webSearchProvider())}`,
        description: "Cycle research provider",
        category: "Settings",
        onSelect: () => onSelect({ kind: "web-search" }),
      },
    ]

    const packOptions = BUNDLED_AUTO_CAPABILITIES.map((cap) => ({
      value: { kind: "pack", id: cap.id } as OptionValue,
      title: cap.displayName,
      description: cap.description,
      category: CATEGORY_BY_ID[cap.id] ?? "Domain",
      gutter: () => (
        <text fg={enabledSet().has(cap.id) ? theme.success : theme.textMuted}>{enabledSet().has(cap.id) ? "✓" : " "}</text>
      ),
      onSelect: () => onSelect({ kind: "pack", id: cap.id }),
    }))

    const all = [...settingOptions, ...packOptions]
    if (!needle) return all
    return fuzzysort.go(needle, all, { keys: ["title", "description", "category"] }).map((result) => result.obj)
  })

  useBindings(() => ({
    mode: AWAKENED_MODAL_MODE,
    commands: [
      {
        name: "awakened.capabilities.save",
        title: "Save capability settings",
        category: "Dialog",
        disabled: !dirty() || saving(),
        run: () => {
          void save()
        },
      },
      {
        name: "awakened.capabilities.enable_all",
        title: "Enable all capability packs",
        category: "Dialog",
        run: enableAll,
      },
      {
        name: "awakened.capabilities.disable_all",
        title: "Disable all capability packs",
        category: "Dialog",
        run: disableAll,
      },
    ],
    bindings: [
      { key: "s", desc: "Save", group: "Awakened", cmd: "awakened.capabilities.save" },
      { key: "a", desc: "Enable all", group: "Awakened", cmd: "awakened.capabilities.enable_all" },
      { key: "n", desc: "Disable all", group: "Awakened", cmd: "awakened.capabilities.disable_all" },
    ],
  }))

  return (
    <DialogSelect<OptionValue>
      title="Awakened"
      placeholder="Search packs…"
      options={options()}
      onFilter={setQuery}
      flat={true}
      skipFilter={true}
      actions={[
        {
          command: "awakened.capabilities.save",
          title: "save",
          disabled: !dirty() || saving(),
          onTrigger: () => {
            void save()
          },
        },
        {
          command: "awakened.capabilities.enable_all",
          title: "all",
          onTrigger: enableAll,
        },
        {
          command: "awakened.capabilities.disable_all",
          title: "none",
          onTrigger: disableAll,
        },
      ]}
      footerHints={[
        { title: "return", label: "toggle", side: "left" },
        { title: "s", label: "save", side: "right" },
      ]}
    />
  )
}
