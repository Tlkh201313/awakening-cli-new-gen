import {
  InputRenderable,
  RGBA,
  ScrollBoxRenderable,
  TextAttributes,
  type KeyEvent,
  type Renderable,
} from "@opentui/core"
import type { Binding } from "@opentui/keymap"
import { useTheme } from "@tui/context/theme"
import { AwakenedFrameBorder, SplitBorder } from "@tui/component/border"
import { entries, filter, flatMap, groupBy, pipe } from "remeda"
import { batch, createEffect, createMemo, createSignal, For, onMount, Show, type Accessor, type JSX, on } from "solid-js"
import { createStore } from "solid-js/store"
import { useTerminalDimensions } from "@opentui/solid"
import * as fuzzysort from "fuzzysort"
import { isDeepEqual } from "remeda"
import { useDialog, type DialogContext } from "@tui/ui/dialog"
import { DialogHeader } from "@tui/ui/dialog-chrome"
import { Locale } from "@/util/locale"
import { getScrollAcceleration } from "../util/scroll"
import { useTuiConfig } from "../context/tui-config"
import { formatKeyBindings, useBindings, useKeymapSelector } from "../keymap"
import { useKV } from "../context/kv"
import { activeRowSurface } from "../util/color"
import { FadeIn } from "../util/motion"
import { createDelayedFadeIn } from "../util/signal"

export interface DialogSelectProps<T> {
  title: string
  placeholder?: string
  options: DialogSelectOption<T>[]
  flat?: boolean
  ref?: (ref: DialogSelectRef<T>) => void
  onMove?: (option: DialogSelectOption<T>) => void
  onFilter?: (query: string) => void
  onSelect?: (option: DialogSelectOption<T>) => void
  skipFilter?: boolean
  renderFilter?: boolean
  actions?: {
    command: string
    title: string
    side?: "left" | "right"
    disabled?: boolean
    onTrigger: (option: DialogSelectOption<T>) => void
  }[]
  footerHints?: {
    title: string
    label: string
    side?: "left" | "right"
  }[]
  bindings?: readonly Binding<Renderable, KeyEvent>[]
  current?: T
}

export interface DialogSelectOption<T = any> {
  title: string
  value: T
  description?: string
  footer?: JSX.Element | string
  category?: string
  categoryView?: JSX.Element
  disabled?: boolean
  bg?: RGBA
  gutter?: () => JSX.Element
  margin?: JSX.Element
  onSelect?: (ctx: DialogContext) => void
}

export type DialogSelectRef<T> = {
  filter: string
  filtered: DialogSelectOption<T>[]
}

export function DialogSelect<T>(props: DialogSelectProps<T>) {
  const dialog = useDialog()
  const { theme } = useTheme()
  const tuiConfig = useTuiConfig()
  const scrollAcceleration = createMemo(() => getScrollAcceleration(tuiConfig))

  const [store, setStore] = createStore({
    selected: 0,
    filter: "",
    input: "keyboard" as "keyboard" | "mouse",
  })

  createEffect(
    on(
      () => props.current,
      (current) => {
        if (current) {
          const currentIndex = flat().findIndex((opt) => isDeepEqual(opt.value, current))
          if (currentIndex >= 0) {
            setStore("selected", currentIndex)
          }
        }
      },
    ),
  )

  let input: InputRenderable

  const actions = createMemo(() => props.actions ?? [])
  const actionBindings = useKeymapSelector((keymap) =>
    keymap.getCommandBindings({
      visibility: "registered",
      commands: actions().map((item) => item.command),
    }),
  )

  const actionLabels = createMemo(() => {
    const labels = new Map<string, string>()

    for (const action of actions()) {
      const label = formatKeyBindings(actionBindings().get(action.command), tuiConfig)
      if (label) labels.set(action.command, label)
    }

    return labels
  })

  const filtered = createMemo(() => {
    if (props.skipFilter || props.renderFilter === false) return props.options.filter((x) => x.disabled !== true)
    const needle = store.filter.toLowerCase()
    const options = pipe(
      props.options,
      filter((x) => x.disabled !== true),
    )
    if (!needle) return options

    // prioritize title matches (weight: 2) over category matches (weight: 1).
    // users typically search by the item name, and not its category.
    const result = fuzzysort
      .go(needle, options, {
        keys: ["title", "category", "description"],
        scoreFn: (r) => r[0].score * 2 + r[1].score + (r[2]?.score ?? 0),
      })
      .map((x) => x.obj)

    return result
  })

  // When the filter changes due to how TUI works, the mousemove might still be triggered
  // via a synthetic event as the layout moves underneath the cursor. This is a workaround to make sure the input mode remains keyboard
  // that the mouseover event doesn't trigger when filtering.
  createEffect(() => {
    filtered()
    setStore("input", "keyboard")
  })

  const flatten = createMemo(() => props.flat && store.filter.length > 0)

  const grouped = createMemo<[string, DialogSelectOption<T>[]][]>(() => {
    if (flatten()) return [["", filtered()]]
    const result = pipe(
      filtered(),
      groupBy((x) => x.category ?? ""),
      // mapValues((x) => x.sort((a, b) => a.title.localeCompare(b.title))),
      entries(),
    )
    return result
  })

  const flat = createMemo(() => {
    return pipe(
      grouped(),
      flatMap(([_, options]) => options),
    )
  })

  const rows = createMemo(() => {
    const headers = grouped().reduce((acc, [category], i) => {
      if (!category) return acc
      return acc + (i > 0 ? 2 : 1)
    }, 0)
    return flat().length + headers
  })

  const dimensions = useTerminalDimensions()
  const height = createMemo(() => Math.min(rows(), Math.floor(dimensions().height / 2) - 6))

  const selected = createMemo(() => flat()[store.selected])

  createEffect(
    on([() => store.filter, () => props.current], ([filter, current]) => {
      setTimeout(() => {
        if (filter.length > 0) {
          moveTo(0)
        } else if (current) {
          const currentIndex = flat().findIndex((opt) => isDeepEqual(opt.value, current))
          if (currentIndex >= 0) {
            moveTo(currentIndex)
          }
        }
      }, 0)
    }),
  )

  function move(direction: number) {
    if (flat().length === 0) return
    let next = store.selected + direction
    if (next < 0) next = flat().length - 1
    if (next >= flat().length) next = 0
    moveTo(next)
  }

  function scrollToSelected(center = false) {
    if (!scroll) return
    const option = selected()
    if (!option) return
    const target = scroll.getChildren().find((child: { id?: string }) => {
      return child.id === JSON.stringify(option.value)
    })
    if (!target) return
    const y = target.y - scroll.y
    if (center) {
      const centerOffset = Math.floor(scroll.height / 2)
      scroll.scrollBy(y - centerOffset)
      return
    }
    if (y >= scroll.height) {
      scroll.scrollBy(y - scroll.height + 1)
    }
    if (y < 0) {
      scroll.scrollBy(y)
      if (isDeepEqual(flat()[0].value, option.value)) {
        scroll.scrollTo(0)
      }
    }
  }

  function moveTo(next: number, center = false) {
    if (next === store.selected) return
    setStore("selected", next)
    const option = selected()
    if (option) props.onMove?.(option)
    scrollToSelected(center)
  }

  function revealSelected() {
    if (flat().length === 0) return
    scrollToSelected()
  }

  function submit() {
    setStore("input", "keyboard")
    const option = selected()
    if (!option) return
    option.onSelect?.(dialog)
    props.onSelect?.(option)
  }

  useBindings(() => {
    const enabledActions = actions().filter((item) => !item.disabled)

    return {
      commands: [
        {
          name: "dialog.select.prev",
          title: "Previous item",
          category: "Dialog",
          run() {
            setStore("input", "keyboard")
            move(-1)
          },
        },
        {
          name: "dialog.select.next",
          title: "Next item",
          category: "Dialog",
          run() {
            setStore("input", "keyboard")
            move(1)
          },
        },
        {
          name: "dialog.select.page_up",
          title: "Page up",
          category: "Dialog",
          run() {
            setStore("input", "keyboard")
            move(-10)
          },
        },
        {
          name: "dialog.select.page_down",
          title: "Page down",
          category: "Dialog",
          run() {
            setStore("input", "keyboard")
            move(10)
          },
        },
        {
          name: "dialog.select.home",
          title: "First item",
          category: "Dialog",
          run() {
            setStore("input", "keyboard")
            moveTo(0)
          },
        },
        {
          name: "dialog.select.end",
          title: "Last item",
          category: "Dialog",
          run() {
            setStore("input", "keyboard")
            moveTo(flat().length - 1)
          },
        },
        {
          name: "dialog.select.submit",
          title: "Select item",
          category: "Dialog",
          run: submit,
        },
        ...enabledActions.map((item) => ({
          name: item.command,
          title: item.title,
          category: "Dialog",
          run() {
            setStore("input", "keyboard")
            const option = selected()
            if (!option) return
            item.onTrigger(option)
          },
        })),
      ],
      bindings: [
        ...tuiConfig.keybinds.gather("dialog.select", [
          "dialog.select.prev",
          "dialog.select.next",
          "dialog.select.page_up",
          "dialog.select.page_down",
          "dialog.select.home",
          "dialog.select.end",
          "dialog.select.submit",
        ]),
        ...enabledActions.flatMap((item) => tuiConfig.keybinds.get(item.command)),
        ...(props.bindings ?? []).filter((binding) => {
          if (typeof binding.cmd !== "string") return true
          return enabledActions.some((item) => item.command === binding.cmd)
        }),
      ],
    }
  })

  let scroll: ScrollBoxRenderable | undefined
  const ref: DialogSelectRef<T> = {
    get filter() {
      return store.filter
    },
    get filtered() {
      return filtered()
    },
  }
  props.ref?.(ref)

  const visibleActions = createMemo(() => [
    ...actions()
      .map((item) => ({ ...item, label: actionLabels().get(item.command) ?? "" }))
      .filter((item) => !item.disabled && item.label),
    ...(props.footerHints ?? []),
  ])
  const left = createMemo(() => visibleActions().filter((item) => item.side !== "right"))
  const right = createMemo(() => visibleActions().filter((item) => item.side === "right"))

  const kv = useKV()
  const animations = () => kv.get("animations_enabled", true)
  const [ready, setReady] = createSignal(false)
  const contentAlpha = createDelayedFadeIn(ready, animations, 90, 200)
  const footerAlpha = createDelayedFadeIn(ready, animations, 150, 180)

  onMount(() => setReady(true))

  createEffect(
    on([ready, () => flat().length], () => {
      if (!ready()) return
      if (flat().length === 0) return
      setTimeout(revealSelected, 0)
      setTimeout(revealSelected, 60)
    }),
  )

  return (
    <box gap={1} paddingBottom={1}>
      <box paddingLeft={3} paddingRight={3}>
        <DialogHeader title={props.title} />
        <Show when={props.renderFilter !== false}>
          <FadeIn delay={45} duration={180}>
            <box paddingTop={1}>
            <input
              onInput={(e) => {
                batch(() => {
                  setStore("filter", e)
                  props.onFilter?.(e)
                })
              }}
              focusedBackgroundColor={theme.backgroundPanel}
              cursorColor={theme.primary}
              focusedTextColor={theme.textMuted}
              ref={(r) => {
                input = r
                input.traits = { status: "FILTER" }
                setTimeout(() => {
                  if (!input) return
                  if (input.isDestroyed) return
                  input.focus()
                }, 1)
              }}
              placeholder={props.placeholder ?? "Search"}
              placeholderColor={theme.textMuted}
            />
            </box>
          </FadeIn>
        </Show>
      </box>
      <Show
        when={grouped().length > 0}
        fallback={
          <box paddingLeft={4} paddingRight={4} paddingTop={1} opacity={contentAlpha()}>
            <text fg={theme.textMuted}>No results found</text>
          </box>
        }
      >
        <scrollbox
          paddingLeft={1}
          paddingRight={1}
          marginTop={1}
          opacity={contentAlpha()}
          scrollbarOptions={{ visible: false }}
          scrollAcceleration={scrollAcceleration()}
          ref={(r: ScrollBoxRenderable) => {
            scroll = r
            setTimeout(revealSelected, 0)
          }}
          maxHeight={height()}
        >
          <For each={grouped()}>
            {([category, options], index) => (
              <>
                <Show when={category}>
                  <box paddingTop={index() > 0 ? 1 : 0} paddingLeft={3}>
                    <Show
                      when={options[0]?.categoryView}
                      fallback={
                        <text fg={theme.accent} attributes={TextAttributes.BOLD}>
                          ◆ {category}
                        </text>
                      }
                    >
                      {options[0]?.categoryView}
                    </Show>
                  </box>
                </Show>
                <For each={options}>
                  {(option) => {
                    const active = createMemo(() => isDeepEqual(option.value, selected()?.value))
                    const current = createMemo(() => isDeepEqual(option.value, props.current))
                    const index = () => flat().findIndex((x) => isDeepEqual(x.value, option.value))
                    return (
                      <SelectRow
                        contentAlpha={contentAlpha}
                        active={active}
                        current={current}
                        option={option}
                        category={category}
                        flatten={!!flatten()}
                        onMouseMove={() => {
                          if (store.input !== "mouse") setStore("input", "mouse")
                        }}
                        onMouseUp={() => {
                          option.onSelect?.(dialog)
                          props.onSelect?.(option)
                        }}
                        onMouseOver={() => {
                          if (store.input !== "mouse") return
                          const row = index()
                          if (row === -1 || row === store.selected) return
                          moveTo(row)
                        }}
                        onMouseDown={() => {
                          const row = index()
                          if (row === -1) return
                          moveTo(row)
                        }}
                      />
                    )
                  }}
                </For>
              </>
            )}
          </For>
        </scrollbox>
      </Show>
      <Show when={visibleActions().length} fallback={<box flexShrink={0} />}>
        <box
          paddingRight={2}
          paddingLeft={3}
          flexDirection="row"
          justifyContent="space-between"
          flexShrink={0}
          paddingTop={1}
          opacity={footerAlpha()}
          border={AwakenedFrameBorder.border}
          borderColor={theme.borderSubtle}
          customBorderChars={AwakenedFrameBorder.customBorderChars}
        >
          <box flexDirection="row" gap={2}>
            <For each={left()}>
              {(item) => (
                <text>
                  <span style={{ fg: theme.text }}>
                    <b>{item.title}</b>{" "}
                  </span>
                  <span style={{ fg: theme.textMuted }}>{item.label}</span>
                </text>
              )}
            </For>
          </box>
          <box flexDirection="row" gap={2}>
            <For each={right()}>
              {(item) => (
                <text>
                  <span style={{ fg: theme.text }}>
                    <b>{item.title}</b>{" "}
                  </span>
                  <span style={{ fg: theme.textMuted }}>{item.label}</span>
                </text>
              )}
            </For>
          </box>
        </box>
      </Show>
    </box>
  )
}

function SelectRow(props: {
  contentAlpha: Accessor<number>
  active: Accessor<boolean>
  current: Accessor<boolean>
  option: DialogSelectOption<any>
  category?: string
  flatten: boolean
  onMouseMove: () => void
  onMouseUp: () => void
  onMouseOver: () => void
  onMouseDown: () => void
}) {
  const { theme } = useTheme()
  const backgroundColor = () => {
    if (!props.active()) return RGBA.fromInts(0, 0, 0, 0)
    return activeRowSurface(theme.primary, theme.backgroundElement, 0.15)
  }
  const border = (): boolean | ("left")[] => (props.active() ? ["left"] : false)
  const borderColor = () => theme.primary

  return (
    <box
      id={JSON.stringify(props.option.value)}
      flexDirection="row"
      position="relative"
      opacity={props.contentAlpha()}
      onMouseMove={props.onMouseMove}
      onMouseUp={props.onMouseUp}
      onMouseOver={props.onMouseOver}
      onMouseDown={props.onMouseDown}
      backgroundColor={backgroundColor()}
      border={border()}
      borderColor={borderColor()}
      customBorderChars={SplitBorder.customBorderChars}
      paddingLeft={props.current() || props.option.gutter ? 1 : 3}
      paddingRight={3}
      gap={1}
    >
      <Show when={!props.current() && props.option.margin}>
        <box position="absolute" left={1} flexShrink={0}>
          {props.option.margin}
        </box>
      </Show>
      <Option
        title={props.option.title}
        footer={props.flatten ? (props.option.category ?? props.option.footer) : props.option.footer}
        description={props.option.description !== props.category ? props.option.description : undefined}
        active={props.active()}
        current={props.current()}
        gutter={props.option.gutter}
      />
    </box>
  )
}

function Option(props: {
  title: string
  description?: string
  active?: boolean
  current?: boolean
  footer?: JSX.Element | string
  gutter?: () => JSX.Element
  onMouseOver?: () => void
}) {
  const { theme } = useTheme()

  return (
    <>
      <Show when={props.current}>
        <text flexShrink={0} fg={props.active ? theme.primary : props.current ? theme.primary : theme.text} marginRight={0}>
          ◆
        </text>
      </Show>
      <Show when={!props.current && props.gutter}>
        <box flexShrink={0} marginRight={0}>
          {props.gutter?.()}
        </box>
      </Show>
      <text
        flexGrow={1}
        fg={props.active ? theme.text : props.current ? theme.primary : theme.text}
        attributes={props.active ? TextAttributes.BOLD : undefined}
        overflow="hidden"
        wrapMode="none"
      >
        {Locale.truncate(props.title, 61)}
        <Show when={props.description}>
          <span style={{ fg: theme.textMuted }}> {props.description}</span>
        </Show>
      </text>
      <Show when={props.footer}>
        <box flexShrink={0}>
          <text fg={props.active ? theme.primary : theme.textMuted}>{props.footer}</text>
        </box>
      </Show>
    </>
  )
}
