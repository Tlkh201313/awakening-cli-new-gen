import { AWAKENED_CAPABILITY_IDS } from "../ids"
import type { AutoCapabilityDefinition } from "../types"

const RESEARCH_RE =
  /\b(fine[- ]?tun|lora|qlora|rlhf|dpo|grpo|vllm|megatron|distributed train|rag\b|retrieval|embedding model|benchmark|eval harness|autoresearch|mech(?:anical)? interp|quantiz|inference serv|tokeniz|alignment|safety eval|wandb|mlflow|pytorch lightning|deepspeed|fsdp|trl\b|peft|transformer|gradient checkpoint|paper writing|literature survey|hyperparameter|dataset prep|model arch|post[- ]?train)\b/i

export const awakenedResearchCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.research,
  displayName: "Awakened Research",
  description: "Orchestra AI Research Skills — ML research engineering playbooks",
  priority: 70,
  shouldActivate({ userText }) {
    return RESEARCH_RE.test(userText)
  },
  getContent() {
    return `# Awakened Research

Upstream: https://github.com/Orchestra-Research/AI-Research-SKILLs (98 skills, idea → experiments → paper).

## Install

\`\`\`bash
npx @orchestra-research/ai-research-skills
\`\`\`

Skills install under \`~/.orchestra/skills/\`. Welcome doc: https://www.orchestra-research.com/ai-research-skills/welcome.md

## Workflow

1. Open-ended research → **autoresearch** orchestration skill first.
2. Pick one domain skill (vLLM, TRL, PEFT, RAG, etc.) — never load all 98.
3. **Read/Grep/Bash** on installed SKILL.md paths; run framework commands from skill examples.

## Categories

Fine-Tuning, Post-Training, Distributed Training, Inference, RAG, Agents, Multimodal, MLOps, Mech Interp, Evaluation, Safety, ML Paper Writing.
`
  },
}
