import type { ModelCatalogEntry } from '../descriptors.js'
import { getCachedNvidiaNimModelOptions } from '../../utils/model/nvidiaNimModels.js'

const NVIDIA_NIM_DEFAULT_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'

function catalogCapabilitiesForNimModel(apiName: string) {
  // GLM on NIM is routed for chat speed; skip client thinking budgets that
  // add reasoning_content round-trips and large budget_tokens on the wire.
  if (/^z-ai\//i.test(apiName) || /(?:^|\/)glm/i.test(apiName)) {
    return { supportsReasoning: false as const }
  }
  return undefined
}

/** Static catalog for the nvidia-nim gateway and /model descriptor picker. */
export function getNvidiaNimCatalogStaticModels(): ModelCatalogEntry[] {
  return getCachedNvidiaNimModelOptions().map(entry => ({
    id: entry.value.replace(/\//g, '-'),
    apiName: entry.value,
    label: entry.label,
    modelDescriptorId: entry.value,
    default: entry.value === NVIDIA_NIM_DEFAULT_MODEL,
    capabilities: catalogCapabilitiesForNimModel(entry.value),
  }))
}
