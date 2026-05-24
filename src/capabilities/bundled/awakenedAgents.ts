import { AWAKENED_CAPABILITY_IDS } from '../ids.js'
import type { AutoCapabilityDefinition } from '../types.js'

// orchestrat\w* → "orchestrate"; subagents? → "subagent(s)" (\\b subagent alone misses plural)
const AGENTS_RE =
  /\b(subagents?|orchestrat\w*|dispatch|multi[\s-]?step|cavecrew|awk3nd|agent[\s-]?harness|agent[\s-]?skills?|verify[\s-]?changes?|init(?:ialize)?[\s-]?(?:this\s+)?repo|bootstrap(?:\s+the)?\s+repo|plugin[\s-]?discover|awesome[\s-]?claude[\s-]?plugins?)\b/i

export const awakenedAgentsCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.agents,
  displayName: 'Awaken',
  description: 'Agent orchestration, init, and plugin discovery playbook',
  priority: 85,
  shouldActivate({ userText }) {
    return AGENTS_RE.test(userText)
  },
  getContent() {
    return [
      '# Awaken Agent Harness',
      '',
      'Invoke Skill `awaken` or run /awaken for agent orchestration playbook.',
      '',
      '## Bootstrap',
      '',
      'If cwd lacks AGENTS.md / CLAUDE.md / .claude/CLAUDE.md → run /init first.',
      '',
      '## Route',
      '',
      'Skill awk3nd-router → match trigger → pick subagent_type (scout/architect/builder/reviewer/security-auditor/doc-writer/verifier).',
      '',
      '## Orchestrate',
      '',
      'Skill awk3nd-orchestrator → parallel when independent, sequential when dependent. ONE plan checkbox per session.',
      '',
      '## Verify',
      '',
      'Skill awk3nd-verify → required on 3+ file edits: build → type-check → lint → tests → link.',
      '',
      '## Plugins',
      '',
      'Curated shortlist via /plugin:',
      '- **obra/superpowers** — agentic skills methodology',
      '- **anthropics/claude-plugins-official** — official plugin directory',
      '- **wshobson/agents** — multi-agent orchestration',
      '- **affaan-m/everything-claude-code** — harness perf/memory',
      '- **sickn33/antigravity-awesome-skills** — 1,400+ skill playbooks',
      '',
      'Pick one plugin per task. Do not load all.',
      '',
      '## Related Packs',
      '',
      'Awakened Browser, Research, Productivity, Skills Vault — toggle via /awakened.',
    ].join('\n')
  },
}
