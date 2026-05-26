# Changelog

## 1.0.0 (2026-05-26)


### Features

* add 7 job persona agents (scout, architect, builder, reviewer, security-auditor, doc-writer, verifier) ([1676504](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/1676504a4d362299b5eb8d8f00590b92bf5bd05c))
* add AGENTS.md orchestration + plans README (Tasks 11-13) ([ff48ca1](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/ff48ca10f086aa9625b928470984be9888f1c13f))
* add awk3nd project skills (orchestrator + verify) ([22212f8](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/22212f877429552801f0281ac328eef74367fa67))
* add awk3nd-router skill for job-to-subagent dispatch ([45baee2](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/45baee2070ab285dce6c16fd8c6bd49e8e8cb899))
* add baseline .mcp.json with Obsidian placeholder ([17ddfe5](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/17ddfe5e8af7758f7b741d9168b69ff7d24aee30))
* add batch-friendly preview to toolResultStorage v0.12.16 ([360cd45](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/360cd457c8399bcffa8d2625381ae6aacb0e3a9b))
* add BatchReadTool for parallel multi-file reads v0.12.13 ([5dc9543](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/5dc95432a12d40da3e50674d362a8b6682071976))
* add code acceptance tracking ([ccf7648](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/ccf764802bb28f955d5f19485e25e6ba7ee86c14))
* add feedback collector ([51c2d87](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/51c2d87bee805727507ef4f95d7ba24f4a4518ba))
* add feedback storage layer ([35b8256](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/35b8256d03b0337cb6cfb8a1e4ea3add9fa5a394))
* add GitSnapshotTool for quick repo status v0.12.14 ([9856e1c](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/9856e1cff6663f7126dc1b989e01b8fdee272159))
* add keep-alive cooldown after ECONNRESET ([662505f](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/662505f0a6bbf845ec08f11126a26b7dbee2e9d8))
* add OpenGateway API key requirement v0.12.6 ([3118c89](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/3118c893d0664973bdef203b090db69bcb14cd19))
* add searchHint to new tools for discovery v0.12.17 ([0c3931e](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/0c3931e34f68dad867472c11fcd98f641d331acc))
* add session quality survey prompt component ([5d691c9](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/5d691c98d3afbd578e0e78bbb437ddaa2b220def))
* add session quality survey scheduler ([6b05fd2](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/6b05fd24bea107b13ba86dd9fb22d05f7c876406))
* add shared persona-behavior rules for all agents ([19335e8](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/19335e83a3d1afbf4f7657f7d84efd739cde8436))
* add Tech Persona Card v1.0 JSON for all 7 agents ([481c630](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/481c6307adfe59bb87eac4af809733f91b08c54e))
* add telemetry collector with metric types ([7e1d74b](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/7e1d74b481d250d613e17ca8c666eae42a0a68ed))
* add telemetry storage layer ([a3edfcf](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/a3edfcf3fcdddcd0afa1cacdce1d329243b08438))
* **animations:** add dim feedback on input submission ([d74e273](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/d74e273cc3ecf889f91d92587d82dca43f6e6ce3))
* **animations:** add fade transition between prompt and transcript screens ([ed8fb25](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/ed8fb255117c38ade094a16f4219949603c7f862))
* **animations:** add fade-in/out animation to dialogs ([e76914f](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/e76914f666fbbaa451f699b1102f455b029b6772))
* **animations:** add FadeIn, useStreamingReveal, useErrorShake, tool completion ([409e3eb](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/409e3eb283a5f06eb429a42bedd4fd505cc80453))
* **animations:** add green brightness pulse on success transition ([ca5cdfa](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/ca5cdfaf6f899cb12bae5fbbed35a0f85b7dd09b))
* **animations:** add scroll position indicator with fade animation ([81e7ba0](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/81e7ba0dc43dea56e0085f67297107f6cfc987cd))
* **animations:** add smoothScrollTo with ease-out curve ([ce0a451](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/ce0a4517fd613d60dd479aceada5b509553b4425))
* **animations:** integrate error shake into API error and error overview ([56d6046](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/56d6046af0a41a8e97cc82cc6d6e72ed74633aff))
* **animations:** wrap message rows in FadeIn for entrance animation ([b9ba01f](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/b9ba01f3b757abb49271a908ea6835a48c683049))
* Awakened capabilities, faster startup, UI throttle, README benchmarks ([dfa387a](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/dfa387a724298bd427c0339ee097df724221dd6f))
* Awakened rebrand + productivity improvements v0.12.4 ([511a3aa](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/511a3aad52649f153d787abf0b1420e215ade44f))
* Awakened rebrand with ~/.awakened config home ([ea1d32f](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/ea1d32fdd2a9709fd9b434b44c55fa98ddca4d4e))
* enable /feedback command ([2e59597](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/2e59597756f9d9cdddda5bde1194777420c0404a))
* implement fork subagent tool_result wiring v0.12.10 ([9102d9f](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/9102d9f82da0842148fe59b529a18ae65af49e74))
* improve startup animation with wave effect v0.12.5 ([98411b7](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/98411b7ce7f9a76cd237b0eb67fbc6b43b251a3a))
* improve WebSearch abort propagation v0.12.7 ([ff1e935](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/ff1e9351802865ef87f8a0e2b8cd53aeb1a3682f))
* integrate useStreamingReveal hook into AssistantTextMessage ([c71f520](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/c71f520f87f4f7be83b74314382811cc952a3281))
* one-line setup scripts for macOS/Linux/Windows ([7fd2282](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/7fd228204a37f73fa03f3b2244db2b5bb37470cb))
* pre-fetch auth tokens before expiry ([68fb4c9](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/68fb4c911f6330bc2f5a64702279a124be25e001))
* pre-warm provider connection on startup ([87bb8b4](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/87bb8b41f4cc29162771528288c4bfddadb0f37f))
* rebrand to Awakened + secure API key in .env ([3467868](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/34678688d94cbab4df73bda006ea597a03c47304))
* replace UI with official openclaude source ([d76bfd9](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/d76bfd908c71fc2d3099e2d22ce2823953dec13e))
* soft deprecate TaskOutputTool v0.12.11 ([2738ece](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/2738eced5da5f4a1b481025b40f07e2cdefd3441))
* voice mode, awaken command, provider persistence, hardware tests ([1357f6d](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/1357f6d2a1f15b4d7a6d74ea6533a9f43117851d))
* wire telemetry into API client ([10f0632](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/10f0632b4a219706e903214f92ae0f740ae6856e))


### Bug Fixes

* add @runablehq/mini-browser to INTENTIONALLY_BUNDLED ([39d38c4](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/39d38c4eef9379b623479c3fc1b48cb2793c9239))
* **animations:** fix cursor-hide-delay dead code in useStreamingReveal ([29d86b3](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/29d86b35ec0f2e7a483094a366989886bf997a63))
* **animations:** replace useAnimationFrame with setTimeout in REPL transitions ([ece6fec](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/ece6fecc67bfdcc149c8a0668512f8935e518b5f))
* **setup:** add build step so awakened command works after install ([35ca2b9](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/35ca2b92f4577c09e72638aee4b5936262ec7954))
* stop tracking graphify-out cache; add to .gitignore and untrack existing files ([6c31539](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/6c31539c4fdb5fd571b15b351fbdb8bf8e910c40))
* update version display to show Awakened v0.12.19 ([650d583](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/650d58361c78f116a90c390f98887b70295e2625))


### Performance Improvements

* add LRU cache to shouldBypassProxy ([fc081e6](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/fc081e6064db1793e69a30d2a6a4a50eaad6a126))
* add Phase 0 baseline measurement (logo 208ms, MCP 1 server, stream optimal) ([7b3619c](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/7b3619cacd99f6c139499d5797057ff0e6b7d754))
* add prompt cache invalidation on config change ([e1bf1f4](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/e1bf1f40b2db2cf4d702d50ae0abf8cf06ad3748))
* add streaming chunk batcher ([1449a11](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/1449a11a9da8ee698ba29ce032a51511e9434465))
* export partitionToolCalls for testing ([8f74740](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/8f74740a6142916306ee41d423ad9006d8615a7f))
* incremental message normalization ([aaaba2c](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/aaaba2c741d32641b64a7046654b43e58cfb8cfd))
* optimize tool schema cache with stable keys ([9fad666](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/9fad666d4210a4280e9305748465da5c3ee44a6a))
* overlap main bundle load with config and skip fast-startup banner. ([ad19de5](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/ad19de5ea1c09a4c80dddf1e3696ab123c7a091b))
* Phase 1 quick wins (perf mode 4-core, logo skip, WT detection, Ollama gate) ([4fe3ed9](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/4fe3ed93ea1e1f7c4f370256da2f18b25bfbdddd))
* Phase 2 analysis — structural optimizations already exist ([4d4c87f](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/4d4c87ffb28374c3fe45eebfe6a3bcdd6d8b6a19))


### Reverts

* remove setup scripts, restore manual install instructions ([af31a0b](https://github.com/Tlkh201313/awakening-cli-new-gen/commit/af31a0b8a3944628150f13978b71d8ca340706af))
