import React from 'react';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs';
import { extractTag } from '../../utils/messages.js';
import { FILE_NOT_FOUND_CWD_NOTE } from '../../utils/file.js';
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
import { MessageResponse } from '../../components/MessageResponse.js';
import { Text } from '../../ink.js';

/**
 * Shared error UI for search tools (Glob, Grep).
 * Extracts tool_use_error tag and renders compact error for non-verbose mode.
 */
export function renderSearchToolErrorMessage(
  result: ToolResultBlockParam['content'],
  { verbose }: { verbose: boolean }
): React.ReactNode {
  if (!verbose && typeof result === 'string' && extractTag(result, 'tool_use_error')) {
    const errorMessage = extractTag(result, 'tool_use_error');
    if (errorMessage?.includes(FILE_NOT_FOUND_CWD_NOTE)) {
      return (
        <MessageResponse>
          <Text color="error">File not found</Text>
        </MessageResponse>
      );
    }
    return (
      <MessageResponse>
        <Text color="error">Error searching files</Text>
      </MessageResponse>
    );
  }
  return <FallbackToolUseErrorMessage result={result} verbose={verbose} />;
}
