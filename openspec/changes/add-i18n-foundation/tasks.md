## 1. Paraglide runtime setup

- [ ] 1.1 Add `@inlang/paraglide-js` dependency and the Paraglide Vite plugin to `vite.config.ts`, outputting to `src/lib/paraglide/`
- [ ] 1.2 Create `project.inlang/settings.json` (baseLocale `en`, locales `["en"]`, message-format plugin → `messages/{locale}.json`); structured so adding a locale is a one-line registration
- [ ] 1.3 Create `messages/en.json` (seed with the keys this change introduces) — no second locale shipped
- [ ] 1.4 Gitignore the generated `src/lib/paraglide/` directory
- [ ] 1.5 Initialize the Paraglide runtime to the base locale (no selection UI, no device detection, no persistence)

## 2. Backend emits keys

- [ ] 2.1 Reword every `#[validate(..., message = "prose")]` across `src-tauri/src/service/*.rs` to a `loc.<domain>.<rule>` key; ensure custom validators (`validate_date_format`, `validate_time_format`, …) also surface keys
- [ ] 2.2 Confirm wizard warning/classification sites (`wizard.rs`) already emit `wizard.*` keys; normalize to the `loc.*`/agreed key scheme
- [ ] 2.3 Regenerate `tauri-typegen` bindings and verify `src/lib/api/gen/types.ts` zod schemas now carry keys as their `message`
- [ ] 2.4 Add the corresponding message entries to `messages/en.json`

## 3. Key resolution boundary

- [ ] 3.1 In `src/lib/api/error-formatter.ts`, resolve backend-emitted keys to Paraglide messages in `formatZodError` and `formatInvokeError`
- [ ] 3.2 Add unknown-key fallback: render a generic localized message and log the offending key; never surface the raw key to the user
- [ ] 3.3 Add/update Vitest for the formatter covering key resolution and unknown-key fallback, cited to `_conv-loc` scenarios (`[LOC-00x]`)

## 4. Food-category longvalue → key

- [ ] 4.1 Write a Diesel migration rewriting seeded `food_category.longvalue` rows to `loc.food_category.*` keys
- [ ] 4.2 Update `getFoodCategoryLongvalue` in `src/lib/api/category.ts` to resolve the key via Paraglide
- [ ] 4.3 Add the `loc.food_category.*` entries to `messages/en.json`
- [ ] 4.4 Update `src/lib/api/category.test.ts` for key resolution

## 5. Remove dead Rust i18n stack

- [ ] 5.1 Delete `src-tauri/src/i18n/` (`mod.rs`, `localize.rs`) and remove its `mod` declaration
- [ ] 5.2 Remove the `rust-i18n` dependency from `src-tauri/Cargo.toml` and the `i18n!(...)` + `extern crate rust_i18n` lines in `lib.rs`/`main.rs`
- [ ] 5.3 Delete `src-tauri/locales/`
- [ ] 5.4 Migrate any Rust/Vitest tests asserting literal English validation prose to assert on keys (or on messages resolved through the formatter), preserving their scenario IDs

## 6. Key-integrity lint

- [ ] 6.1 Write `scripts/check-i18n-keys.mjs` that scans Rust-emitted keys (`#[validate(message)]` + wizard sites) and asserts each resolves in `messages/en.json`
- [ ] 6.2 Wire it into `npm run lint:conventions`

## 7. Conventions and registry (hand-authored, per project policy)

- [ ] 7.1 Create `openspec/specs/_conv-loc/spec.md` (prefix `LOC`): backend-emits-keys rule, single resolution boundary, unknown-key fallback, and extensibility to new locales. Mechanism scenarios testable under the single base locale: `[LOC-001]` a backend-emitted key resolves to its message in the active locale; `[LOC-002]` an unknown/unmapped key falls back to a generic message and never renders the raw key; `[LOC-003]` a validation error surfaces end-to-end as a resolved localized message (backend key → `formatZodError`/`formatInvokeError` → Paraglide). State the "no hardcoded user-facing string" target rule with its lint gate explicitly deferred until UI-string churn completes. Note that user-facing language selection, device-default, and persistence are out of scope here and owned by a future change.
- [ ] 7.2 Edit `_conv-user-errors` ERR-004 wording: validator-supplied message → frontend-resolved localized message
- [ ] 7.3 Edit `_conv-validation` to state validation messages are keys resolved by the frontend
- [ ] 7.4 Add `LOC` to the prefix registry table in `CLAUDE.md`

## 8. Verify

- [ ] 8.1 Run `npm run lint:conventions`, `npm run lint:traceability`, Vitest, and `cargo nextest` (or the Rust test runner); confirm all green and new scenarios are cited
