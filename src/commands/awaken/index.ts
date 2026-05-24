import type { Command } from '../../commands.js'

const awaken = {
  name: 'awaken',
  aliases: ['awake'],
  description:
    'Agent harness: orchestration, init, verification, curated plugins',
  type: 'prompt',
  progressMessage: 'running agent harness',
  contentLength: 0,
  source: 'builtin' as const,
  async getPromptForCommand(args?: string) {
    const { AWAKEN_PROMPT } = await import('./awaken.js')
    return [{ type: 'text' as const, text: AWAKEN_PROMPT(args) }]
  },
} satisfies Command

export default awaken
