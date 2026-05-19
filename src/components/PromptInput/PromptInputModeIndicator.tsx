import { c as _c } from "react-compiler-runtime";
import figures from 'figures';
import * as React from 'react';
import { Box, Text } from 'src/ink.js';
import { AGENT_COLOR_TO_THEME_COLOR, AGENT_COLORS, type AgentColorName } from 'src/tools/AgentTool/agentColorManager.js';
import type { PromptInputMode } from 'src/types/textInputTypes.js';
import { getTeammateColor } from 'src/utils/teammate.js';
import type { Theme } from 'src/utils/theme.js';
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js';
type Props = {
  mode: PromptInputMode;
  isLoading: boolean;
  isSubmitting?: boolean;
  viewingAgentName?: string;
  viewingAgentColor?: AgentColorName;
};

/**
 * Gets the theme color key for the teammate's assigned color.
 * Returns undefined if not a teammate or if the color is invalid.
 */
function getTeammateThemeColor(): keyof Theme | undefined {
  if (!isAgentSwarmsEnabled()) {
    return undefined;
  }
  const colorName = getTeammateColor();
  if (!colorName) {
    return undefined;
  }
  if (AGENT_COLORS.includes(colorName as AgentColorName)) {
    return AGENT_COLOR_TO_THEME_COLOR[colorName as AgentColorName];
  }
  return undefined;
}
type PromptCharProps = {
  isLoading: boolean;
  isSubmitting?: boolean;
  // Dead code elimination: parameter named themeColor to avoid "teammate" string in external builds
  themeColor?: keyof Theme;
};

/**
 * Renders the prompt character (❯).
 * Teammate color overrides the default color when set.
 */
function PromptChar(t0) {
  const $ = _c(4);
  const {
    isLoading,
    isSubmitting,
    themeColor
  } = t0;
  const teammateColor = themeColor;
  const color = teammateColor ?? (false ? "subtle" : undefined);
  let t1;
  if ($[0] !== color || $[1] !== isLoading || $[2] !== isSubmitting) {
    t1 = <Text color={color} dimColor={isLoading || isSubmitting}>{figures.pointer} </Text>;
    $[0] = color;
    $[1] = isLoading;
    $[2] = isSubmitting;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}
export function PromptInputModeIndicator(t0) {
  const $ = _c(7);
  const {
    mode,
    isLoading,
    isSubmitting,
    viewingAgentName,
    viewingAgentColor
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = getTeammateThemeColor();
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const teammateColor = t1;
  const viewedTeammateThemeColor = viewingAgentColor ? AGENT_COLOR_TO_THEME_COLOR[viewingAgentColor] : undefined;
  let t2;
  if ($[1] !== isLoading || $[2] !== mode || $[3] !== viewedTeammateThemeColor || $[4] !== viewingAgentName || $[5] !== isSubmitting) {
    t2 = <Box alignItems="flex-start" alignSelf="flex-start" flexWrap="nowrap" justifyContent="flex-start">{viewingAgentName ? <PromptChar isLoading={isLoading} isSubmitting={isSubmitting} themeColor={viewedTeammateThemeColor} /> : mode === "bash" ? <Text color="bashBorder" dimColor={isLoading || isSubmitting}>! </Text> : <PromptChar isLoading={isLoading} isSubmitting={isSubmitting} themeColor={isAgentSwarmsEnabled() ? teammateColor : undefined} />}</Box>;
    $[1] = isLoading;
    $[2] = mode;
    $[3] = viewedTeammateThemeColor;
    $[4] = viewingAgentName;
    $[5] = isSubmitting;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}
