import { z } from 'zod/v4'
import { buildTool } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { readFileCore } from '../FileReadTool/FileReadTool.js'
import { BATCH_READ_TOOL_NAME } from './constants.js'
import { getPrompt } from './prompt.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    file_paths: z
      .array(z.string())
      .min(1)
      .max(20)
      .describe('Absolute file paths to read; max 20 per call'),
    offset: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Starting line number (1-indexed) for all files'),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum number of lines to read from each file'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>

export const BatchReadTool = buildTool({
  name: BATCH_READ_TOOL_NAME,
  inputSchema,
  async description() {
    return 'Read multiple files in parallel (2-20 files)'
  },
  async prompt() {
    return getPrompt()
  },
  isReadOnly() {
    return true
  },
  isConcurrencySafe() {
    return true
  },
  shouldDefer: true,
  async call(input, context) {
    const { file_paths, offset, limit } = input

    // Read all files in parallel using Promise.allSettled
    const results = await Promise.allSettled(
      file_paths.map(async (filePath) => {
        try {
          const result = await readFileCore(
            filePath,
            { offset, limit },
            context,
          )
          return { filePath, success: true, data: result.data }
        } catch (error) {
          return {
            filePath,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }
        }
      }),
    )

    // Collect successful reads and errors
    const successfulReads: Array<{ filePath: string; data: any }> = []
    const errors: Array<{ filePath: string; error: string }> = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successfulReads.push({
            filePath: result.value.filePath,
            data: result.value.data,
          })
        } else {
          errors.push({
            filePath: result.value.filePath,
            error: result.value.error,
          })
        }
      } else {
        // Promise rejected (shouldn't happen with try/catch, but handle it)
        errors.push({
          filePath: 'unknown',
          error: result.reason?.message ?? String(result.reason),
        })
      }
    }

    // Build response
    let response = `Read ${successfulReads.length} of ${file_paths.length} files:\n\n`

    for (const { filePath, data } of successfulReads) {
      response += `=== ${filePath} ===\n`
      if (typeof data === 'string') {
        response += data
      } else if (data.type === 'text') {
        response += data.file.content
      } else if (data.type === 'directory') {
        response += `Directory with ${data.file.entries.length} entries`
      } else {
        response += `[${data.type} file]`
      }
      response += '\n\n'
    }

    if (errors.length > 0) {
      response += `\nErrors (${errors.length}):\n`
      for (const { filePath, error } of errors) {
        response += `- ${filePath}: ${error}\n`
      }
    }

    return { data: response }
  },
})
