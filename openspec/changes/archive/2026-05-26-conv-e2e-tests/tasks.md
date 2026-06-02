## 1. Abandonment cleanup (what landed)

- [x] 1.1 Delete `e2e/` directory (config, fixtures, pages, specs, README)
- [x] 1.2 Delete `wdio.conf.ts`, `tsconfig.wdio.json`
- [x] 1.3 Delete container infrastructure: `Containerfile.e2e`, `scripts/e2e.sh`, `.dockerignore`
- [x] 1.4 Uninstall WebdriverIO + Mocha + related npm devDependencies
- [x] 1.5 Delete `src-tauri/src/cmd/` (the `seed` module and `mod.rs`)
- [x] 1.6 Remove the `e2e-seed` Cargo feature + gated invoke_handler entries in `src-tauri/src/lib.rs`
- [x] 1.7 Remove the `e2e` job from `.github/workflows/ci.yml`
- [x] 1.8 Remove the required-status-check `Run WebdriverIO + traceability` on `main` via `gh api`
- [x] 1.9 Remove e2e-related npm scripts from `package.json` (`test:e2e`, `test:e2e:container`, `test:e2e:container:shell`)

## 2. What was preserved

- [x] 2.1 Scenario IDs in all 17 specs (`[<PREFIX>-<NNN>]`) — untouched
- [x] 2.2 `scripts/check-spec-traceability.sh` — kept; will be wired into CI as a lightweight check (no e2e runner needed)
- [x] 2.3 New hand-written convention spec at `openspec/specs/_conv-test-traceability/spec.md`
- [x] 2.4 CLAUDE.md + `openspec/config.yaml` updated to reflect the layer-agnostic framing (no e2e DoD language)

## 3. Follow-up — backfill scenario citations into existing tests

The traceability gate will report most scenarios as orphans until existing Rust + Vitest tests cite IDs. Mechanical work, no new tests required for most.

- [ ] 3.1 Add `[OB-001..OB-017]` citations in `src-tauri/tests/cmd/test_wizard_cmd.rs` and the existing `Setup` / wizard-step Svelte tests where they exist
- [ ] 3.2 Add `[IT-001..IT-027]` citations in `src-tauri/tests/cmd/test_intake_cmd.rs` + intake-related Vitest tests
- [ ] 3.3 Add `[WT-001..WT-012]` citations in `src-tauri/tests/cmd/test_weight_cmd.rs` + `WeightScore.test.ts`
- [ ] 3.4 Add `[PR-*]`, `[HI-*]`, `[PG-*]`, `[PF-*]`, `[EX-*]`, `[IM-*]`, `[AS-*]` citations across the relevant Rust + Vitest tests
- [ ] 3.5 For convention specs (`_conv-*` and `_conv-test-traceability`): cite their IDs from any test that exercises the convention's behavior, or from manual smoke notes if no test layer covers them yet
- [ ] 3.6 For scenarios where no test exists at any layer, write a Vitest or Rust test rather than weakening the gate

## 4. Archive

- [x] 4.1 Archive this change with `openspec archive --skip-specs conv-e2e-tests` as an abandonment record
