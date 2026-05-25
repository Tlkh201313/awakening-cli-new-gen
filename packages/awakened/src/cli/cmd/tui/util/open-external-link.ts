import open from "open"
import { DialogConfirm } from "../ui/dialog-confirm"
import type { DialogContext } from "../ui/dialog"

export async function openExternalLink(dialog: DialogContext, url: string) {
  const ok = await DialogConfirm.show(dialog, "Open Link", `Open this link in your browser?\n\n${url}`, "cancel")
  if (!ok) return
  await open(url).catch(() => {})
}
