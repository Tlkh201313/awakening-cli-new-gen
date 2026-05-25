import path from "path"
import { pathToFileURL } from "url"
import { Effect, Schema } from "effect"
import * as Stream from "effect/Stream"
import { Ripgrep } from "../file/ripgrep"
import { Skill } from "../skill"
import * as Tool from "./tool"
import DESCRIPTION from "./skill.txt"

const MAX_SKILL_CONTENT = 8 * 1024
const SKILL_FILE_LIMIT = 10

export const Parameters = Schema.Struct({
  name: Schema.String.annotate({ description: "The name of the skill from available_skills" }),
})

function trimSkillContent(content: string) {
  if (content.length <= MAX_SKILL_CONTENT) return content.trim()
  return `${content.slice(0, MAX_SKILL_CONTENT).trim()}\n\n...(skill truncated — inspect bundled files for full instructions)`
}

export const SkillTool = Tool.define(
  "skill",
  Effect.gen(function* () {
    const skill = yield* Skill.Service
    const rg = yield* Ripgrep.Service

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const info = yield* skill
            .require(params.name)
            .pipe(Effect.catchTag("Skill.NotFoundError", (error) => Effect.die(new Error(error.message))))

          yield* ctx.ask({
            permission: "skill",
            patterns: [params.name],
            always: [params.name],
            metadata: {},
          })

          const dir = path.dirname(info.location)
          const base = pathToFileURL(dir).href
          const files = yield* rg
            .files({
              cwd: dir,
              follow: false,
              hidden: false,
              glob: ["scripts/**", "reference/**", "*.md", "templates/**", "assets/**"],
              signal: ctx.abort,
            })
            .pipe(
              Stream.filter(
                (file) =>
                  !file.includes("SKILL.md") &&
                  !file.includes("node_modules/") &&
                  !file.includes(".git/"),
              ),
              Stream.map((file) => path.resolve(dir, file)),
              Stream.take(SKILL_FILE_LIMIT),
              Stream.runCollect,
              Effect.map((chunk) => [...chunk].map((file) => `<file>${file}</file>`).join("\n")),
            )

          return {
            title: `Loaded skill: ${info.name}`,
            output: [
              `<skill_content name="${info.name}">`,
              `# Skill: ${info.name}`,
              "",
              trimSkillContent(info.content),
              "",
              `Base directory for this skill: ${base}`,
              "Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.",
              "Note: file list is sampled from scripts/, reference/, and bundled markdown.",
              "",
              "<skill_files>",
              files,
              "</skill_files>",
              "</skill_content>",
            ].join("\n"),
            metadata: {
              name: info.name,
              dir,
            },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
