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
  /** When true (default for domain packs), registers a matching built-in Skill tool entry. */
  loadable?: boolean
  skillDescription?: string
  workflow?: string
  categories?: string[]
  alsoSee?: { name: string; url: string; note: string }[]
}

export function buildCatalogContent(catalog: CatalogDefinition) {
  const browse = catalog.browse ? `- Browse: ${catalog.browse}\n` : ""
  const workflow = catalog.workflow
    ? `\n## Workflow\n\n${catalog.workflow}\n`
    : ""
  const categories = catalog.categories?.length
    ? `\n## Categories\n\n${catalog.categories.join(" · ")}\n`
    : ""
  const alsoSee = catalog.alsoSee?.length
    ? `\n## Also see (pick one upstream repo per task)\n\n${catalog.alsoSee.map((item) => `- **${item.name}**: ${item.url} — ${item.note}`).join("\n")}\n`
    : ""
  return `# ${catalog.displayName}

Upstream: ${catalog.upstream}

## Install

${catalog.install}
${browse}
## Focus

${catalog.focus}
${workflow}${categories}
## Examples (one skill per task)

${catalog.examples.map((item) => `- ${item}`).join("\n")}
${alsoSee}
## Rules

1. Match intent → **one** upstream SKILL.md — never load whole catalogs into context.
2. Read skill from install path; follow repo README for agent compatibility (Claude Code / Cursor / Codex differ).
3. Awakened built-ins (frontend, testing, awakened-subagents, …) win when they already cover the task.
`
}

export function buildCatalogSkillBody(catalog: CatalogDefinition) {
  return buildCatalogContent(catalog).replace(/^# .+\n\n/, `# ${catalog.id} — Upstream Skill Guide\n\n`)
}

/** Famous GitHub skill repos — thin Awakened wrappers, no custom playbooks. */
export const SKILL_CATALOGS: CatalogDefinition[] = [
  {
    id: "awakened-research",
    displayName: "Awakened Research",
    description: "Orchestra AI Research Skills — ML research engineering playbooks",
    priority: 70,
    loadable: true,
    skillDescription:
      "Orchestra-Research/AI-Research-SKILLs guide (98 skills). Use for fine-tuning, RAG, evals, autoresearch, paper writing, or /awakened-research.",
    regex:
      /\b(awakened-research|orchestra[- ]research|ai-research-skills|autoresearch|fine[- ]?tun|lora|qlora|rlhf|dpo|grpo|vllm|megatron|distributed train|rag\b|retrieval|embedding model|benchmark|eval harness|mech(?:anical)? interp|quantiz|inference serv|tokeniz|alignment|safety eval|wandb|mlflow|pytorch lightning|deepspeed|fsdp|trl\b|peft|transformer|gradient checkpoint|paper writing|literature survey|hyperparameter|dataset prep|model arch|post[- ]?train|litreview|grant proposal|prior[- ]art)\b/i,
    upstream: "https://github.com/Orchestra-Research/AI-Research-SKILLs",
    install: "`npx @orchestra-research/ai-research-skills` — skills under `~/.orchestra/skills/`",
    browse: "https://www.orchestra-research.com/ai-research-skills/welcome.md",
    focus: "Idea → experiments → paper. Open-ended research starts with **autoresearch** orchestration.",
    workflow:
      "1. Open-ended research → **autoresearch** skill first.\n2. Pick one domain skill (vLLM, TRL, PEFT, RAG, …) — never load all 98.\n3. Read/Grep/Bash installed SKILL.md paths; run framework commands from skill examples.",
    categories: [
      "Fine-Tuning",
      "Post-Training",
      "Distributed Training",
      "Inference",
      "RAG",
      "Agents",
      "Multimodal",
      "MLOps",
      "Mech Interp",
      "Evaluation",
      "Safety",
      "ML Paper Writing",
    ],
    examples: ["autoresearch", "vllm", "trl", "peft", "rag", "wandb", "ml-paper-writing"],
  },
  {
    id: "awakened-marketing",
    displayName: "Awakened Marketing",
    description: "Famous GitHub marketing & GTM skill packs (growth, enterprise ops, DTC)",
    priority: 68,
    loadable: true,
    skillDescription:
      "Marketing skill catalog guide — coreyhaines31/marketingskills, ericosiu/ai-marketing-skills, thatrebeccarae/claude-marketing. Use for SEO, CRO, outbound, GTM, or /awakened-marketing.",
    regex:
      /\b(awakened-marketing|marketing skill|seo\b|gsc\b|outbound|cold email|linkedin|conversion|cro\b|landing page|icp\b|pipeline|hubspot|sales playbook|gtm|go[- ]?to[- ]?market|a\/b test|growth experiment|content ops|podcast clips?|gong\b|attribution|pricing tier|pitch deck|youtube competitive|newsletter|lead magnet|prospecting|instantly|rb2b|copywriting|funnel|marketingskills|ai-marketing-skills|claude-marketing)\b/i,
    upstream: "https://github.com/coreyhaines31/marketingskills",
    install:
      "Growth/CRO: clone coreyhaines31/marketingskills or follow marketing-skills.com install.\nEnterprise ops: `git clone https://github.com/ericosiu/ai-marketing-skills.git`.\nDTC/paid media: clone thatrebeccarae/claude-marketing.",
    browse: "https://marketing-skills.com/",
    focus: "Pick **one** famous upstream repo by task type — do not merge playbooks.",
    alsoSee: [
      {
        name: "Marketing Skills (coreyhaines31)",
        url: "https://github.com/coreyhaines31/marketingskills",
        note: "CRO, copywriting, SEO, analytics, ab-testing — largest marketing skills repo",
      },
      {
        name: "AI Marketing Skills (ericosiu)",
        url: "https://github.com/ericosiu/ai-marketing-skills",
        note: "Enterprise GTM: growth-engine, outbound-engine, seo-ops, revenue-intelligence",
      },
      {
        name: "Claude Marketing (thatrebeccarae)",
        url: "https://github.com/thatrebeccarae/claude-marketing",
        note: "DTC, Klaviyo, Shopify, GA4, paid media, market-research reports",
      },
    ],
    examples: ["cro", "ab-testing", "growth-engine", "outbound-engine", "market-research", "seo-ops"],
  },
  {
    id: "awakened-growth",
    displayName: "Awakened Growth",
    description: "coreyhaines31 Marketing Skills — CRO, copy, SEO, analytics",
    priority: 67,
    loadable: true,
    skillDescription:
      "coreyhaines31/marketingskills guide. Use for CRO, A/B tests, copywriting, SEO, customer research, or marketing-skills.com installs.",
    regex:
      /\b(awakened-growth|marketingskills|marketing-skills\.com|coreyhaines|page cro|form cro|customer research skill|copywriting skill|analytics skill|growth engineering)\b/i,
    upstream: "https://github.com/coreyhaines31/marketingskills",
    install: "Follow repo README or marketing-skills.com — Agent Skills spec compatible (Claude Code, Cursor, Codex)",
    browse: "https://marketing-skills.com/",
    focus: "Technical marketers & founders — conversion optimization, copy, SEO, analytics",
    examples: ["cro", "ab-testing", "copywriting", "seo", "customer-research", "analytics"],
  },
  {
    id: "awakened-dtc-marketing",
    displayName: "Awakened DTC Marketing",
    description: "thatrebeccarae/claude-marketing — e-commerce & paid media skills",
    priority: 66,
    loadable: true,
    skillDescription:
      "thatrebeccarae/claude-marketing guide. Use for Klaviyo, Shopify, GA4, Looker Studio, paid media, or DTC skill packs.",
    regex:
      /\b(awakened-dtc|claude-marketing|thatrebeccarae|klaviyo|shopify skill|ga4 skill|looker studio|paid media skill|meta ads skill|google ads skill|dtc pack|e-?commerce marketing)\b/i,
    upstream: "https://github.com/thatrebeccarae/claude-marketing",
    install: "Clone repo — pick one skill folder or skill-pack (dtc-pack, paid-media-pack, strategy-pack)",
    focus: "DTC e-commerce, paid media, analytics dashboards, market-research reports",
    examples: ["klaviyo-analyst", "shopify", "google-analytics", "market-research", "meta-ads", "pro-deck-builder"],
  },
  {
    id: "awakened-business",
    displayName: "Awakened Business",
    description: "alirezarezvani/claude-skills — 313+ cross-domain agent skills",
    priority: 62,
    loadable: true,
    skillDescription:
      "alirezarezvani/claude-skills guide. Use for C-level advisory, compliance, finance, product, or hybrid research/marketing routers.",
    regex:
      /\b(awakened-business|alirezarezvani|claude-skills repo|c-level skill|compliance skill|finance skill pod|aeo skill|answer engine optimization|litreview skill|grants skill|patent skill|notebooklm skill)\b/i,
    upstream: "https://github.com/alirezarezvani/claude-skills",
    install: "Clone alirezarezvani/claude-skills — pick one pod (marketing-skill/, research/, engineering/, …)",
    focus: "Engineering, marketing pods, research stack (litreview, grants, patent), compliance, C-level personas",
    examples: ["marketing-skill router", "litreview", "grants", "aeo", "cfo-persona", "compliance"],
  },
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
    regex:
      /\b(anthropic skills|anthropics\/skills|official anthropic skill|claude official skill|document skill|pptx skill)\b/i,
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
    id: "awakened-mcp-skills",
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

export const LOADABLE_UPSTREAM_CATALOGS = SKILL_CATALOGS.filter((catalog) => catalog.loadable !== false && catalog.skillDescription)
