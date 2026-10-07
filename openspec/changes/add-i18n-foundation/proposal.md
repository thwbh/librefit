## Why

LibreFit ships English-only, and GitHub issue #181 asks for multi-language support. A half-finished `rust-i18n` layer (`src-tauri/src/i18n/localize.rs`, `locales/en.yml`) exists but is **dead code** — it has no call site, and the real user-facing strings live as inline prose in `#[validate(message = "...")]` attributes and in hardcoded Svelte markup. This change lays the i18n **groundwork only**: a single translation mechanism and a clean ownership split between backend- and frontend-selected strings. **The app remains English-only after this change** — there is no user-facing language selection and no second translation. The payoff is that adding a locale later becomes config + a message file, with no structural work.

## What Changes

- **Adopt Paraglide** (`@inlang/paraglide-js`) in **runtime / non-routing mode** as the single translation runtime. The app is a Tauri SPA (`adapter-static`, `ssr = false`), so locale is set at runtime via `$lib/paraglide/runtime` — the SvelteKit URL-routing adapter is deliberately **not** used. Messages author in `messages/en.json` (the only locale shipped); the Vite plugin compiles to `src/lib/paraglide/`. The project is configured so a second locale is added by dropping in `messages/<locale>.json` and registering it — no code change.
- **Backend emits keys, never prose.** Every `#[validate(..., message = "...")]` attribute carries a translation **key** (e.g. `loc.body.age_range`) instead of English text, and the wizard warning/classification keys stay as keys. One attribute feeds both consumers: tauri-typegen inlines it into the generated zod schema (client-side `safeParse`) and Rust `.validate()` uses it as server-side defense.
- **Single resolution boundary.** `src/lib/api/error-formatter.ts` (`formatZodError` / `formatInvokeError`) resolves backend-emitted keys to Paraglide messages. This is already the one choke point for both the client-zod and Rust-`Err` paths.
- **CI lint instead of type-level enforcement.** A new `scripts/check-i18n-keys.mjs` (sibling to `check-spec-traceability.mjs`) scans every backend-emitted key and asserts each resolves to a Paraglide message. A `TranslationKey`-enum / typegen-`z.enum` approach was evaluated and rejected: typegen inlines validate-messages as plain zod **string literals** (not union members), so validation keys cannot gain compile-time safety regardless — and a lint is required anyway.
- **Food-category `longvalue` becomes a frontend-only key** (Rust does not select it; it is seeded display data). Includes a data migration to rewrite seeded rows; `getFoodCategoryLongvalue` resolves a key.
- **BREAKING (dev-internal): delete the dead Rust i18n stack** — `src-tauri/src/i18n/localize.rs`, the `rust-i18n` dependency, `src-tauri/locales/en.yml`, and the `i18n!(...)` macros in `lib.rs`/`main.rs` (which also carried an inconsistent `en`/`de` fallback). No live path depends on them.
- **New `_conv-loc` convention** (prefix `LOC`) and edits to `_conv-user-errors` (ERR-004) and `_conv-validation` are authored **directly** per project policy (conventions never go through the opsx change flow). They are listed here for scope visibility only — they are not opsx-managed delta specs.

## Capabilities

### New Capabilities

_None via the opsx flow._ The behavioral contract for this groundwork — keys resolve to messages in the active locale, unknown keys fall back without ever rendering a raw key, and the system is extensible to new locales — lives in the new `_conv-loc` convention (prefix `LOC`), hand-authored directly under `openspec/specs/_conv-loc/spec.md` per project policy. Conventions never go through the opsx change flow, so this change carries no opsx-managed spec delta; its spec behavior is the hand-authored convention, and the implementation plan lives in design.md / tasks.md.

### Modified Capabilities

_None._ No feature spec changes behavior: there is no user-facing language selection, and food-category labels render the same English text as before (the `longvalue` change is an implementation detail resolved through the i18n layer).

## Impact

- **Frontend deps:** add `@inlang/paraglide-js` + Vite plugin; new `project.inlang/settings.json`, `messages/en.json`, generated `src/lib/paraglide/` (gitignored).
- **Frontend code:** `src/lib/api/error-formatter.ts` (key resolution + fallback), `src/lib/api/category.ts` (`getFoodCategoryLongvalue`). The Paraglide runtime is initialized once to the base locale; no selection UI.
- **Backend code:** all `#[validate(message = ...)]` sites across `src-tauri/src/service/*.rs` reworded to keys; deletion of `src-tauri/src/i18n/`, `locales/`, `rust-i18n` dep, and `i18n!` macros; a Diesel migration rewriting seeded `food_category.longvalue`.
- **Tooling/CI:** new `scripts/check-i18n-keys.mjs`, wired into `npm run lint:conventions`.
- **Specs/conventions:** new `_conv-loc` (LOC); edits to `_conv-user-errors` (ERR-004 wording: validator-supplied message → frontend-resolved localized message) and `_conv-validation` (messages are keys); `LOC` added to the CLAUDE.md prefix registry.
- **Tests:** Vitest/Rust tests asserting literal English validation prose switch to asserting on keys (or on resolved messages through the formatter).

## Non-goals

- **Any user-facing language selection.** No Settings language picker, no device-locale detection, no persistence. The app runs on the base locale (English). Selection UX is a deliberate follow-up once a second translation exists.
- **Shipping a second translation.** Only `messages/en.json` is populated. "Open for extension" means the project config and runtime already support additional locales — not that one is delivered here.
- **Extracting the ~82 components' static UI labels.** The hardcoded-English chrome is mechanical churn done incrementally after the groundwork lands; it is tracked as follow-up tasks, not specced scenario-by-scenario. Consequently the "no hardcoded user-facing string" rule is stated as the target in `_conv-loc` but its lint gate stays disabled until the churn completes — issue #181 is **not** closed when this groundwork ships.
- **Translating other DB-seeded reference data** beyond food-category `longvalue` (e.g. muscle slugs, exercise categories).
- **A `set_locale` Tauri command / backend locale awareness.** The backend is locale-agnostic; it only emits keys.
