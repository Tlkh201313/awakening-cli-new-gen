# GitHub Skills Catalog Guide

Use when the user browses famous skill repos without naming one specifically.

## Major catalogs (pick ONE skill, not the whole list)

| Catalog | URL | Best for |
|---------|-----|----------|
| skills.sh | https://skills.sh/ | Cursor directory, npx skills add |
| Anthropic official | https://github.com/anthropics/skills | docx/pdf/pptx |
| Vercel Labs | https://github.com/vercel-labs/agent-skills | Next.js, deploy |
| Composio | https://github.com/ComposioHQ/awesome-claude-skills | SaaS integrations |
| VoltAgent | https://github.com/VoltAgent/awesome-agent-skills | productivity, devops |
| Antigravity | https://github.com/sickn33/antigravity-awesome-skills | @-skills bundle |
| Orchestra Research | https://github.com/Orchestra-Research/AI-Research-SKILLs | ML research, autoresearch |
| Marketing Skills | https://github.com/coreyhaines31/marketingskills | CRO, SEO, copy |
| AI Marketing (ericosiu) | https://github.com/ericosiu/ai-marketing-skills | enterprise GTM ops |
| Claude Marketing | https://github.com/thatrebeccarae/claude-marketing | DTC, paid media |
| alirezarezvani | https://github.com/alirezarezvani/claude-skills | business, compliance, research pods |
| Awesome Claude | https://github.com/travisvn/awesome-claude-skills | community index |
| Superpowers | https://github.com/obra/superpowers | TDD plugin workflow |
| MCP servers | https://github.com/punkpeye/awesome-mcp-servers | MCP tooling |
| mcp-obsidian | https://github.com/MarkusPfundstein/mcp-obsidian | Obsidian vault (needs Local REST API plugin) |

## Awakened upstream wrappers (load via Skill tool)

awakened-research, awakened-marketing, awakened-growth, awakened-dtc-marketing, awakened-business

## Awakened integrations (load via Skill tool)

obsidian, self-improvement, context7, awakened-mem, mem-search, awakened-taste

## Awakened built-ins (load first when relevant)

awakened-subagents, superpowers, brainstorming, code-review, security-review, testing, webapp-testing, frontend, awakened-taste, docs-writer, aws-cloud, graphify, productivity, simplify, awakened-mem, mem-search

## External UI taste

| Repo | Install |
|------|---------|
| [taste-skill](https://github.com/Leonxlnx/taste-skill) | `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend` |

## Rules

1. Match user intent → one upstream SKILL.md.
2. `/awakened` capability packs auto-route to these catalogs — follow injected pack when present.
3. Never dump README tables into context.
