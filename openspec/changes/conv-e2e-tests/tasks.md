## 1. Tooling baseline

- [x] 1.1 Install `@playwright/test` as a dev dependency
- [ ] 1.2 Install `tauri-driver` via `cargo install tauri-driver` (manual; documented in `e2e/README.md`)
- [x] 1.3 Create `playwright.config.ts` (workers=1 for tauri-driver, retries on CI, trace-on-first-retry)
- [x] 1.4 Create `e2e/fixtures/app.ts` that spawns `tauri-driver` and provides per-test context
- [x] 1.5 Create `e2e/fixtures/db.ts` that deletes the SQLite file before each test (path resolution per platform)
- [x] 1.6 Smoke spec (`e2e/specs/_smoke.spec.ts`) — currently `test.skip` pending tauri-driver install; remove the skip when running locally

## 2. Traceability script

- [x] 2.1 Implement `scripts/check-spec-traceability.sh` (bash)
- [x] 2.2 Verify locally — correctly reports 63 orphan scenarios at the start of this change
- [x] 2.3 Test→spec direction is lenient per the convention (no `allow-unattributed` mechanism needed)
- [ ] 2.4 Add unit tests for the script itself — DEFERRED; deterministic bash + grep, regressions are obvious

## 3. Page objects

- [x] 3.1 Create `e2e/pages/welcome.ts` as the reference page object
- [ ] 3.2 Backfill page objects for remaining routes (`wizard`, `dashboard`, `history`, `progress`, `profile`, `export`, `import`, `about`) as their `.spec.ts` files get filled in

## 4. Initial e2e coverage (one .spec.ts per feature spec — stubs in place)

- [ ] 4.1 `e2e/specs/onboarding.spec.ts` — first test is partially implemented; remaining cases stubbed with `test.skip`. IDs cited: OB-001..OB-017 (subset).
- [ ] 4.2 `e2e/specs/intake-tracking.spec.ts` — stubs cite IT-001..IT-018 (UI scenarios). IT-019..IT-027 are backend-only, see §6.
- [ ] 4.3 `e2e/specs/weight-tracking.spec.ts` — stubs cite WT-001..WT-004 and WT-009. WT-005..WT-008 + WT-010..WT-012 are backend-only, see §6.
- [ ] 4.4 `e2e/specs/history.spec.ts` — stubs cite HI-001..HI-013
- [ ] 4.5 `e2e/specs/progress.spec.ts` — stubs cite PG-001..PG-004
- [ ] 4.6 `e2e/specs/profile.spec.ts` — stubs cite PF-001..PF-007 + PF-014..PF-015. PF-008..PF-013 are backend-only, see §6.
- [ ] 4.7 `e2e/specs/data-export.spec.ts` — stubs cite EX-001..EX-007
- [ ] 4.8 `e2e/specs/data-import.spec.ts` — stubs cite IM-001..IM-005
- [ ] 4.9 `e2e/specs/plan-review.spec.ts` — stubs cite PR-001..PR-006
- [ ] 4.10 `e2e/specs/app-shell.spec.ts` — stubs cite AS-001..AS-009

For each `.spec.ts`: remove the `test.skip`, fill in the test body, verify selectors against the live app, iterate until the test passes locally. The traceability gate already credits the IDs because they appear in source even when `test.skip` is in effect.

## 5. Convention-spec coverage cross-citation

Convention scenarios (`_conv-*`) are covered indirectly by the feature tests that exercise the convention. The current stubs do NOT yet cite the corresponding convention IDs. As feature tests get filled in, add a second citation in a nearby comment:

- [ ] 5.1 In `onboarding.spec.ts` cite `[ANI-001]` where the welcome animation is observed
- [ ] 5.2 In intake/weight/history `.spec.ts` cite `[GES-001]` (long-press), `[GES-003]` (swipe-left edit), `[GES-004]` (swipe-right delete), `[GES-005]` (swipe between cards), `[GES-006]` (swipe weeks), `[GES-007]` (swipe days), `[GES-008]` (cross-week)
- [ ] 5.3 In intake/weight/profile `.spec.ts` cite `[MOD-001]` (edit prefill), `[MOD-002]` (confirm delete), `[MOD-003]` (cancel delete), `[MOD-004]` (cancel discards)
- [ ] 5.4 In intake/weight/history `.spec.ts` cite `[EMP-001]` (empty today) and `[EMP-002]` (insufficient analytics); in weight cite `[EMP-003]` (pulsing stale)
- [ ] 5.5 In intake/weight/profile `.spec.ts` cite `[ERR-001]` (success toast), `[ERR-002]` (failure toast), `[ERR-004]` (validation warning); in app-shell cite `[ERR-003]` (silent background)
- [ ] 5.6 In data-export/data-import `.spec.ts` cite `[STG-001]` (stages advance), `[STG-002]` (operation complete), `[STG-003]` (cancel)
- [ ] 5.7 In app-shell `.spec.ts` cite `[ANI-002]` (settings fly), `[ANI-003]` (slide between items)

## 6. Backend-only scenario citations in Rust/Vitest tests

These scenarios describe backend validation, not user flows. Existing Rust integration tests (`src-tauri/tests/cmd/`, `src-tauri/tests/repo/`) likely cover the behavior already; add ID citations as comments next to the relevant tests:

- [ ] 6.1 `src-tauri/tests/cmd/test_intake_cmd.rs` — cite `[IT-019]`, `[IT-020]`, `[IT-021]`, `[IT-022]`, `[IT-023]`, `[IT-024]`, `[IT-025]`, `[IT-026]`, `[IT-027]`
- [ ] 6.2 `src-tauri/tests/cmd/test_weight_cmd.rs` — cite `[WT-005]`, `[WT-006]`, `[WT-007]`, `[WT-008]`, `[WT-010]`, `[WT-011]`, `[WT-012]`
- [ ] 6.3 `src-tauri/tests/cmd/test_user_cmd.rs` (or wherever nickname validation is tested) — cite `[PF-008]`..`[PF-013]`
- [ ] 6.4 `src-tauri/tests/cmd/test_wizard_cmd.rs` — cite `[OB-012]`, `[OB-014]`
- [ ] 6.5 Add citations to existing Vitest tests where they cover UI validation (e.g. nickname bounds in profile components)

## 7. CI wiring

- [x] 7.1 Add `e2e` job to `.github/workflows/ci.yml` (depends on rust-test + svelte-test)
- [x] 7.2 Trace + screenshot + HTML report artifact upload on failure
- [x] 7.3 Mark `Run Playwright + traceability` as a required status check on `main` (set via `gh api`)

## 8. Documentation

- [x] 8.1 `e2e/README.md` covering: prerequisites, running, layout, isolation, known limitations
- [ ] 8.2 Update root `README.md` with `npm run test:e2e` and `npm run test:traceability` commands
- [x] 8.3 Android e2e gap captured in the convention spec ([E2E-007])

## 9. Validate + archive

- [x] 9.1 Run `openspec validate conv-e2e-tests --strict`
- [ ] 9.2 Run full local pipeline (rust + vitest + e2e + traceability) — pending user verification once tauri-driver is installed
- [ ] 9.3 Archive: `openspec archive conv-e2e-tests` — only after every spec scenario has a test citation (gate green)
