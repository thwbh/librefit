## Context

Today the `exercise` table is seeded-only (`id, name, category, default_rest_seconds`) with no notion of user-created entries or verification, and the picker draws exclusively from it. This change makes the library user-extensible; **workout templates build on it in a follow-up change** (`add-workout-templates`), which is why seeded references are designed around a stable `slug` here.

The app runs **locally, single-device, single-user** — there is no multi-user concept to model.

The interaction model is the product of an exploration session (see `ensemble-brainstorm-2026-06-13`). The locked decisions there were: name-only mid-workout "Ghost" creation, enrichment deferred to recovery time, an avatar-hosted indicator with graceful decay, and a **batch-tagging** quick-fix. A one-at-a-time "Sweep/Tinder" card interface and haptic/gamification framing were explicitly **rejected** by the user during that session and are out of scope here.

## Goals / Non-Goals

**Goals:**

- Let users add exercises (full or name-only) and edit/delete their own, without touching seeded data.
- Keep mid-workout creation to a single text field; never block the session for metadata.
- Provide a low-friction batch-tagging path to promote unverified exercises, surfaced via the dashboard avatar.

**Non-Goals:**

- Workout templates (separate change `add-workout-templates`), per-exercise history/stats, cross-session prefill, workout types beyond `wl`.
- Any swipe-card review UI or haptic/gamification layer.
- Changing the seeded data's read-only nature.

## Decisions

### One hardened `exercise` table, with a `slug` natural key for seeded references

- **Decision:** Keep a single `exercise` table rather than splitting seeded and user rows. Harden it:
  - Add `slug TEXT UNIQUE` — **non-null for seeded rows, null for user-created rows**. Seeded rows are exactly those with a slug; this single column is both the seeded/user discriminator and the stable reference key.
  - Add `verified BOOLEAN NOT NULL DEFAULT 0` (seeded rows seeded as `1`) and `created_at TEXT` (for graceful decay). `verified` — **not** the category — is the source of truth for completeness.
  - **No `user_id`** — single local user.
  - **Category stays `NOT NULL`; a name-only "Ghost" is parked under a seeded `'uncategorized'` category** until verified. _Implementation note:_ the original plan was to make `category` nullable, but relaxing a column constraint forces a full rebuild of this FK-parent table, and SQLite cannot do that safely inside Diesel's per-migration transaction with `foreign_keys = ON` (it can't toggle `foreign_keys`, and `defer_foreign_keys` does not cover `DROP TABLE` of a referenced parent). The sentinel category keeps the migration to pure `ALTER ADD COLUMN` (no rebuild, FK children untouched) while `verified = 0` carries the "incomplete" meaning.
  - All seeded content shipped via migration (future seeded exercises, seeded templates) references exercises by **`slug`, never by raw id**, so a user row claiming an autoincrement id can never collide with a seeded reference.
- **Why one table over two:** the workout `→ exercise → set` model means `workout_exercise` (and a future `template_exercise`) reference an exercise; a split would force a polymorphic dual-FK (`exercise_id` XOR `user_exercise_id` + CHECK) on those reference tables — permanent complexity on the hottest read path — to buy structural separation. The risks raised against one table are answered more cheaply: id-space collision → `slug` references; curated-vs-user quality → filter by `slug IS NOT NULL` / `verified`; accidental mutation → the guard below.
- **Mutation guard:** seeded immutability is enforced at a **single repository choke-point** — every exercise mutation goes through one guarded path that refuses rows with a non-null `slug` — rather than scattered `WHERE` checks across commands. (A SQL trigger was considered but rejected as the primary guard: it would also block legitimate seed-correction migrations, since SQLite triggers fire on migration writes too. It may be added later as defense-in-depth.)
- **Alternatives considered:** Two tables (`exercise` + `user_exercise`) with a polymorphic reference (rejected — taxes the core logging path forever to buy separation the slug + choke-point already provide). A `user_id`-based discriminator (rejected — single local user; no ownership to model). A per-command `is_seeded` check (rejected — the "easy to forget" weakness the review flagged).

### "Verified" is stored explicitly on user rows

- **Decision:** `verified` is a column, `0` on name-only creation and flipped to `1` when category + muscles are supplied (full edit screen or batch-tagging). Seeded rows ship `verified = 1`.
- **Rationale:** The dashboard indicator and quick-fix need a cheap, indexable count of unverified rows; deriving "completeness" on every read is costlier and ambiguous (what counts as complete can evolve). The flip rule lives in one backend place so "verified" has a single owner.
- **Alternatives considered:** Pure derivation from null category/muscles (rejected — recomputed on every list and couples "verified" to a fixed completeness rule).

### Graceful decay is a presentation rule over `created_at`, not stored state

- **Decision:** The avatar indicator computes prominent-vs-decayed from the age of the oldest/newest unverified exercise (a recency window); no decay state is persisted.
- **Rationale:** Decay is purely visual and time-derived; persisting it would need a timer/migration for no behavioral gain. The backend exposes the unverified rows with their `created_at`; the dashboard renders the state.
- **Alternatives considered:** A stored "staleness" enum updated by a job (rejected — no background scheduler in scope, and it duplicates information already in `created_at`).

### Batch-tagging applies one tag to a multi-selection, with Undo

- **Decision:** The quick-fix exposes multi-select + a tag application command that sets a category or adds a muscle to all selected rows in one transaction; the result is reversible via an Undo affordance (`_conv-user-errors`). An exercise leaves the unverified set once its required metadata is complete. _Implementation note:_ the tag is **staged** and only committed on an explicit Apply (the same footer-driven flow as the post-workout editor), so the selection never changes under the user mid-tap; and because the workspace is a modal, its feedback (the Undo affordance and any error) renders **in-modal** via `AlertBox` — a layout-level toast/snackbar would sit behind the dialog backdrop.
- **Rationale:** This is the mechanic the user approved; it bulk-resolves the common case (a pile of same-muscle Ghosts) without a per-row form and bounds the blast radius of a mistake to one Undo.
- **Alternatives considered:** Swipe-to-mass-tag and one-at-a-time cards (both rejected in exploration — accidental mass-mislabeling and per-item tedium respectively).

## Risks / Trade-offs

- **[Risk] Mid-workout Ghosts pile into a "data graveyard" the user never enriches.** → Accepted as largely the user's call: we provide the tools (indicator + batch-tagging) and surface the reminder, but cannot force enrichment. Unverified exercises stay fully usable, so non-enrichment degrades only metadata-driven search, not logging, and the count naturally clears as the user gets to it.
- **[Risk] `verified` drifts from actual completeness** (e.g. a future field joins the "complete" definition). → Keep the flip rule in one backend place (the create/edit/batch-tag path) so "verified" has a single owner.
- **[Risk] Accidental mutation of seeded rows.** → A single repository choke-point refuses writes to slug-bearing rows; seeded immutability is not scattered across commands. (See the table decision.)
- **[Risk] Deleting a user exercise referenced by logged sets orphans data.** → Guarded delete (WO-032): refuse with a `_conv-user-errors` message rather than cascade. (The follow-up templates change extends this guard to template references.)
- **[Risk] The avatar already hosts profile entry on the dashboard; an indicator could collide semantically.** → Treated as an opportunity, not just a risk: the dashboard avatar is the **best home for a future centralized notification system** — it's the app's first page, high-contrast, top-of-view, and user-owned. This workout-domain indicator is the first occupant; its placement/tap-target live in `dashboard`, its count/data in `workout-tracking`, leaving room for other domains to surface here later.

## Migration Plan

1. New Diesel migration rebuilding `exercise` (SQLite can't relax `NOT NULL` in place): add `slug TEXT UNIQUE`, `verified BOOLEAN NOT NULL DEFAULT 0`, `created_at TEXT`, make `category` nullable; backfill seeded rows with a stable `slug` and `verified = 1`.
2. Regenerate Diesel `schema.rs`; add the repository (incl. the single guarded exercise-mutation choke-point) + command layers; regenerate TS bindings.
3. Build frontend surfaces behind the existing workout flows; no existing route is removed.
4. **Rollback:** the feature is additive at the app layer (new columns default to seeded-equivalent values, new tables unused by existing code), so reverting the frontend leaves the schema harmless.

## Open Questions

- Recency window for graceful decay (e.g. 48h) and whether "decayed" is one step or a gradient — to settle when building the indicator; spec leaves it as a scenario-level value.
