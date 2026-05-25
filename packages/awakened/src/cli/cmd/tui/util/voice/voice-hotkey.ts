/** Windows: avoid Ctrl+Shift+Space (terminal/language) and Ctrl+Win (OS). */
export function defaultVoiceToggleKeybind() {
  if (process.platform === "win32") return "ctrl+alt+v,ctrl+super"
  return "ctrl+super"
}

export function voiceHotkeyLabel() {
  if (process.platform === "win32") return "Ctrl+Alt+V"
  if (process.platform === "darwin") return "Ctrl+⌘"
  return "Ctrl+Super"
}