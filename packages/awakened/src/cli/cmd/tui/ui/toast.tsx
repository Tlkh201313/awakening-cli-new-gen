import { createContext, useContext, type ParentProps, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useTheme } from "@tui/context/theme"
import { useTerminalDimensions } from "@opentui/solid"
import { SplitBorder } from "../component/border"
import { TextAttributes } from "@opentui/core"
import { Schema } from "effect"
import { TuiEvent } from "../event"
import { useKV } from "../context/kv"
import { slideOffset } from "../util/motion"
import { createFadeTransition } from "../util/signal"

type ToastInput = Schema.Codec.Encoded<typeof TuiEvent.ToastShow.properties>
export type ToastOptions = Schema.Schema.Type<typeof TuiEvent.ToastShow.properties>

const decodeToastOptions = Schema.decodeUnknownSync(TuiEvent.ToastShow.properties)

function ToastPanel(props: { current: ToastOptions }) {
  const { theme } = useTheme()
  const dimensions = useTerminalDimensions()
  const kv = useKV()
  const animations = () => kv.get("animations_enabled", true)
  const alpha = createFadeTransition(() => true, animations, 200)

  return (
    <box
      position="absolute"
      justifyContent="center"
      alignItems="flex-start"
      top={2}
      right={2}
      maxWidth={Math.min(60, dimensions().width - 6)}
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      opacity={alpha()}
      marginLeft={slideOffset(alpha(), 4)}
      backgroundColor={theme.backgroundPanel}
      border={SplitBorder.border}
      borderColor={theme[props.current.variant]}
      customBorderChars={SplitBorder.customBorderChars}
    >
      <Show when={props.current.title}>
        <text attributes={TextAttributes.BOLD} marginBottom={1} fg={theme.text}>
          ◆ {props.current.title}
        </text>
      </Show>
      <text fg={theme.text} wrapMode="word" width="100%">
        {props.current.message}
      </text>
    </box>
  )
}

export function Toast() {
  const toast = useToast()

  return (
    <Show when={toast.currentToast}>{(current) => <ToastPanel current={current()} />}</Show>
  )
}

function init() {
  const [store, setStore] = createStore({
    currentToast: null as ToastOptions | null,
  })

  let timeoutHandle: NodeJS.Timeout | null = null

  const toast = {
    show(options: ToastInput) {
      const toastOptions = decodeToastOptions(options)
      setStore("currentToast", toastOptions)
      if (timeoutHandle) clearTimeout(timeoutHandle)
      timeoutHandle = setTimeout(() => {
        setStore("currentToast", null)
      }, toastOptions.duration).unref()
    },
    error: (err: any) => {
      if (err instanceof Error)
        return toast.show({
          variant: "error",
          message: err.message,
        })
      const msg = typeof err === "string" ? err : String(err)
      toast.show({
        variant: "error",
        message: msg === "[object Object]" ? "An unknown error has occurred" : msg,
      })
    },
    get currentToast(): ToastOptions | null {
      return store.currentToast
    },
  }
  return toast
}

export type ToastContext = ReturnType<typeof init>

const ctx = createContext<ToastContext>()

export function ToastProvider(props: ParentProps) {
  const value = init()
  return <ctx.Provider value={value}>{props.children}</ctx.Provider>
}

export function useToast() {
  const value = useContext(ctx)
  if (!value) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return value
}
