# LibreFit end-to-end tests

End-to-end tests run the assembled Tauri desktop app and exercise it through Playwright via `tauri-driver`. They are the top of the test pyramid alongside Rust integration tests (`src-tauri/tests/`) and Vitest unit/component tests (`src/**/*.test.ts`).

## Convention

This directory is governed by [`openspec/specs/_conv-e2e-tests/spec.md`](../openspec/specs/_conv-e2e-tests/spec.md). The short version:

- Every spec scenario MUST be referenced by at least one test (any layer).
- Tests SHOULD cite the scenario IDs they cover, e.g. `[OB-005]`, in the test name or a comment within 5 lines of the declaration.
- The `scripts/check-spec-traceability.sh` gate enforces spec→test coverage in CI. Tests without scenario references are permitted (helper/utility tests).

## Prerequisites

```sh
# Rust toolchain prerequisites (you likely have these already)
# ...plus tauri-driver:
cargo install tauri-driver

# Node + Playwright (already in devDependencies):
npm install
```

`tauri-driver` is a global install. It is not declared in `Cargo.toml` because it is a developer tool, not a runtime dependency.

On Linux, also ensure `webkit2gtk-driver` is available (the CI workflow installs it via apt).

## Running

```sh
# Build the debug binary with the e2e-seed feature.
# Playwright drives this binary; the e2e-seed feature exposes the test-only
# Tauri commands used by e2e/fixtures/seed.ts. Do NOT enable this feature for
# production builds.
cargo tauri build --debug --features e2e-seed

# Run the full e2e suite:
npm run test:e2e

# Run a single spec:
npx playwright test e2e/specs/onboarding.spec.ts

# Run the traceability gate:
npm run test:traceability
```

## Seeding state

The fixture exposes a `seed` helper with composable primitives that map 1:1 to
the `seed_*` Tauri commands in `src-tauri/src/cmd/seed.rs`. Dates are required
arguments — the seed layer does not assume a notion of "today" (tests run
across midnights and on different days).

```ts
test('something needing a user', async ({ page, seed }) => {
	await seed.defaultProfile({ startDate: '2026-01-01', endDate: '2026-04-01' });
	// continue test
});
```

Available primitives: `user`, `bodyData`, `intakeTarget`, `weightTarget`,
`intakeEntry`, `weightEntry`, plus the `defaultProfile` shortcut.

## Layout

```
e2e/
├── fixtures/
│   ├── app.ts       Launches tauri-driver + Tauri binary; provides per-test page context
│   └── db.ts        Resets the SQLite file before each test
├── pages/           Page objects; one file per route
└── specs/           Tests; one file per feature spec (matches openspec/specs/ names)
```

## Test isolation

The fixture in `db.ts` deletes the app's SQLite database file before each test. The Tauri app re-creates it on launch via Diesel migrations, yielding a clean state.

This avoids shipping test-only Tauri commands in production builds (see `_conv-e2e-tests` [E2E-006]). The trade-off: tests must not assume any pre-existing data; they must seed any required state via the UI or via test-only Tauri commands behind a `#[cfg(test)]` flag.

## What's done vs. what's pending

The harness, fixtures, page-object templates, traceability script, and CI wiring are in place. The actual test bodies are mostly stubbed with `test.skip(...)` placeholders that cite the right scenario IDs. As you fill them in:

1. Remove `test.skip` → `test`.
2. Verify selectors against the live app; adjust the page object if needed.
3. Re-run `npm run test:traceability` to confirm the gate stays green.

Backend-only scenarios (e.g. `[IT-019]` calorie amount at lower bound) are not yet cited from Rust tests; that backfill is tracked in the change's `tasks.md`.

## Adding a new test

1. Identify the spec scenario IDs your test will cover.
2. Add the test to the matching `e2e/specs/<spec-name>.spec.ts` (or create the file if absent — name MUST match the spec folder name per [E2E-005]).
3. Cite each ID in the test name or a comment within 5 lines.
4. Add page-object helpers in `e2e/pages/` if reused.

## Known limitations

- **Android**: not covered. Out of scope for this convention per [E2E-007]. A separate change will introduce mobile e2e (likely Maestro).
- **Parallelism**: tauri-driver binds a fixed port; tests run with `workers: 1`. If the suite grows large, consider sharding across multiple CI jobs rather than parallelism within a job.
