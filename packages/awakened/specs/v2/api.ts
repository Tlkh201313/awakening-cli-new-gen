// @ts-nocheck

import { Awakened } from "@awakened-ai/core"
import { ReadTool } from "@awakened-ai/core/tools"

const awakened = Awakened.make({})

awakened.tool.add(ReadTool)

awakened.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

awakened.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

awakened.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await awakened.session.create({
  agent: "build",
})

awakened.subscribe((event) => {
  console.log(event)
})

await awakened.session.prompt({
  sessionID,
  text: "hey what is up",
})

await awakened.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await awakened.session.wait()

console.log(await awakened.session.messages(sessionID))
