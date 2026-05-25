import { Flag } from "@awakened-ai/core/flag/flag"
import { Effect } from "effect"
import path from "path"

const preserveExerciseGlobalRoot = !!process.env.AWAKENED_HTTPAPI_EXERCISE_GLOBAL
export const exerciseGlobalRoot =
  process.env.AWAKENED_HTTPAPI_EXERCISE_GLOBAL ??
  path.join(process.env.TMPDIR ?? "/tmp", `awakened-httpapi-global-${process.pid}`)
process.env.XDG_DATA_HOME = path.join(exerciseGlobalRoot, "data")
process.env.XDG_CONFIG_HOME = path.join(exerciseGlobalRoot, "config")
process.env.XDG_STATE_HOME = path.join(exerciseGlobalRoot, "state")
process.env.XDG_CACHE_HOME = path.join(exerciseGlobalRoot, "cache")
process.env.AWAKENED_DISABLE_SHARE = "true"
export const exerciseConfigDirectory = path.join(exerciseGlobalRoot, "config", "awakened")
export const exerciseDataDirectory = path.join(exerciseGlobalRoot, "data", "awakened")

const preserveExerciseDatabase = !!process.env.AWAKENED_HTTPAPI_EXERCISE_DB
export const exerciseDatabasePath =
  process.env.AWAKENED_HTTPAPI_EXERCISE_DB ??
  path.join(process.env.TMPDIR ?? "/tmp", `awakened-httpapi-exercise-${process.pid}.db`)
process.env.AWAKENED_DB = exerciseDatabasePath
Flag.AWAKENED_DB = exerciseDatabasePath

export const original = {
  AWAKENED_SERVER_PASSWORD: Flag.AWAKENED_SERVER_PASSWORD,
  AWAKENED_SERVER_USERNAME: Flag.AWAKENED_SERVER_USERNAME,
}

export const cleanupExercisePaths = Effect.promise(async () => {
  const fs = await import("fs/promises")
  if (!preserveExerciseDatabase) {
    await Promise.all(
      [exerciseDatabasePath, `${exerciseDatabasePath}-wal`, `${exerciseDatabasePath}-shm`].map((file) =>
        fs.rm(file, { force: true }).catch(() => undefined),
      ),
    )
  }
  if (!preserveExerciseGlobalRoot)
    await fs.rm(exerciseGlobalRoot, { recursive: true, force: true }).catch(() => undefined)
})
