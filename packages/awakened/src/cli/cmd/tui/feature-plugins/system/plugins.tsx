import type { TuiPlugin, TuiPluginApi, TuiPluginStatus } from "@awakened-ai/plugin/tui"
import type { InternalTuiPlugin } from "../../plugin/internal"
import { useTerminalDimensions } from "@opentui/solid"
import { fileURLToPath } from "url"
import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import { Show, Switch, Match, createEffect, createMemo, createSignal, For, onMount } from "solid-js"
import { useBindings } from "../../keymap"
import { ensureDefaultMarketplaces, loadAllMarketplaces, parseMarketplaceInput, addMarketplace, loadMarketplace, removeMarketplace, updateMarketplace, type LoadedMarketplace } from "@/plugin/marketplace"
import { Locale } from "@/util/locale"
import { Spinner } from "@tui/component/spinner"

const id = "internal:plugin-manager"

let pluginApi: TuiPluginApi | undefined

export function dispatchPluginSlash(name: string, args?: string) {
  if (!pluginApi) return false
  if (name !== "plugin" && name !== "plugins" && name !== "marketplace") return false
  handlePluginSlash(pluginApi, args)
  return true
}

function handlePluginSlash(api: TuiPluginApi, raw?: string) {
  const parts = (raw ?? "").trim().split(/\s+/).filter(Boolean)
  const sub = parts[0]?.toLowerCase()
  const rest = parts.slice(1).join(" ")

  if (!sub) {
    showHub(api)
    return
  }

  if (sub === "install" || sub === "i") {
    if (rest) {
      void installSpec(api, rest)
      return
    }
    showInstall(api)
    return
  }

  if (sub === "marketplace" || sub === "market") {
    const action = parts[1]?.toLowerCase()
    const source = parts.slice(2).join(" ")
    if (action === "add" && source) {
      void addMarketplaceFromSource(api, source)
      return
    }
    if (action === "update") {
      void updateMarketplace(parts[2]).then((out) => {
        for (const item of out) {
          api.ui.toast({
            variant: item.ok ? "success" : "error",
            message: item.ok ? item.message : `${item.name}: ${item.message}`,
          })
        }
        showHub(api)
      })
      return
    }
    showMarketplace(api)
    return
  }

  if (sub === "manage" || sub === "list" || sub === "ls") {
    show(api)
    return
  }

  showHub(api)
}

async function installSpec(api: TuiPluginApi, spec: string) {
  const out = await api.plugins.install(spec)
  if (!out.ok) {
    api.ui.toast({ variant: "error", message: out.message })
    return
  }
  api.ui.toast({ variant: "success", message: `Installed ${spec}` })
  if (out.tui) {
    await api.plugins.add(spec)
  }
  show(api)
}

async function addMarketplaceFromSource(api: TuiPluginApi, source: string) {
  const parsed = await parseMarketplaceInput(source)
  if (!parsed) {
    api.ui.toast({ variant: "error", message: `Unrecognized marketplace source: ${source}` })
    return
  }
  if ("error" in parsed) {
    api.ui.toast({ variant: "error", message: parsed.error })
    return
  }

  const temp = `__temp-${Date.now()}`
  await addMarketplace(temp, parsed)
  const manifest = await loadMarketplace(temp, true)
  await removeMarketplace(temp)
  if ("error" in manifest) {
    api.ui.toast({ variant: "error", message: manifest.error })
    return
  }

  const added = await addMarketplace(manifest.marketplace.name, parsed)
  if (!added.ok) {
    api.ui.toast({ variant: "error", message: added.message })
    return
  }

  api.ui.toast({
    variant: "success",
    message: `Added marketplace "${manifest.marketplace.name}" (${manifest.marketplace.plugins.length} plugins)`,
  })
  showMarketplace(api)
}

function PluginHub(props: { api: TuiPluginApi }) {
  const rows = createMemo<DialogSelectOption<string>[]>(() => [
    {
      title: "Manage installed plugins",
      value: "manage",
      description: "Toggle plugins on or off",
      category: "Plugins",
    },
    {
      title: "Install plugin",
      value: "install",
      description: "npm package or name@marketplace",
      category: "Plugins",
    },
    {
      title: "Browse marketplaces",
      value: "marketplace",
      description: "Claude Code-compatible catalogs",
      category: "Marketplace",
    },
    {
      title: "Add marketplace",
      value: "marketplace-add",
      description: "owner/repo, URL, or local path",
      category: "Marketplace",
    },
    {
      title: "Update marketplaces",
      value: "marketplace-update",
      description: "Refresh cached catalogs",
      category: "Marketplace",
    },
  ])

  return (
    <DialogSelect
      title="Plugin manager"
      options={rows()}
      onSelect={(item) => {
        if (item.value === "manage") {
          show(props.api)
          return
        }
        if (item.value === "install") {
          showInstall(props.api)
          return
        }
        if (item.value === "marketplace") {
          showMarketplace(props.api)
          return
        }
        if (item.value === "marketplace-add") {
          props.api.ui.dialog.replace(() => (
            <props.api.ui.DialogPrompt
              title="Add marketplace"
              placeholder="owner/repo or URL"
              onConfirm={(value) => {
                void addMarketplaceFromSource(props.api, value.trim())
              }}
              onCancel={() => showHub(props.api)}
            />
          ))
          return
        }
        if (item.value === "marketplace-update") {
          void updateMarketplace().then((out) => {
            for (const entry of out) {
              props.api.ui.toast({
                variant: entry.ok ? "success" : "error",
                message: entry.ok ? entry.message : `${entry.name}: ${entry.message}`,
              })
            }
            showHub(props.api)
          })
        }
      }}
    />
  )
}

function showHub(api: TuiPluginApi) {
  api.ui.dialog.replace(() => <PluginHub api={api} />)
}

function state(api: TuiPluginApi, item: TuiPluginStatus) {
  if (!item.enabled) {
    return <span style={{ fg: api.theme.current.textMuted }}>disabled</span>
  }

  return (
    <span style={{ fg: item.active ? api.theme.current.success : api.theme.current.error }}>
      {item.active ? "active" : "inactive"}
    </span>
  )
}

function source(spec: string) {
  if (!spec.startsWith("file://")) return
  return fileURLToPath(spec)
}

function meta(item: TuiPluginStatus, width: number) {
  if (item.source === "internal") {
    if (width >= 120) return "Built-in plugin"
    return "Built-in"
  }
  const next = source(item.spec)
  if (next) return next
  return item.spec
}

function Install(props: { api: TuiPluginApi }) {
  const [global, setGlobal] = createSignal(false)
  const [busy, setBusy] = createSignal(false)

  useBindings(() => ({
    enabled: !busy(),
    bindings: [{ key: "tab", desc: "Toggle install scope", group: "Plugins", cmd: () => setGlobal((value) => !value) }],
  }))

  return (
    <props.api.ui.DialogPrompt
      title="Install plugin"
      placeholder="npm package or plugin@marketplace"
      busy={busy()}
      busyText="Installing plugin..."
      description={() => (
        <box flexDirection="row" gap={1}>
          <text fg={props.api.theme.current.textMuted}>scope:</text>
          <text fg={busy() ? props.api.theme.current.textMuted : props.api.theme.current.text}>
            {global() ? "global" : "local"}
          </text>
          <Show when={!busy()}>
            <text fg={props.api.theme.current.textMuted}>(tab toggle)</text>
          </Show>
        </box>
      )}
      onConfirm={(raw) => {
        if (busy()) return
        const mod = raw.trim()
        if (!mod) {
          props.api.ui.toast({
            variant: "error",
            message: "Plugin package name is required",
          })
          return
        }

        setBusy(true)
        void props.api.plugins
          .install(mod, { global: global() })
          .then((out) => {
            if (!out.ok) {
              props.api.ui.toast({
                variant: "error",
                message: out.message,
              })
              if (out.missing) {
                props.api.ui.toast({
                  variant: "info",
                  message: "Check npm registry/auth settings and try again.",
                })
              }
              show(props.api)
              return
            }

            props.api.ui.toast({
              variant: "success",
              message: `Installed ${mod} (${global() ? "global" : "local"}: ${out.dir})`,
            })
            if (!out.tui) {
              props.api.ui.toast({
                variant: "info",
                message: "Package has no TUI target to load in this app.",
              })
              show(props.api)
              return
            }

            return props.api.plugins.add(mod).then((ok) => {
              if (!ok) {
                props.api.ui.toast({
                  variant: "warning",
                  message: "Installed plugin, but runtime load failed. See console/logs; restart TUI to retry.",
                })
                show(props.api)
                return
              }

              props.api.ui.toast({
                variant: "success",
                message: `Loaded ${mod} in current session.`,
              })
              show(props.api)
            })
          })
          .finally(() => {
            setBusy(false)
          })
      }}
      onCancel={() => {
        show(props.api)
      }}
    />
  )
}

function row(api: TuiPluginApi, item: TuiPluginStatus, width: number): DialogSelectOption<string> {
  return {
    title: item.id,
    value: item.id,
    category: item.source === "internal" ? "Internal" : "External",
    description: meta(item, width),
    footer: state(api, item),
    disabled: item.id === id,
  }
}

function showInstall(api: TuiPluginApi) {
  api.ui.dialog.replace(() => <Install api={api} />)
}

function MarketplaceBrowse(props: { api: TuiPluginApi }) {
  const [busy, setBusy] = createSignal(true)
  const [loaded, setLoaded] = createSignal<LoadedMarketplace[]>([])
  const [errors, setErrors] = createSignal<Array<{ name: string; error: string }>>([])
  const [marketplace, setMarketplace] = createSignal<string | undefined>()
  const [global, setGlobal] = createSignal(false)

  onMount(() => {
    void ensureDefaultMarketplaces()
      .then(() => loadAllMarketplaces())
      .then((out) => {
        setLoaded(out.loaded)
        setErrors(out.errors)
        if (!out.loaded.length && out.errors.length) {
          props.api.ui.toast({
            variant: "warning",
            message: `${out.errors.length} marketplace(s) failed to load. Check network or add one manually.`,
            duration: 5000,
          })
        }
      })
      .catch((error) => {
        setErrors([{ name: "marketplace", error: error instanceof Error ? error.message : String(error) }])
      })
      .finally(() => setBusy(false))
  })

  const marketplaceRows = createMemo<DialogSelectOption<string>[]>(() =>
    loaded().map((item) => ({
      title: item.name,
      value: item.name,
      description: item.marketplace.description ?? `${item.marketplace.plugins.length} plugins`,
      category: "Marketplace",
      footer: <span style={{ fg: props.api.theme.current.textMuted }}>{item.marketplace.plugins.length} plugins</span>,
    })),
  )

  const pluginRows = createMemo(() => {
    const name = marketplace()
    const hit = loaded().find((item) => item.name === name)
    if (!hit) return [] as DialogSelectOption<string>[]
    return hit.marketplace.plugins.map((plugin) => ({
      title: plugin.name,
      value: `${plugin.name}@${hit.name}`,
      description: Locale.truncate(plugin.description ?? plugin.category ?? "", 64),
      category: plugin.category ?? "Plugin",
    }))
  })

  useBindings(() => ({
    enabled: !busy(),
    bindings: [
      { key: "tab", desc: "Toggle install scope", group: "Plugins", cmd: () => setGlobal((value) => !value) },
      {
        key: "escape",
        desc: "Back",
        group: "Plugins",
        cmd: () => {
          if (marketplace()) {
            setMarketplace(undefined)
            return
          }
          show(props.api)
        },
      },
    ],
  }))

  return (
    <Switch>
      <Match when={busy()}>
        <box paddingLeft={2} paddingRight={2} paddingTop={2} paddingBottom={1} gap={1}>
          <Spinner style="scanner">Loading marketplaces…</Spinner>
          <text fg={props.api.theme.current.textMuted}>Fetching catalogs from configured sources</text>
        </box>
      </Match>

      <Match when={!loaded().length}>
        <box paddingLeft={2} paddingRight={2} paddingTop={1} gap={1}>
          <text fg={props.api.theme.current.text}>
            <b>No marketplaces loaded</b>
          </text>
          <text fg={props.api.theme.current.textMuted}>
            GitHub may be unreachable. Use a VPN/mirror or add a manifest URL manually.
          </text>
          <Show when={errors().length}>
            <box gap={0} marginTop={1}>
              <For each={errors()}>
                {(item) => (
                  <text fg={props.api.theme.current.error}>
                    {item.name}: {Locale.truncate(item.error.split("\n")[0] ?? item.error, 96)}
                  </text>
                )}
              </For>
            </box>
          </Show>
          <box marginTop={1} flexDirection="row" gap={2}>
            <text fg={props.api.theme.current.primary}>/plugin marketplace add owner/repo</text>
            <text fg={props.api.theme.current.textMuted}>esc · back</text>
          </box>
        </box>
      </Match>

      <Match when={marketplace()}>
        <DialogSelect
          title={`Marketplace: ${marketplace()}`}
          options={pluginRows()}
          footerHints={[
            { title: "scope", label: global() ? "global" : "local", side: "left" },
            { title: "tab", label: "toggle scope", side: "left" },
          ]}
          actions={[
            {
              title: "back",
              command: "plugins.marketplace.back",
              onTrigger: () => setMarketplace(undefined),
            },
          ]}
          onSelect={(item) => {
            setBusy(true)
            void props.api.plugins
              .install(item.value, { global: global() })
              .then((out) => {
                if (!out.ok) {
                  props.api.ui.toast({ variant: "error", message: out.message })
                  return
                }
                props.api.ui.toast({ variant: "success", message: `Installed ${item.title}` })
                if (out.tui) return props.api.plugins.add(item.value.split("@")[0] ?? item.value)
              })
              .then(() => show(props.api))
              .finally(() => setBusy(false))
          }}
        />
      </Match>

      <Match when={true}>
        <DialogSelect
          title="Plugin marketplaces"
          options={marketplaceRows()}
          onSelect={(item) => setMarketplace(item.value)}
          footerHints={
            errors().length
              ? [{ title: "!", label: `${errors().length} marketplace(s) failed to load`, side: "left" }]
              : undefined
          }
        />
      </Match>
    </Switch>
  )
}

function showMarketplace(api: TuiPluginApi) {
  api.ui.dialog.replace(() => <MarketplaceBrowse api={api} />)
}

function View(props: { api: TuiPluginApi }) {
  const size = useTerminalDimensions()
  const [list, setList] = createSignal(props.api.plugins.list())
  const [cur, setCur] = createSignal<string | undefined>()
  const [lock, setLock] = createSignal(false)

  createEffect(() => {
    const width = size().width
    if (width >= 128) {
      props.api.ui.dialog.setSize("xlarge")
      return
    }
    if (width >= 96) {
      props.api.ui.dialog.setSize("large")
      return
    }
    props.api.ui.dialog.setSize("medium")
  })

  const rows = createMemo(() =>
    [...list()]
      .sort((a, b) => {
        const x = a.source === "internal" ? 1 : 0
        const y = b.source === "internal" ? 1 : 0
        if (x !== y) return x - y
        return a.id.localeCompare(b.id)
      })
      .map((item) => row(props.api, item, size().width)),
  )

  const flip = (x: string) => {
    if (lock()) return
    const item = list().find((entry) => entry.id === x)
    if (!item) return
    setLock(true)
    const task = item.active ? props.api.plugins.deactivate(x) : props.api.plugins.activate(x)
    void task
      .then((ok) => {
        if (!ok) {
          props.api.ui.toast({
            variant: "error",
            message: `Failed to update plugin ${item.id}`,
          })
        }
        setList(props.api.plugins.list())
      })
      .finally(() => {
        setLock(false)
      })
  }

  return (
    <DialogSelect
      title="Plugins"
      options={rows()}
      current={cur()}
      onMove={(item) => setCur(item.value)}
      actions={[
        {
          title: "toggle",
          command: "plugins.toggle",
          disabled: lock(),
          onTrigger: (item) => {
            setCur(item.value)
            flip(item.value)
          },
        },
        {
          title: "marketplace",
          command: "dialog.plugins.marketplace",
          disabled: lock(),
          onTrigger: () => {
            showMarketplace(props.api)
          },
        },
        {
          title: "install",
          command: "dialog.plugins.install",
          disabled: lock(),
          onTrigger: () => {
            showInstall(props.api)
          },
        },
      ]}
      onSelect={(item) => {
        setCur(item.value)
        flip(item.value)
      }}
    />
  )
}

function show(api: TuiPluginApi) {
  api.ui.dialog.replace(() => <View api={api} />)
}

const tui: TuiPlugin = async (api) => {
  pluginApi = api
  api.keymap.registerLayer({
    commands: [
      {
        name: "plugins.hub",
        title: "Plugin manager",
        desc: "Install, marketplaces, manage plugins",
        category: "System",
        namespace: "palette",
        slashName: "plugin",
        slashAliases: ["plugins", "marketplace"],
        run() {
          showHub(api)
        },
      },
      {
        name: "plugins.list",
        title: "Manage plugins",
        category: "System",
        namespace: "palette",
        run() {
          show(api)
        },
      },
      {
        name: "plugins.install",
        title: "Install plugin",
        category: "System",
        namespace: "palette",
        run() {
          showInstall(api)
        },
      },
      {
        name: "plugins.marketplace",
        title: "Browse plugin marketplaces",
        category: "System",
        namespace: "palette",
        run() {
          showMarketplace(api)
        },
      },
    ],
    bindings: api.tuiConfig.keybinds.gather("plugins.palette", [
      "plugins.hub",
      "plugins.list",
      "plugins.install",
      "plugins.marketplace",
    ]),
  })
}

const plugin: InternalTuiPlugin = {
  id,
  tui,
}

export default plugin
