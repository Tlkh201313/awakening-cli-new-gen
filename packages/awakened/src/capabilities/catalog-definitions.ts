export type CatalogDefinition = {
  id: string
  displayName: string
  description: string
  priority: number
  regex: RegExp
  upstream: string
  install: string
  browse?: string
  focus: string
  examples: string[]
}

export const SKILL_CATALOGS: CatalogDefinition[] = [
  {
    id: "awakened-cursor",
    displayName: "Cursor Skills Directory",
    description: "skills.sh & Cursor agent skill ecosystem",
    priority: 64,
    regex:
      /\b(skills\.sh|cursor skills|cursor directory|npx skills add|add skill cursor|cursor agent skill|skills directory)\b/i,
    upstream: "https://skills.sh/",
    install: "npx skills add <owner/repo> — or browse skills.sh for Cursor-compatible SKILL.md packages",
    browse: "https://skills.sh/",
    focus: "Cursor / Codex / Claude Code skill installs from the open directory",
    examples: ["react-best-practices", "nextjs-best-practices", "vercel deploy"],
  },
  {
    id: "awakened-composio",
    displayName: "Composio Skills",
    description: "Composio integration & automation skills",
    priority: 63,
    regex: /\b(composio|composiohq|tool router|integration skill|slack skill|github skill composio)\b/i,
    upstream: "https://github.com/ComposioHQ/awesome-claude-skills",
    install: "Clone ComposioHQ/awesome-claude-skills — pick one SKILL.md per integration task",
    focus: "SaaS integrations (Slack, GitHub, Gmail, Linear, …) via Composio toolkits",
    examples: ["stripe", "notion", "hubspot", "jira"],
  },
  {
    id: "awakened-anthropic",
    displayName: "Anthropic Official Skills",
    description: "Anthropic-maintained official SKILL.md playbooks",
    priority: 66,
    regex: /\b(anthropic skills|anthropics\/skills|official anthropic skill|claude official skill|document skill|pptx skill)\b/i,
    upstream: "https://github.com/anthropics/skills",
    install: "Clone anthropics/skills — follow README for Claude Code / API agent install paths",
    focus: "First-party Anthropic examples (docx, pdf, pptx, internal comms, brand guidelines)",
    examples: ["docx", "pdf", "pptx", "internal-comms"],
  },
  {
    id: "awakened-vercel",
    displayName: "Vercel Agent Skills",
    description: "Vercel Labs official deployment & Next.js skills",
    priority: 65,
    regex: /\b(vercel-labs|vercel agent skill|vercel skill|deploy to vercel|nextjs skill vercel)\b/i,
    upstream: "https://github.com/vercel-labs/agent-skills",
    install: "Clone vercel-labs/agent-skills or install via officialskills.sh / npx skills",
    browse: "https://officialskills.sh/",
    focus: "Vercel deploy, Next.js, React performance, Turborepo patterns",
    examples: ["vercel-deploy", "nextjs", "react-best-practices"],
  },
  {
    id: "awakened-github-awesome",
    displayName: "Awesome Claude Skills",
    description: "Community curated awesome lists on GitHub",
    priority: 58,
    regex:
      /\b(awesome-claude-skills|awesome claude code|awesome agent skills list|awesome cursor skills|travisvn|punkpeye awesome)\b/i,
    upstream: "https://github.com/travisvn/awesome-claude-skills",
    install: "Pick ONE skill from the awesome list README — clone source repo for SKILL.md",
    focus: "Community indexes linking to domain-specific skill repos",
    examples: ["security", "testing", "docs", "data"],
  },
  {
    id: "awakened-design",
    displayName: "Design & UX Skills",
    description: "UI/UX, frontend-design, Tailwind, accessibility",
    priority: 62,
    regex:
      /\b(frontend-design|ui-ux|ui designer|tailwind patterns|design system skill|accessibility skill|form cro|brand design)\b/i,
    upstream: "https://github.com/sickn33/antigravity-awesome-skills (design bundle)",
    install: "npx antigravity-awesome-skills — then Use @frontend-design, @tailwind-patterns, @form-cro",
    focus: "Visual design, UX flows, Tailwind v4, WCAG, CRO forms — one @-skill per task",
    examples: ["@frontend-design", "@tailwind-patterns", "@ui-ux-pro-max"],
  },
  {
    id: "awakened-devops",
    displayName: "DevOps & SRE Skills",
    description: "K8s, Terraform, CI/CD, observability playbooks",
    priority: 61,
    regex:
      /\b(devops skill|sre skill|kubernetes skill|terraform skill|docker skill|github actions skill|datadog skill|grafana skill)\b/i,
    upstream: "https://github.com/VoltAgent/awesome-agent-skills + antigravity DevOps @-skills",
    install: "Browse officialskills.sh for aws/k8s/terraform OR antigravity @kubernetes-architect",
    focus: "Infrastructure, CI/CD, observability — official vendor skills preferred",
    examples: ["kubernetes", "terraform", "github-actions", "datadog"],
  },
  {
    id: "awakened-ai-ml",
    displayName: "AI / ML Engineering Skills",
    description: "LLM apps, RAG, evals, fine-tuning playbooks",
    priority: 60,
    regex:
      /\b(llm skill|rag skill|prompt engineering skill|fine-tune skill|langchain skill|huggingface skill|mlops skill|eval skill)\b/i,
    upstream: "https://github.com/VoltAgent/awesome-agent-skills (AI/ML section)",
    install: "Pick one AI/ML SKILL.md from VoltAgent catalog or antigravity @research / @data-science",
    focus: "RAG, evals, prompt optimization, model deployment — not generic coding",
    examples: ["rag", "prompt-engineering", "mlops", "evals"],
  },
  {
    id: "awakened-mcp",
    displayName: "MCP & Tool Skills",
    description: "Model Context Protocol servers & tool-building",
    priority: 59,
    regex: /\b(mcp skill|model context protocol skill|mcp server skill|tool builder skill|awesome mcp)\b/i,
    upstream: "https://github.com/punkpeye/awesome-mcp-servers",
    install: "Use MCP docs + one SKILL.md for MCP authoring — see awakened MCP config for servers",
    focus: "Building/connecting MCP servers, not loading entire awesome lists",
    examples: ["mcp-builder", "stdio server", "sse transport"],
  },
  {
    id: "awakened-claude-plugins",
    displayName: "Claude Code Plugins",
    description: "Plugin marketplace & superpowers bundles",
    priority: 64,
    regex:
      /\b(claude code plugin|claude plugin marketplace|superpowers marketplace|obra superpowers|plugin skill bundle|claude-plugins-official)\b/i,
    upstream: "https://github.com/obra/superpowers + Claude Code plugin marketplace",
    install: "Install superpowers plugin OR marketplace plugin — load one skill per task via /skill-name",
    focus: "TDD superpowers, brainstorming, code review plugins — bundled plugin workflows",
    examples: ["superpowers", "brainstorming", "test-driven-development"],
  },
]
