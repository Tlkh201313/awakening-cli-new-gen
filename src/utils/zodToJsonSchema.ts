/**
 * Converts Zod v4 schemas to JSON Schema using native toJSONSchema.
 */

import { toJSONSchema, type ZodTypeAny } from 'zod/v4'

export type JsonSchema7Type = Record<string, unknown>

// toolToAPISchema() runs this for every tool on every API request (~60-250
// times/turn). Tool schemas are wrapped with lazySchema() which guarantees the
// same ZodTypeAny reference per session, so we can cache by identity.
const cache = new WeakMap<ZodTypeAny, JsonSchema7Type>()

/** Unwrap lazySchema factories mistakenly assigned as tool.inputSchema. */
function resolveZodSchema(
  schema: ZodTypeAny | (() => ZodTypeAny) | undefined,
): ZodTypeAny {
  if (schema == null) {
    throw new Error('Tool input schema is missing')
  }
  const resolved = typeof schema === 'function' ? schema() : schema
  if (resolved == null) {
    throw new Error('Tool input schema factory returned undefined')
  }
  return resolved
}

/**
 * Converts a Zod v4 schema to JSON Schema format.
 */
export function zodToJsonSchema(
  schema: ZodTypeAny | (() => ZodTypeAny),
): JsonSchema7Type {
  const resolved = resolveZodSchema(schema)
  const hit = cache.get(resolved)
  if (hit) return hit
  const result = toJSONSchema(resolved) as JsonSchema7Type
  cache.set(resolved, result)
  return result
}
