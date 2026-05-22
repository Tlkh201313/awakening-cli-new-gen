import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import React from 'react';
import { MessageResponse } from 'src/components/MessageResponse.js';
import { TOOL_SUMMARY_MAX_LENGTH } from '../../constants/toolLimits.js';
import { Text } from '../../ink.js';
import { getDisplayPath } from '../../utils/file.js';
import { truncate } from '../../utils/format.js';
import { GrepTool } from '../GrepTool/GrepTool.js';
import { renderSearchToolErrorMessage } from '../shared/searchToolErrorUI.js';
export function userFacingName(): string {
  return 'Search';
}
export function renderToolUseMessage({
  pattern,
  path
}: Partial<{
  pattern: string;
  path: string;
}>, {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  if (!pattern) {
    return null;
  }
  if (!path) {
    return `pattern: "${pattern}"`;
  }
  return `pattern: "${pattern}", path: "${verbose ? path : getDisplayPath(path)}"`;
}
export function renderToolUseErrorMessage(result: ToolResultBlockParam['content'], {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  return renderSearchToolErrorMessage(result, { verbose });
}

// Note: GlobTool reuses GrepTool's renderToolResultMessage
export const renderToolResultMessage = GrepTool.renderToolResultMessage;
export function getToolUseSummary(input: Partial<{
  pattern: string;
  path: string;
}> | undefined): string | null {
  if (!input?.pattern) {
    return null;
  }
  return truncate(input.pattern, TOOL_SUMMARY_MAX_LENGTH);
}
