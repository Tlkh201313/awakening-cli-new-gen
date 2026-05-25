import path from "path"
import { pathToFileURL } from "url"
import { Effect, Layer, Context, Schema } from "effect"
import { NamedError } from "@awakened-ai/core/util/error"
import type { Agent } from "@/agent/agent"
import { Bus } from "@/bus"
import { InstanceState } from "@/effect/instance-state"
import { Global } from "@awakened-ai/core/global"
import { Permission } from "@/permission"
import { AppFileSystem } from "@awakened-ai/core/filesystem"
import { Config } from "@/config/config"
import { ConfigMarkdown } from "@/config/markdown"
import { RuntimeFlags } from "@/effect/runtime-flags"
import { Glob } from "@awakened-ai/core/util/glob"
import * as Log from "@awakened-ai/core/util/log"
import { Discovery } from "./discovery"
import AWAKENED_SUBAGENTS_SKILL_BODY from "./prompt/awakened-subagents.md" with { type: "text" }
import CUSTOMIZE_AWAKENED_SKILL_BODY from "./prompt/customize-awakened.md" with { type: "text" }
import GRAPHIFY_SKILL_BODY from "./prompt/graphify.md" with { type: "text" }
import PRODUCTIVITY_SKILL_BODY from "./prompt/productivity.md" with { type: "text" }
import SUPERPOWERS_SKILL_BODY from "./prompt/superpowers.md" with { type: "text" }
import SECURITY_REVIEW_SKILL_BODY from "./prompt/security-review.md" with { type: "text" }
import BRAINSTORMING_SKILL_BODY from "./prompt/brainstorming.md" with { type: "text" }
import WEBAPP_TESTING_SKILL_BODY from "./prompt/webapp-testing.md" with { type: "text" }
import CODE_REVIEW_SKILL_BODY from "./prompt/code-review.md" with { type: "text" }
import AWS_CLOUD_SKILL_BODY from "./prompt/aws-cloud.md" with { type: "text" }
import DOCS_WRITER_SKILL_BODY from "./prompt/docs-writer.md" with { type: "text" }
import FRONTEND_SKILL_BODY from "./prompt/frontend.md" with { type: "text" }
import CONTEXT7_SKILL_BODY from "./prompt/context7.md" with { type: "text" }
import TESTING_SKILL_BODY from "./prompt/testing.md" with { type: "text" }
import SIMPLIFY_SKILL_BODY from "./prompt/simplify.md" with { type: "text" }
import CURSOR_SKILLS_SKILL_BODY from "./prompt/cursor-skills.md" with { type: "text" }
import COMPOSIO_SKILLS_SKILL_BODY from "./prompt/composio-skills.md" with { type: "text" }
import ANTHROPIC_SKILLS_SKILL_BODY from "./prompt/anthropic-skills.md" with { type: "text" }
import VERCEL_SKILLS_SKILL_BODY from "./prompt/vercel-skills.md" with { type: "text" }
import SKILLS_CATALOG_SKILL_BODY from "./prompt/skills-catalog.md" with { type: "text" }
import OBSIDIAN_SKILL_BODY from "./prompt/obsidian.md" with { type: "text" }
import SELF_IMPROVEMENT_SKILL_BODY from "./prompt/self-improvement.md" with { type: "text" }
import AWAKENED_MEM_SKILL_BODY from "./prompt/awakened-mem.md" with { type: "text" }
import MEM_SEARCH_SKILL_BODY from "./prompt/mem-search.md" with { type: "text" }
import AWAKENED_TASTE_SKILL_BODY from "./prompt/awakened-taste.md" with { type: "text" }
import { buildCatalogSkillBody, LOADABLE_UPSTREAM_CATALOGS } from "@/capabilities/catalog-definitions"
import { isRecord } from "@/util/record"

const log = Log.create({ service: "skill" })
const CLAUDE_EXTERNAL_DIR = ".claude"
const AGENTS_EXTERNAL_DIR = ".agents"
const EXTERNAL_SKILL_PATTERN = "skills/**/SKILL.md"
const AWAKENED_SKILL_PATTERN = "{skill,skills}/**/SKILL.md"
const SKILL_PATTERN = "**/SKILL.md"

// Built-in skill that ships with awakened. The model's intuition for what an
// awakened.json should look like is often wrong, and awakened hard-fails on
// invalid config, so users hit cryptic startup errors. Loading this skill
// when the model is asked to touch awakened's own config files gives it the
// actual schemas instead of guesses.
const CUSTOMIZE_AWAKENED_SKILL_NAME = "customize-awakened"
const CUSTOMIZE_AWAKENED_SKILL_DESCRIPTION =
  "Use ONLY when the user is editing or creating awakened's own configuration: awakened.json, awakened.jsonc, files under .awakened/, or files under ~/.config/awakened/. Also use when creating or fixing awakened agents, subagents, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring awakened itself."

const AWAKENED_SUBAGENTS_SKILL_NAME = "awakened-subagents"
const AWAKENED_SUBAGENTS_SKILL_DESCRIPTION =
  "Native subagent routing (VoltAgent awesome-claude-code-subagents fork). MUST dispatch task tool — orchestrator, builder, explore, reviewer, etc. Use for multi-step work or /awakened-subagents."

const AWAKEN_SKILL_NAME = "awaken"
const AWAKEN_SKILL_DESCRIPTION =
  "Deprecated alias for awakened-subagents. Use awakened-subagents instead."

const GRAPHIFY_SKILL_NAME = "graphify"
const GRAPHIFY_SKILL_DESCRIPTION =
  "Knowledge graph quick guide for large codebase exploration. Use when mapping repos, reducing token usage, or running graphify commands."

const PRODUCTIVITY_SKILL_NAME = "productivity"
const PRODUCTIVITY_SKILL_DESCRIPTION =
  "VoltAgent / officialskills productivity skill catalog guide. Use when browsing or installing hand-picked official-team agent skills."

const SUPERPOWERS_SKILL_NAME = "superpowers"
const SUPERPOWERS_SKILL_DESCRIPTION =
  "TDD-first agent methodology adapted for awakened. Use before creative work, features, or when the user asks for test-driven development or superpowers workflow."

const SECURITY_REVIEW_SKILL_NAME = "security-review"
const SECURITY_REVIEW_SKILL_DESCRIPTION =
  "Security audit workflow for awakened agents. Use for security reviews, OWASP checks, threat modeling, or vulnerability assessment."

const BRAINSTORMING_SKILL_NAME = "brainstorming"
const BRAINSTORMING_SKILL_DESCRIPTION =
  "Structured brainstorming before implementation. Use before building features, components, or behavior changes when design choices matter."

const WEBAPP_TESTING_SKILL_NAME = "webapp-testing"
const WEBAPP_TESTING_SKILL_DESCRIPTION =
  "Playwright and E2E webapp testing playbook. Use for browser tests, UI regression, or flaky test debugging."

const CODE_REVIEW_SKILL_NAME = "code-review"
const CODE_REVIEW_SKILL_DESCRIPTION =
  "Structured PR and diff review. Use when reviewing changes, pull requests, or pre-merge quality checks."

const AWS_CLOUD_SKILL_NAME = "aws-cloud"
const AWS_CLOUD_SKILL_DESCRIPTION =
  "AWS infrastructure playbook with least-privilege guardrails. Use for Lambda, S3, IAM, CDK, Terraform on AWS."

const DOCS_WRITER_SKILL_NAME = "docs-writer"
const DOCS_WRITER_SKILL_DESCRIPTION =
  "Technical documentation and README writing. Use for API docs, changelogs, and developer guides."

const FRONTEND_SKILL_NAME = "frontend"
const FRONTEND_SKILL_DESCRIPTION =
  "React, Next.js, Tailwind, and accessible UI patterns. Use for component work and frontend architecture."

const CONTEXT7_SKILL_NAME = "context7"
const CONTEXT7_SKILL_DESCRIPTION =
  "Up-to-date library docs via Context7 MCP. Use when answering framework or npm API questions."

const TESTING_SKILL_NAME = "testing"
const TESTING_SKILL_DESCRIPTION =
  "Unit and integration test execution and authoring. Use when writing or running tests in awakened packages."

const SIMPLIFY_SKILL_NAME = "simplify"
const SIMPLIFY_SKILL_DESCRIPTION =
  "Reduce complexity and remove dead code without changing behavior. Use for refactors focused on clarity."

const OBSIDIAN_SKILL_NAME = "obsidian"
const OBSIDIAN_SKILL_DESCRIPTION =
  "Obsidian vault via mcp-obsidian MCP. Use for note search, meeting summaries, vault append/patch, or easy Local REST API setup."

const SELF_IMPROVEMENT_SKILL_NAME = "self-improvement"
const SELF_IMPROVEMENT_SKILL_DESCRIPTION =
  "Session learnings → AGENTS.md, /learn, /init, and memory. Use after debugging breakthroughs or when codifying repo conventions."

const AWAKENED_MEM_SKILL_NAME = "awakened-mem"
const AWAKENED_MEM_SKILL_DESCRIPTION =
  "Awakened Memory (Claude-mem style). Save decisions, bugfixes, and discoveries every turn via mem_save; mem_search before re-deciding."

const MEM_SEARCH_SKILL_NAME = "mem-search"
const MEM_SEARCH_SKILL_DESCRIPTION =
  "Search awakened-memory across sessions. Use when user asks 'did we already fix this?' or before reversing prior work."

const AWAKENED_TASTE_SKILL_NAME = "awakened-taste"
const AWAKENED_TASTE_SKILL_DESCRIPTION =
  "Premium anti-slop UI (Taste-Skill fork). Use for landings, dashboards, redesigns — layout, typography, motion; not generic AI templates."

const CURSOR_SKILLS_SKILL_NAME = "cursor-skills"
const CURSOR_SKILLS_SKILL_DESCRIPTION =
  "skills.sh and Cursor agent skill directory guide. Use for npx skills add, skills.sh browse, or Cursor-compatible SKILL.md installs."

const COMPOSIO_SKILLS_SKILL_NAME = "composio-skills"
const COMPOSIO_SKILLS_SKILL_DESCRIPTION =
  "ComposioHQ awesome-claude-skills guide. Use for SaaS integrations (Slack, GitHub, Stripe, Notion, …) via Composio."

const ANTHROPIC_SKILLS_SKILL_NAME = "anthropic-skills"
const ANTHROPIC_SKILLS_SKILL_DESCRIPTION =
  "Anthropic official skills repo guide. Use for docx, pdf, pptx, and first-party Anthropic SKILL.md workflows."

const VERCEL_SKILLS_SKILL_NAME = "vercel-skills"
const VERCEL_SKILLS_SKILL_DESCRIPTION =
  "Vercel Labs agent-skills and officialskills.sh guide. Use for Vercel deploy, Next.js, and React performance skills."

const SKILLS_CATALOG_SKILL_NAME = "skills-catalog"
const SKILLS_CATALOG_SKILL_DESCRIPTION =
  "Master index of famous GitHub skill catalogs (skills.sh, Anthropic, Vercel, Composio, VoltAgent, antigravity). Use when browsing skills without a specific repo."

const UPSTREAM_CATALOG_SKILLS = LOADABLE_UPSTREAM_CATALOGS.map(
  (catalog) => [catalog.id, catalog.skillDescription ?? catalog.description, buildCatalogSkillBody(catalog)] as const,
)

const BUILT_IN_SKILLS = [
  [CUSTOMIZE_AWAKENED_SKILL_NAME, CUSTOMIZE_AWAKENED_SKILL_DESCRIPTION, CUSTOMIZE_AWAKENED_SKILL_BODY],
  [AWAKENED_SUBAGENTS_SKILL_NAME, AWAKENED_SUBAGENTS_SKILL_DESCRIPTION, AWAKENED_SUBAGENTS_SKILL_BODY],
  [AWAKEN_SKILL_NAME, AWAKEN_SKILL_DESCRIPTION, AWAKENED_SUBAGENTS_SKILL_BODY],
  [GRAPHIFY_SKILL_NAME, GRAPHIFY_SKILL_DESCRIPTION, GRAPHIFY_SKILL_BODY],
  [PRODUCTIVITY_SKILL_NAME, PRODUCTIVITY_SKILL_DESCRIPTION, PRODUCTIVITY_SKILL_BODY],
  [SUPERPOWERS_SKILL_NAME, SUPERPOWERS_SKILL_DESCRIPTION, SUPERPOWERS_SKILL_BODY],
  [SECURITY_REVIEW_SKILL_NAME, SECURITY_REVIEW_SKILL_DESCRIPTION, SECURITY_REVIEW_SKILL_BODY],
  [BRAINSTORMING_SKILL_NAME, BRAINSTORMING_SKILL_DESCRIPTION, BRAINSTORMING_SKILL_BODY],
  [WEBAPP_TESTING_SKILL_NAME, WEBAPP_TESTING_SKILL_DESCRIPTION, WEBAPP_TESTING_SKILL_BODY],
  [CODE_REVIEW_SKILL_NAME, CODE_REVIEW_SKILL_DESCRIPTION, CODE_REVIEW_SKILL_BODY],
  [AWS_CLOUD_SKILL_NAME, AWS_CLOUD_SKILL_DESCRIPTION, AWS_CLOUD_SKILL_BODY],
  [DOCS_WRITER_SKILL_NAME, DOCS_WRITER_SKILL_DESCRIPTION, DOCS_WRITER_SKILL_BODY],
  [FRONTEND_SKILL_NAME, FRONTEND_SKILL_DESCRIPTION, FRONTEND_SKILL_BODY],
  [CONTEXT7_SKILL_NAME, CONTEXT7_SKILL_DESCRIPTION, CONTEXT7_SKILL_BODY],
  [TESTING_SKILL_NAME, TESTING_SKILL_DESCRIPTION, TESTING_SKILL_BODY],
  [SIMPLIFY_SKILL_NAME, SIMPLIFY_SKILL_DESCRIPTION, SIMPLIFY_SKILL_BODY],
  [OBSIDIAN_SKILL_NAME, OBSIDIAN_SKILL_DESCRIPTION, OBSIDIAN_SKILL_BODY],
  [SELF_IMPROVEMENT_SKILL_NAME, SELF_IMPROVEMENT_SKILL_DESCRIPTION, SELF_IMPROVEMENT_SKILL_BODY],
  [AWAKENED_MEM_SKILL_NAME, AWAKENED_MEM_SKILL_DESCRIPTION, AWAKENED_MEM_SKILL_BODY],
  [MEM_SEARCH_SKILL_NAME, MEM_SEARCH_SKILL_DESCRIPTION, MEM_SEARCH_SKILL_BODY],
  [AWAKENED_TASTE_SKILL_NAME, AWAKENED_TASTE_SKILL_DESCRIPTION, AWAKENED_TASTE_SKILL_BODY],
  [CURSOR_SKILLS_SKILL_NAME, CURSOR_SKILLS_SKILL_DESCRIPTION, CURSOR_SKILLS_SKILL_BODY],
  [COMPOSIO_SKILLS_SKILL_NAME, COMPOSIO_SKILLS_SKILL_DESCRIPTION, COMPOSIO_SKILLS_SKILL_BODY],
  [ANTHROPIC_SKILLS_SKILL_NAME, ANTHROPIC_SKILLS_SKILL_DESCRIPTION, ANTHROPIC_SKILLS_SKILL_BODY],
  [VERCEL_SKILLS_SKILL_NAME, VERCEL_SKILLS_SKILL_DESCRIPTION, VERCEL_SKILLS_SKILL_BODY],
  ...UPSTREAM_CATALOG_SKILLS,
  [SKILLS_CATALOG_SKILL_NAME, SKILLS_CATALOG_SKILL_DESCRIPTION, SKILLS_CATALOG_SKILL_BODY],
] as const

export const Info = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  location: Schema.String,
  content: Schema.String,
})
export type Info = Schema.Schema.Type<typeof Info>

const Issue = Schema.StructWithRest(
  Schema.Struct({
    message: Schema.String,
    path: Schema.Array(Schema.String),
  }),
  [Schema.Record(Schema.String, Schema.Unknown)],
)

function isSkillFrontmatter(data: unknown): data is { name: string; description?: string } {
  return (
    isRecord(data) &&
    typeof data.name === "string" &&
    (data.description === undefined || typeof data.description === "string")
  )
}

export class InvalidError extends Schema.TaggedErrorClass<InvalidError>()("SkillInvalidError", {
  path: Schema.String,
  message: Schema.optional(Schema.String),
  issues: Schema.optional(Schema.Array(Issue)),
}) {}

export class NameMismatchError extends Schema.TaggedErrorClass<NameMismatchError>()("SkillNameMismatchError", {
  path: Schema.String,
  expected: Schema.String,
  actual: Schema.String,
}) {}

export class NotFoundError extends Schema.TaggedErrorClass<NotFoundError>()("Skill.NotFoundError", {
  name: Schema.String,
  available: Schema.Array(Schema.String),
}) {
  override get message() {
    return `Skill "${this.name}" not found. Available skills: ${this.available.join(", ") || "none"}`
  }
}

type State = {
  skills: Record<string, Info>
  dirs: Set<string>
}

type DiscoveryState = {
  matches: string[]
  dirs: string[]
}

type ScanState = {
  matches: Set<string>
  dirs: Set<string>
}

export interface Interface {
  readonly get: (name: string) => Effect.Effect<Info | undefined>
  readonly require: (name: string) => Effect.Effect<Info, NotFoundError>
  readonly all: () => Effect.Effect<Info[]>
  readonly dirs: () => Effect.Effect<string[]>
  readonly available: (agent?: Agent.Info) => Effect.Effect<Info[]>
}

const add = Effect.fnUntraced(function* (state: State, match: string, bus: Bus.Interface) {
  const md = yield* Effect.tryPromise({
    try: () => ConfigMarkdown.parse(match),
    catch: (err) => err,
  }).pipe(
    Effect.catch(
      Effect.fnUntraced(function* (err) {
        const message = ConfigMarkdown.FrontmatterError.isInstance(err)
          ? err.data.message
          : `Failed to parse skill ${match}`
        const { Session } = yield* Effect.promise(() => import("@/session/session"))
        yield* bus.publish(Session.Event.Error, { error: new NamedError.Unknown({ message }).toObject() })
        log.error("failed to load skill", { skill: match, err })
        return undefined
      }),
    ),
  )

  if (!md) return

  if (!isSkillFrontmatter(md.data)) return

  if (state.skills[md.data.name]) {
    log.warn("duplicate skill name", {
      name: md.data.name,
      existing: state.skills[md.data.name].location,
      duplicate: match,
    })
  }

  state.dirs.add(path.dirname(match))
  state.skills[md.data.name] = {
    name: md.data.name,
    description: md.data.description,
    location: match,
    content: md.content,
  }
})

const scan = Effect.fnUntraced(function* (
  state: ScanState,
  root: string,
  pattern: string,
  opts?: { dot?: boolean; scope?: string },
) {
  const matches = yield* Effect.tryPromise({
    try: () =>
      Glob.scan(pattern, {
        cwd: root,
        absolute: true,
        include: "file",
        symlink: true,
        dot: opts?.dot,
      }),
    catch: (error) => error,
  }).pipe(
    Effect.catch((error) => {
      if (!opts?.scope) return Effect.die(error)
      log.error(`failed to scan ${opts.scope} skills`, { dir: root, error })
      return Effect.succeed([] as string[])
    }),
  )

  for (const match of matches) {
    state.matches.add(match)
    state.dirs.add(path.dirname(match))
  }
})

const discoverSkills = Effect.fnUntraced(function* (
  config: Config.Interface,
  discovery: Discovery.Interface,
  fsys: AppFileSystem.Interface,
  global: Global.Interface,
  disableExternalSkills: boolean,
  disableClaudeCodeSkills: boolean,
  directory: string,
  worktree: string,
) {
  const state: ScanState = { matches: new Set(), dirs: new Set() }

  const externalDirs: string[] = []
  if (!disableExternalSkills) {
    if (!disableClaudeCodeSkills) externalDirs.push(CLAUDE_EXTERNAL_DIR)
    externalDirs.push(AGENTS_EXTERNAL_DIR)

    for (const dir of externalDirs) {
      const root = path.join(global.home, dir)
      if (!(yield* fsys.isDir(root))) continue
      yield* scan(state, root, EXTERNAL_SKILL_PATTERN, { dot: true, scope: "global" })
    }

    const upDirs = yield* fsys
      .up({ targets: externalDirs, start: directory, stop: worktree })
      .pipe(Effect.catch(() => Effect.succeed([] as string[])))

    for (const root of upDirs) {
      yield* scan(state, root, EXTERNAL_SKILL_PATTERN, { dot: true, scope: "project" })
    }
  }

  const configDirs = yield* config.directories()
  for (const dir of configDirs) {
    yield* scan(state, dir, AWAKENED_SKILL_PATTERN)
  }

  const cfg = yield* config.get()
  for (const item of cfg.skills?.paths ?? []) {
    const expanded = item.startsWith("~/") ? path.join(global.home, item.slice(2)) : item
    const dir = path.isAbsolute(expanded) ? expanded : path.join(directory, expanded)
    if (!(yield* fsys.isDir(dir))) {
      log.warn("skill path not found", { path: dir })
      continue
    }

    yield* scan(state, dir, SKILL_PATTERN)
  }

  for (const url of cfg.skills?.urls ?? []) {
    const pulledDirs = yield* discovery.pull(url)
    for (const dir of pulledDirs) {
      yield* scan(state, dir, SKILL_PATTERN)
    }
  }

  return {
    matches: Array.from(state.matches),
    dirs: Array.from(state.dirs),
  }
})

const loadSkills = Effect.fnUntraced(function* (state: State, discovered: DiscoveryState, bus: Bus.Interface) {
  yield* Effect.forEach(discovered.matches, (match) => add(state, match, bus), {
    concurrency: "unbounded",
    discard: true,
  })

  log.info("init", { count: Object.keys(state.skills).length })
})

export class Service extends Context.Service<Service, Interface>()("@awakened/Skill") {}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const discovery = yield* Discovery.Service
    const config = yield* Config.Service
    const bus = yield* Bus.Service
    const fsys = yield* AppFileSystem.Service
    const global = yield* Global.Service
    const flags = yield* RuntimeFlags.Service
    const discovered = yield* InstanceState.make(
      Effect.fn("Skill.discovery")(function* (ctx) {
        return yield* discoverSkills(
          config,
          discovery,
          fsys,
          global,
          flags.disableExternalSkills,
          flags.disableClaudeCodeSkills,
          ctx.directory,
          ctx.worktree,
        )
      }),
    )
    const state = yield* InstanceState.make(
      Effect.fn("Skill.state")(function* () {
        const s: State = { skills: {}, dirs: new Set() }
        // Register built-in skills BEFORE disk discovery so user-disk skills can override.
        for (const [name, description, content] of BUILT_IN_SKILLS) {
          s.skills[name] = { name, description, location: "<built-in>", content }
        }
        yield* loadSkills(s, yield* InstanceState.get(discovered), bus)
        return s
      }),
    )

    const get = Effect.fn("Skill.get")(function* (name: string) {
      const s = yield* InstanceState.get(state)
      return s.skills[name]
    })

    const require = Effect.fn("Skill.require")(function* (name: string) {
      const s = yield* InstanceState.get(state)
      const info = s.skills[name]
      if (info) return info
      return yield* new NotFoundError({ name, available: Object.keys(s.skills).toSorted() })
    })

    const all = Effect.fn("Skill.all")(function* () {
      const s = yield* InstanceState.get(state)
      return Object.values(s.skills)
    })

    const dirs = Effect.fn("Skill.dirs")(function* () {
      return (yield* InstanceState.get(discovered)).dirs
    })

    const available = Effect.fn("Skill.available")(function* (agent?: Agent.Info) {
      const s = yield* InstanceState.get(state)
      const list = Object.values(s.skills).toSorted((a, b) => a.name.localeCompare(b.name))
      if (!agent) return list
      return list.filter((skill) => Permission.evaluate("skill", skill.name, agent.permission).action !== "deny")
    })

    return Service.of({ get, require, all, dirs, available })
  }),
)

export const defaultLayer = layer.pipe(
  Layer.provide(Discovery.defaultLayer),
  Layer.provide(Config.defaultLayer),
  Layer.provide(Bus.layer),
  Layer.provide(AppFileSystem.defaultLayer),
  Layer.provide(Global.layer),
  Layer.provide(RuntimeFlags.defaultLayer),
)

export function fmt(list: Info[], opts: { verbose: boolean }) {
  const described = list.filter((skill) => skill.description !== undefined)
  if (described.length === 0) return "No skills are currently available."
  if (opts.verbose) {
    return [
      "<available_skills>",
      ...described
        .toSorted((a, b) => a.name.localeCompare(b.name))
        .flatMap((skill) => [
          "  <skill>",
          `    <name>${skill.name}</name>`,
          `    <description>${skill.description}</description>`,
          `    <location>${pathToFileURL(skill.location).href}</location>`,
          "  </skill>",
        ]),
      "</available_skills>",
    ].join("\n")
  }

  return [
    "## Available Skills",
    ...described
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .map((skill) => `- **${skill.name}**: ${skill.description}`),
  ].join("\n")
}

export * as Skill from "."
