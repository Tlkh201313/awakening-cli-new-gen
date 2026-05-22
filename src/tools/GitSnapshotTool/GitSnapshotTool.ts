import { z } from 'zod/v4'
import { buildTool } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { execFileNoThrow } from '../../utils/execFileNoThrow.js'
import { getCwd } from '../../utils/cwd.js'
import { GIT_SNAPSHOT_TOOL_NAME } from './constants.js'
import { getPrompt } from './prompt.js'

const inputSchema = lazySchema(() => z.strictObject({}))

type Input = z.infer<ReturnType<typeof inputSchema>>

export const GitSnapshotTool = buildTool({
  name: GIT_SNAPSHOT_TOOL_NAME,
  inputSchema,
  async description() {
    return 'Get git repository status snapshot (status, diff stats, last commit)'
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
  shouldDefer: false,
  async call(_input, context) {
    const cwd = getCwd()

    // Check if we're in a git repo
    const isGitRepoResult = await execFileNoThrow(
      'git',
      ['rev-parse', '--git-dir'],
      { cwd, signal: context.abortController.signal },
    )

    if (isGitRepoResult.exitCode !== 0) {
      throw new Error(
        `Not a git repository. Current directory: ${cwd}\n` +
        `Initialize a git repository with: git init`
      )
    }

    // Run git commands in parallel
    const [statusResult, diffStatResult, logResult] = await Promise.all([
      execFileNoThrow('git', ['status', '--short'], {
        cwd,
        signal: context.abortController.signal,
      }),
      execFileNoThrow('git', ['diff', '--stat'], {
        cwd,
        signal: context.abortController.signal,
      }),
      execFileNoThrow('git', ['log', '-1', '--oneline'], {
        cwd,
        signal: context.abortController.signal,
      }),
    ])

    // Build response
    let response = '=== Git Repository Snapshot ===\n\n'

    // Status
    response += '## Status (git status --short)\n'
    if (statusResult.exitCode === 0) {
      const status = statusResult.stdout.trim()
      response += status || '(no changes)\n'
    } else {
      response += `Error: ${statusResult.stderr}\n`
    }
    response += '\n'

    // Diff stats
    response += '## Diff Stats (git diff --stat)\n'
    if (diffStatResult.exitCode === 0) {
      const diffStat = diffStatResult.stdout.trim()
      response += diffStat || '(no unstaged changes)\n'
    } else {
      response += `Error: ${diffStatResult.stderr}\n`
    }
    response += '\n'

    // Last commit
    response += '## Last Commit (git log -1 --oneline)\n'
    if (logResult.exitCode === 0) {
      const log = logResult.stdout.trim()
      response += log || '(no commits yet)\n'
    } else {
      response += `Error: ${logResult.stderr}\n`
    }

    return { data: response }
  },
})
