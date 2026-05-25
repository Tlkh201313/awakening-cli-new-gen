import { DialogSelect, type DialogSelectOption, type DialogSelectRef } from "../ui/dialog-select"
import { HOME_STYLE_IDS, useHomeStyle } from "../context/home-style"
import { useTheme } from "../context/theme"
import { useDialog } from "../ui/dialog"
import { onCleanup } from "solid-js"

type ThemeDialogValue = { kind: "color"; id: string } | { kind: "home"; id: (typeof HOME_STYLE_IDS)[number] }

export function DialogThemeList() {
  const theme = useTheme()
  const homeStyle = useHomeStyle()
  const dialog = useDialog()
  let confirmed = false
  let ref: DialogSelectRef<ThemeDialogValue>
  const initialColor = theme.selected
  const initialHome = homeStyle.selected

  const colorOptions = Object.keys(theme.all())
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((value) => ({
      title: value,
      value: { kind: "color" as const, id: value },
      category: "Color palette",
      description: "Terminal colors and syntax",
      gutter: theme.selected === value ? () => <text>●</text> : undefined,
    }))

  const homeOptions = HOME_STYLE_IDS.map((id) => ({
    title: homeStyle.all()[id].title,
    value: { kind: "home" as const, id },
    category: "Home layout",
    description: homeStyle.all()[id].description,
    gutter: homeStyle.selected === id ? () => <text>●</text> : undefined,
  }))

  const options: DialogSelectOption<ThemeDialogValue>[] = [...colorOptions, ...homeOptions]

  onCleanup(() => {
    if (!confirmed) {
      theme.set(initialColor)
      homeStyle.set(initialHome)
    }
  })

  const apply = (value: ThemeDialogValue) => {
    if (value.kind === "color") theme.set(value.id)
    if (value.kind === "home") homeStyle.set(value.id)
  }

  return (
    <DialogSelect
      title="Themes & layout"
      options={options}
      onMove={(opt) => apply(opt.value)}
      onSelect={(opt) => {
        apply(opt.value)
        confirmed = true
        dialog.clear()
      }}
      ref={(r) => {
        ref = r
      }}
      onFilter={(query) => {
        if (query.length === 0) {
          theme.set(initialColor)
          homeStyle.set(initialHome)
          return
        }

        const first = ref.filtered[0]
        if (first) apply(first.value)
      }}
      footerHints={[
        { title: "Color", label: initialColor, side: "left" },
        { title: "Layout", label: homeStyle.all()[initialHome].title, side: "right" },
      ]}
    />
  )
}
