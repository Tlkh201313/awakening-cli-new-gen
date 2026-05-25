export * from "./client.js"
export * from "./server.js"

import { createAwakenedClient } from "./client.js"
import { createAwakenedServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export * as data from "./data.js"

export async function createAwakened(options?: ServerOptions) {
  const server = await createAwakenedServer({
    ...options,
  })

  const client = createAwakenedClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
