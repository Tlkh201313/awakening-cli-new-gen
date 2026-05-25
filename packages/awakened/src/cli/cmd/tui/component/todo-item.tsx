import { useTheme } from "../context/theme"

export interface TodoItemProps {
  status: string
  content: string
}

export function TodoItem(props: TodoItemProps) {
  const { theme } = useTheme()
  const mark = () => {
    if (props.status === "completed") return "◆"
    if (props.status === "in_progress") return "◈"
    return "◇"
  }
  const fg = () => {
    if (props.status === "completed") return theme.success
    if (props.status === "in_progress") return theme.warning
    return theme.textMuted
  }

  return (
    <box flexDirection="row" gap={1} paddingTop={0}>
      <text flexShrink={0} fg={fg()}>
        {mark()}
      </text>
      <text flexGrow={1} wrapMode="word" fg={fg()}>
        {props.content}
      </text>
    </box>
  )
}
