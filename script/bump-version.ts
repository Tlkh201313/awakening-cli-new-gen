#!/usr/bin/env bun

const version = process.argv[2] ?? process.env.AWAKENED_VERSION ?? "1.0.0"
const repo = "https://github.com/Tlkh201313/awakening-cli-new-gen"

for await (const file of new Bun.Glob("**/package.json").scan(".")) {
  if (file.includes("node_modules") || file.includes("dist")) continue
  let text = await Bun.file(file).text()
  const next = text.replaceAll(/"version": "[^"]+"/g, `"version": "${version}"`)
  if (next === text) continue
  await Bun.file(file).write(next)
  console.log("updated", file)
}

const tomlPath = "packages/extensions/zed/extension.toml"
let toml = await Bun.file(tomlPath).text()
toml = toml.replace(/^version = "[^"]+"/m, `version = "${version}"`)
toml = toml.replaceAll(/releases\/download\/v[^/]+\//g, `releases/download/v${version}/`)
toml = toml.replace(/repository = "[^"]+"/, `repository = "${repo}"`)
await Bun.file(tomlPath).write(toml)
console.log("updated", tomlPath)

console.log(`\nVersion set to ${version}`)
