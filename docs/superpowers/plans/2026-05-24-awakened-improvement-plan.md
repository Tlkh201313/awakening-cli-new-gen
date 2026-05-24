# Awakened CLI — Improvement Plan
**Created:** 2026-05-24  
**Canonical repo:** Tlkh201313/awakening-cli-new-gen  
**Default branch:** master  
**Status (2026-05-24):** Phase 0–1 complete; Phase 2–3 in progress (tsconfig split, stubs, docs; app `typecheck` ~1473 errors — not CI-gated yet)

---

## Phase 0 — Foundation (1–2 days)

### 0.1 Fix CI/release branch mismatch
- [x] `pr-checks.yml`: change `on.push.branches` from `main` → `master`
- [x] `release.yml`: change `on.push.branches` from `main` → `master`
- [x] `release.yml`: change `if: github.repository == 'Gitlawb/openclaude'` → `Tlkh201313/awakening-cli-new-gen`
- [ ] Add required status check on GitHub for `smoke-and-tests` once green

### 0.2 Unify repository URLs
- [x] `src/constants/brand.ts` → single source for REPO_URL, ISSUES_URL, NPM_PACKAGE_NAME
- [x] `package.json` repository.url → `https://github.com/Tlkh201313/awakening-cli-new-gen.git`
- [x] Replace Gitlawb hardcodes: `web/src/content.ts`, `web/src/App.tsx`
- [x] Replace Gitlawb hardcodes: `src/components/Feedback.tsx`, `src/entrypoints/sdk/index.ts`
- [x] Replace Gitlawb hardcodes: `vscode-extension/openclaude-vscode/package.json`
- [x] Replace Gitlawb hardcodes: `.github/ISSUE_TEMPLATE/config.yml`
- [x] Extend `src/constants/promptIdentity.test.ts` → assert built CLI strings use ISSUES_URL from brand constants
- [x] Additional user-facing: HelpV2.tsx, useNpmDeprecationNotification.tsx, prompts.ts, extension.js, StartupScreen.ts

### 0.3 Regenerate integration artifacts
- [x] `src/integrations/gateways/nvidia-nim.ts` lines 65–72: remove `default: true` from catalog entry (keep gateway `defaultModel`)
- [x] `bun run integrations:generate`
- [x] `bun run integrations:check`
- [x] Add `integrations:check` step to `pr-checks.yml`

---

## Phase 1 — Green gate (3–5 days)

### 1.1 Expand PR checks
- [x] Add `bun run build` step before tests in `pr-checks.yml`
- [x] Add `bun run verify:privacy` step after build
- [x] Add `bun run integrations:check` step after install

### 1.2 Fix 10 failing tests
- [x] Integration/registry: re-run after NIM fix; fix follow-on registry validation failures
- [x] Provider persistence (`src/utils/providerApiKeyPersistence.test.ts`): dynamic import after `mock.restore()` (ProviderManager mocks leak)
- [x] Agent precedence (`src/tools/AgentTool/loadAgentsDir.test.ts`): `PROJECT_CONFIG_DIR_NAMES` order — `.awakened` last wins
- [x] Branding/startup: release notes URLs, StartupScreen logo test, kimi-k2 detection
- [x] Timeouts/guards: cache integration `setDefaultTimeout(30_000)`; voice transcribe allowlist
- [x] Timeout signal guard (`scripts/no-raw-abort-signal-timeout.test.ts`): allow `awakenedVoiceTranscribe.ts`
- **Exit:** `bun test --max-concurrency=1` → 0 failures on master

### 1.3 Git hygiene
- [ ] Confirm `graphify-out/` in `.gitignore` ✓ (already present)
- [ ] Commit removal of previously tracked cache files
- [ ] (Optional) `git filter-repo` / BFG if clone size matters

---

## Phase 2 — TypeScript strategy (2–4 weeks)

### 2.1 Split TypeScript projects
- [x] `tsconfig.json`: app source only (exclude `**/*.test.*`)
- [x] `tsconfig.test.json`: test files + `"types": ["bun-types"]`
- [x] `package.json`: `typecheck`, `typecheck:test`, `typecheck:all`
- [ ] Add `bun run typecheck` to PR workflow once error count → 0
- [ ] Keep `web/tsconfig.json` unchanged

### 2.2 Fix missing mirror modules
- [x] `src/proactive/index.ts`: stub (proactive APIs no-op)
- [x] `src/utils/postCommitAttribution.ts`: stub `installPrepareCommitMsgHook` no-op
- [x] Align stubs with `scripts/build.ts` featureFlags

### 2.3 Error budget
- [ ] Capture baseline error count per directory after split+stubs
- [ ] CI policy: no increase in error count on PRs touching directory
- [ ] Long-term: `noImplicitAny: true` for new files via path override
- **Exit:** `bun run typecheck` → 0 errors on non-test src/

---

## Phase 3 — Product, security, development (parallel after Phase 1)

### 3.1 Documentation accuracy
- [x] `README.md`: Node >= 22, Bun required to build, single clone URL
- [x] `README.md`: permission modes + Windows `npm link` troubleshooting
- [x] `CONTRIBUTING.md`: dev workflow and checks
- [x] `SECURITY.md`: canonical issue URL (already Tlkh201313)

### 3.2 Security hardening
- [ ] `scripts/verify-no-phone-home.ts`: add to CI after every build
- [ ] `src/services/mcp/auth.ts` ~1785: implement cross-process lockfile for OAuth race
- [ ] `shell: true` audit: replace with `execFile + argv` in auth.ts, imagePaste.ts, headersHelper.ts
- [ ] Optional CI: `git grep` for secret key patterns on PR diff

### 3.3 Feature matrix
- [x] Create `docs/FEATURE_MATRIX.md` from `scripts/build.ts` featureFlags (enabled/disabled/stubbed, user-visible impact)

### 3.4 Legal
- [ ] Counsel review on fork/redistribution before npm publish
- [ ] Decide: private fork / clean-room rewrite / negotiated license

### 3.5 Development priorities
- [ ] Provider/NIM stability + provider profile UX
- [ ] Awakened Graphify skill docs; cache out of git
- [ ] Voice mode: VOICE_MODE: true in build + smoke test + docs
- [ ] Analytics dead code: strip `logEvent` behind compile-time false flag

---

## Success Metrics
- Push to master → full PR workflow passes
- `bun test` → 0 fail; `integrations:check` → pass; `verify:privacy` → pass after build
- `bun run typecheck` → 0 errors on non-test src/
- One issues URL in built CLI, README, npm metadata
- Published feature list matches build.ts flags

---

## Timeline
| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Phase 0 + 1.1–1.2 | CI on master, URLs unified, integrations regen, 0 test failures |
| 2 | Phase 1.3 + 2.1–2.2 | tsconfig split, stub modules, typecheck green on app src/ |
| 3 | Phase 2.3 + 3.1–3.2 | Error budget, docs, privacy + MCP lockfile |
| 4+ | Phase 3.3–3.5 | Feature matrix, legal decision, planned features |
