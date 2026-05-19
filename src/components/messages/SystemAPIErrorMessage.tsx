import { c as _c } from "react-compiler-runtime";
import * as React from 'react';
import { useState } from 'react';
import { Box, Text } from 'src/ink.js';
import { formatAPIError } from 'src/services/api/errorUtils.js';
import type { SystemAPIErrorMessage } from 'src/types/message.js';
import { useInterval } from 'usehooks-ts';
import { CtrlOToExpand } from '../CtrlOToExpand.js';
import { MessageResponse } from '../MessageResponse.js';
import { useErrorShake } from '../../hooks/useErrorShake.js';
const MAX_API_ERROR_CHARS = 1000;
type Props = {
  message: SystemAPIErrorMessage;
  verbose: boolean;
};
export function SystemAPIErrorMessage(t0) {
  const $ = _c(38);
  const {
    message: t1,
    verbose
  } = t0;
  const {
    retryAttempt,
    error,
    retryInMs,
    maxRetries
  } = t1;
  const hidden = true && retryAttempt < 4;
  const [countdownMs, setCountdownMs] = useState(0);
  const done = countdownMs >= retryInMs;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => setCountdownMs(_temp);
    $[0] = t2;
  } else {
    t2 = $[0];
  }
  useInterval(t2, hidden || done ? null : 1000);
  const { offsetX, flashIntensity, ref: shakeRef } = useErrorShake(true);
  if (hidden) {
    return null;
  }
  let t3;
  if ($[1] !== countdownMs || $[2] !== retryInMs) {
    t3 = Math.round((retryInMs - countdownMs) / 1000);
    $[1] = countdownMs;
    $[2] = retryInMs;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const retryInSecondsLive = Math.max(0, t3);
  let T0;
  let T1;
  let T2;
  let t4;
  let t5;
  let t6;
  let truncated;
  if ($[4] !== error || $[5] !== verbose) {
    const formatted = formatAPIError(error);
    truncated = !verbose && formatted.length > MAX_API_ERROR_CHARS;
    T2 = MessageResponse;
    T1 = Box;
    t6 = "column";
    T0 = Text;
    t4 = "error";
    t5 = truncated ? formatted.slice(0, MAX_API_ERROR_CHARS) + "\u2026" : formatted;
    $[4] = error;
    $[5] = verbose;
    $[6] = T0;
    $[7] = T1;
    $[8] = T2;
    $[9] = t4;
    $[10] = t5;
    $[11] = t6;
    $[12] = truncated;
  } else {
    T0 = $[6];
    T1 = $[7];
    T2 = $[8];
    t4 = $[9];
    t5 = $[10];
    t6 = $[11];
    truncated = $[12];
  }
  let errorColor;
  if ($[13] !== flashIntensity || $[14] !== t4) {
    errorColor = flashIntensity > 0 ? "red" : t4;
    $[13] = flashIntensity;
    $[14] = t4;
    $[15] = errorColor;
  } else {
    errorColor = $[15];
  }
  let t7;
  if ($[16] !== T0 || $[17] !== errorColor || $[18] !== t5 || $[19] !== offsetX) {
    t7 = <T0 color={errorColor}>{(' '.repeat(Math.max(0, offsetX)))}{t5}</T0>;
    $[16] = T0;
    $[17] = errorColor;
    $[18] = t5;
    $[19] = offsetX;
    $[20] = t7;
  } else {
    t7 = $[20];
  }
  let t8;
  if ($[21] !== truncated) {
    t8 = truncated && <CtrlOToExpand />;
    $[21] = truncated;
    $[22] = t8;
  } else {
    t8 = $[22];
  }
  const t9 = retryInSecondsLive === 1 ? "second" : "seconds";
  let t10;
  if ($[23] !== maxRetries || $[24] !== retryAttempt || $[25] !== retryInSecondsLive || $[26] !== t9) {
    t10 = <Text dimColor={true}>Retrying in {retryInSecondsLive}{" "}{t9}… (attempt{" "}{retryAttempt}/{maxRetries}){process.env.API_TIMEOUT_MS ? ` · API_TIMEOUT_MS=${process.env.API_TIMEOUT_MS}ms, try increasing it` : ""}</Text>;
    $[23] = maxRetries;
    $[24] = retryAttempt;
    $[25] = retryInSecondsLive;
    $[26] = t9;
    $[27] = t10;
  } else {
    t10 = $[27];
  }
  let t11;
  if ($[28] !== T1 || $[29] !== t10 || $[30] !== t6 || $[31] !== t7 || $[32] !== t8) {
    t11 = <T1 flexDirection={t6}>{t7}{t8}{t10}</T1>;
    $[28] = T1;
    $[29] = t10;
    $[30] = t6;
    $[31] = t7;
    $[32] = t8;
    $[33] = t11;
  } else {
    t11 = $[33];
  }
  let t12;
  if ($[34] !== T2 || $[35] !== t11 || $[36] !== shakeRef) {
    t12 = <T2 ref={shakeRef}>{t11}</T2>;
    $[34] = T2;
    $[35] = t11;
    $[36] = shakeRef;
    $[37] = t12;
  } else {
    t12 = $[37];
  }
  return t12;
}
function _temp(ms) {
  return ms + 1000;
}
