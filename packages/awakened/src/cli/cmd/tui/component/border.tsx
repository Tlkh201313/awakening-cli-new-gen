export const EmptyBorder = {
  topLeft: "",
  bottomLeft: "",
  vertical: "",
  topRight: "",
  bottomRight: "",
  horizontal: " ",
  bottomT: "",
  topT: "",
  cross: "",
  leftT: "",
  rightT: "",
}

/** Left accent bar — session tools, toasts, autocomplete */
export const SplitBorder = {
  border: ["left" as const],
  customBorderChars: {
    ...EmptyBorder,
    vertical: "▌",
  },
}

/** Full dialog / panel frame */
export const AwakenedDialogBorder = {
  border: ["top" as const, "bottom" as const, "left" as const, "right" as const],
  customBorderChars: {
    ...EmptyBorder,
    topLeft: "◆",
    topRight: "◆",
    bottomLeft: "◆",
    bottomRight: "◆",
    horizontal: "─",
    vertical: "│",
  },
}

/** Prompt input — signature Awakened look */
export const AwakenedPromptBorder = {
  border: ["top" as const, "bottom" as const],
  customBorderChars: {
    ...EmptyBorder,
    topLeft: "◈",
    topRight: "◈",
    bottomLeft: "◈",
    bottomRight: "◈",
    horizontal: "─",
  },
}

/** Home frame + footer hints */
export const AwakenedFrameBorder = {
  border: ["top" as const, "bottom" as const],
  customBorderChars: {
    ...EmptyBorder,
    topLeft: "◆",
    topRight: "◆",
    bottomLeft: "◆",
    bottomRight: "◆",
    horizontal: "─",
  },
}

/** Legacy aliases — mapped to Awakened variants */
export const SquarePromptBorder = AwakenedFrameBorder

export const RoundPromptBorder = AwakenedPromptBorder

export const AwakenedAccentBorder = SplitBorder
