import { $ } from "bun"

await $`bun ./scripts/copy-icons.ts ${process.env.AWAKENED_CHANNEL ?? "dev"}`

await $`cd ../awakened && bun script/build-node.ts`
