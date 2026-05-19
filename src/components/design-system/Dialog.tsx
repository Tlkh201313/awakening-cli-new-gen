import { c as _c } from "react-compiler-runtime";
import React, { useState } from 'react';
import { type ExitState, useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
import { Box, Text } from '../../ink.js';
import { useKeybinding } from '../../keybindings/useKeybinding.js';
import type { Theme } from '../../utils/theme.js';
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
import { FadeIn } from '../FadeIn.js';
import { Byline } from './Byline.js';
import FullWidthRow from './FullWidthRow.js';
import { KeyboardShortcutHint } from './KeyboardShortcutHint.js';
import { Pane } from './Pane.js';
type DialogProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onCancel: () => void;
  color?: keyof Theme;
  hideInputGuide?: boolean;
  hideBorder?: boolean;
  /** Custom input guide content. Receives exitState for Ctrl+C/D pending display. */
  inputGuide?: (exitState: ExitState) => React.ReactNode;
  /**
   * Controls whether Dialog's built-in confirm:no (Esc/n) and app:exit/interrupt
   * (Ctrl-C/D) keybindings are active. Set to `false` while an embedded text
   * field is being edited so those keys reach the field instead of being
   * consumed by Dialog. TextInput has its own ctrl+c/d handlers (cancel on
   * press, delete-forward on ctrl+d with text). Defaults to `true`.
   */
  isCancelActive?: boolean;
};
export function Dialog(t0) {
  const $ = _c(33);
  const {
    title,
    subtitle,
    children,
    onCancel,
    color: t1,
    hideInputGuide,
    hideBorder,
    inputGuide,
    isCancelActive: t2
  } = t0;
  const color = t1 === undefined ? "permission" : t1;
  const isCancelActive = t2 === undefined ? true : t2;
  let t3;
  if ($[0] !== onCancel) {
    t3 = () => {
      setisVisible(false);
      setTimeout(() => {
        setshouldRender(false);
        onCancel();
      }, 150);
    };
    $[0] = onCancel;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  const handleCancel = t3;
  let t4;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = true;
    $[2] = t4;
  } else {
    t4 = $[2];
  }
  let t5;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = true;
    $[3] = t5;
  } else {
    t5 = $[3];
  }
  const [isvisible, setisVisible] = useState(t4);
  const [shouldrender, setshouldRender] = useState(t5);
  const exitState = useExitOnCtrlCDWithKeybindings(undefined, undefined, isCancelActive);
  let t6;
  if ($[4] !== isCancelActive) {
    t6 = {
      context: "Confirmation",
      isActive: isCancelActive
    };
    $[4] = isCancelActive;
    $[5] = t6;
  } else {
    t6 = $[5];
  }
  useKeybinding("confirm:no", handleCancel, t6);
  let t7;
  if ($[6] !== exitState.keyName || $[7] !== exitState.pending) {
    t7 = exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text> : <Byline><KeyboardShortcutHint shortcut="Enter" action="confirm" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="cancel" /></Byline>;
    $[6] = exitState.keyName;
    $[7] = exitState.pending;
    $[8] = t7;
  } else {
    t7 = $[8];
  }
  const defaultInputGuide = t7;
  let t8;
  if ($[9] !== color || $[10] !== title) {
    t8 = <Text bold={true} color={color}>{title}</Text>;
    $[9] = color;
    $[10] = title;
    $[11] = t8;
  } else {
    t8 = $[11];
  }
  let t9;
  if ($[12] !== subtitle) {
    t9 = subtitle && <Text dimColor={true}>{subtitle}</Text>;
    $[12] = subtitle;
    $[13] = t9;
  } else {
    t9 = $[13];
  }
  let t10;
  if ($[14] !== t8 || $[15] !== t9) {
    t10 = <Box flexDirection="column">{t8}{t9}</Box>;
    $[14] = t8;
    $[15] = t9;
    $[16] = t10;
  } else {
    t10 = $[16];
  }
  let t11;
  if ($[17] !== children || $[18] !== t10) {
    t11 = <Box flexDirection="column" gap={1}>{t10}{children}</Box>;
    $[17] = children;
    $[18] = t10;
    $[19] = t11;
  } else {
    t11 = $[19];
  }
  let t12;
  if ($[20] !== defaultInputGuide || $[21] !== exitState || $[22] !== hideInputGuide || $[23] !== inputGuide) {
    t12 = !hideInputGuide && <Box marginTop={1}><FullWidthRow><Text dimColor={true} italic={true}>{inputGuide ? inputGuide(exitState) : defaultInputGuide}</Text></FullWidthRow></Box>;
    $[20] = defaultInputGuide;
    $[21] = exitState;
    $[22] = hideInputGuide;
    $[23] = inputGuide;
    $[24] = t12;
  } else {
    t12 = $[24];
  }
  let t13;
  if ($[25] !== t11 || $[26] !== t12) {
    t13 = <>{t11}{t12}</>;
    $[25] = t11;
    $[26] = t12;
    $[27] = t13;
  } else {
    t13 = $[27];
  }
  const content = t13;
  if (!shouldrender) {
    return null;
  }
  if (hideBorder) {
    return <FadeIn duration={200}>{isvisible ? content : <Text dimColor>{content}</Text>}</FadeIn>;
  }
  let t14;
  if ($[28] !== color || $[29] !== content || $[30] !== isvisible) {
    const pane = <Pane color={color}>{content}</Pane>;
    t14 = <FadeIn duration={200}>{isvisible ? pane : <Text dimColor>{pane}</Text>}</FadeIn>;
    $[28] = color;
    $[29] = content;
    $[30] = isvisible;
    $[31] = t14;
  } else {
    t14 = $[31];
  }
  return t14;
}
