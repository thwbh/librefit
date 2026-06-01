## Context

LibreFit's dashboard (`src/routes/(app)/+page.svelte`) is a static SvelteKit page driven by `data.dashboardData`, loaded once and refreshed via `useRefresh` → `invalidate('data:dashboardData')`. There is no streaming or realtime backend; "live" means frontend state derived from persisted rows. Workout tracking is a new domain — there is no existing workout concept anywhere in the specs, data model, or UI.

This design covers the standalone workout-tracking capability: its data model, the live-session lifecycle, the Idle↔Active dashboard morph, and the mobile lifecycle behavior of the timer.

### Current State

- Dashboard composes `IntakeScore`/`IntakeStack` (calories), `WeightScore` (weight), and `PlanReviewPanel`.
- Intake entries: `added` / `amount` / `category` / `description` / `time`. Weight: `added` / `amount` / `time`. Both are thin, single-table CRUD trackers.
- Lookup tables already exist as a precedent (`food_category` with `shortvalue`/`longvalue`).
- SQLite via `libsqlite3-sys 0.30` (bundled, ~3.46); Diesel 2.2 with the `sqlite` backend.

### Constraints

- Maintain the app's minimalism; match existing schema idioms (TEXT ISO dates, lookup tables, INTEGER ids).
- Adhere to `_conv-modals`, `_conv-validation`, `_conv-user-errors`, `_conv-animations`.
- Mobile target is Android (Tauri 2). Backgrounded/locked WebViews throttle or freeze JS timers and may be suspended/killed.

## Goals / Non-Goals

**Goals:**

- Introduce workout tracking as a standalone capability, started and run from the dashboard via a fullscreen overlay.
- A structured, queryable session/set model with a seeded exercise library.
- An adaptive dashboard that morphs between Idle and Active-Workout states.
- A live timer that is correct across screen lock, backgrounding, and restart.

**Non-Goals:**

- Coupling workouts to the calorie budget (intake/weight math is untouched).
- Browsing past workouts or per-exercise history/stats (no route is added this change).
- Performance ghosting / progressive-overload feedback (pre-filling a set from the exercise's prior performance, "beat last session" delta). It is now _data-feasible_ — `workout_set` history is persisted as of this change, so the brainstorm's original blocker ("history is calorie data") no longer applies — but it depends on per-exercise historical queries and is deferred _with_ the history surface. This is the highest-value reason to build that surface next. (Note: _within-session_ prefill — copying the previous set of the same exercise in the active session — IS in scope; only the _cross-session_ version is deferred.)
- Post-workout PR detection, cross-session comparison ("vs last Tuesday"), and shareable/social summary cards — the finish summary ships with _this-session_ totals only; the comparative and social layers depend on history and are a future change.
- Workout templates / routines, "Continue last workout", and "Start from template" — Start opens an empty session this change; saved routines are a separate future domain (also history-dependent).
- After-the-fact logging of a completed workout (live sessions only).
- Time-of-day dashboard states (Morning/Evening).
- A cross-route persistent session bar (the "Spotify bridge") — deferred to a follow-up change; see Decisions.
- Workout types beyond weight lifting (`wl`); the `type` seam exists, but cardio/yoga/etc. layouts and metrics are separate future changes.
- Any Android foreground service / persistent notification timer — including a rest-complete alert while the app is backgrounded (the in-app rest countdown is in scope).

## Decisions

### Standalone, not calorie-coupled

**Decision:** Workouts do not affect intake or weight. **Rationale:** Keeps the change scoped to one new spec and leaves `IntakeScore`'s target math untouched. Coupling (burned calories raising intake headroom) is a deliberate future option, not this change.

### Not polymorphic over the calorie entry

**Decision:** Workouts get their own tables (`workout_session` / `workout_exercise` / `workout_set`) — **not** a `type` flag on the calorie `intake` table repurposing `amount`→weight / `category`→exercise / `description`→reps. **Rationale:** The polymorphic-over-intake option was considered and rejected: overloading the calorie row's generic fields yields a "junk-drawer" schema that pollutes calorie history and can't be queried or scaled. Workouts are a separate domain with a separate skeleton.

### Schema authority in Rust: structured skeleton + compiled-schema metric payload

**Decision (supersedes the earlier "No JSON/JSONB" decision):** The relational **skeleton** (session, exercise, set, pauses, library, lookups, all FKs/ordering/timestamps) stays typed SQL columns. Only the **type-varying set metrics** live in a flexible `workout_set.metrics` (`TEXT`/JSON) column. The schema for that payload is a **Rust struct per workout type — the single source of truth.** `tauri-typegen` generates the frontend Zod validator from the same struct, so the frontend pre-validates and the Rust command re-validates on write; the DB never types the blob.

**Why this reverses the old "no JSON" stance honestly:** the original objection was "Diesel/SQLite can't type or validate JSON, so you lose type-safety and queryability." That objection is answered by _moving schema authority out of the database_: Rust owns the type, validation is generated (not hand-duplicated or scattered into runtime templates), and the DB is a dumb store. The win is that adding a metric (`rpe`, `tempo`) or a whole type (cardio's `{distance,pace}`) needs **no `ALTER TABLE` on already-shipped consumer devices** — only relational/structural changes still take migrations. This is _not_ EAV (rejected as junk-drawer) and _not_ a DB-stored `ui_schema` template (rejected — see below); it is "strong skeleton, flexible skin" with the skin's contract compiled into the binary. (A DB-stored `ui_schema` _template_ — schema rows the backend reads at runtime — was also considered and rejected: it returns schema authority to the database at runtime, re-introducing the ghost-data problem without compile-time safety or generated frontend validators.)

**What stays relational (NOT in the payload):** muscles (seeded `muscle` lookup + `exercise_muscle` join, `role` primary/secondary) — they're queried ("all chest exercises"), so they stay normalized. The flexible column is reserved for genuinely type-varying _measurements_, not for anything we filter/join on.

**Cost retained:** metric-level SQL analytics (e.g. "sum load across all bench sets" for future history/ghosting) read the JSON rather than a column — app-side aggregation, or SQLite `json_extract` in a query. Acceptable because history is deferred; live total-volume is small-N and already computed app-side.

### Schema evolution: `payload_ver` + Lenient read (migration-on-read)

**Decision:** Because the metric blob is decoupled from the migration system that governs columns, every `workout_set` carries a real `payload_ver` column, and reads use the **Lenient read / migration-on-read** pattern: _permissive on parse_ (accept old/extra keys, fill defaults), _upcast_ the payload to the current shape by version, then expose a _strict_ current struct to callers. Simple structural blob changes (rename/add/drop a key) are expressed as ordinary **SQL migrations using SQLite's JSON1 functions** (`json_set`/`json_remove`/`json_extract`), keeping them on the Diesel timeline; only genuinely semantic changes fall back to programmatic upcasting in Rust. **Rationale:** this is the one real risk of code-as-schema — historical blobs going "ghost" when the struct changes (a field made required, a key renamed). `payload_ver` makes un-migrated rows queryable (`WHERE payload_ver < N`) and the lenient/upcast path keeps old data renderable. **Build-pipeline notes:** the Cargo→Zod generation runs in CI on every build and the generated schemas are not committed, so "stale artifact" drift can't occur (the orchestration-tax risk is handled). The accepted DX cost: a Rust metrics-struct change _is_ a frontend breaking change (caught at typegen/compile), traded for not maintaining an ever-growing set of mostly-unused per-type tables.

### Build the flexible payload now (uniform), not at cardio

**Decision:** Even though weight lifting is the only type shipping, its set metrics go through the Rust-gated payload from day one — the pattern is uniform across all (current and future) types. **Rationale:** the whole point is to avoid schema migrations landing on consumer devices when a new metric or type arrives; introducing the payload later would itself be the painful migration we're trying to avoid, and would leave lifting and cardio structurally asymmetric. Validated end-to-end now with one type.

### Active work time is the primary duration (pauses are stored)

**Decision (supersedes the earlier "Pause is UI-only / wall-clock" decision):** Pausing records a `workout_pause` interval (`paused_at`/`resumed_at`); the primary metric shown is **active work time** = `(now − started_at) − Σ(paused intervals)`, with wall-clock duration available in session details. Still derived (never an incrementing counter) and durable across backgrounding/restart — recomputed from `started_at` and the persisted pause intervals on resume. **Rationale:** the earlier wall-clock-only choice made duration meaningless when a user pauses for a phone call; tracking cumulative _unpaused_ time gives a training-density metric that's invariant to interruptions **without** any intent detection ("is this rest or lollygagging?" is irrelevant — only unpaused time counts). Cost is one small `workout_pause` table, accepted. The Android-lifecycle reasoning is unchanged: timestamps are the source of truth, JS intervals are cosmetic, and the UI recomputes on `visibilitychange`/resume.

### Overlay, not a route; FAB unchanged

**Decision:** The session runs in a fullscreen modal overlay over the dashboard, not a new `/workout` route; the existing `+` FAB remains calorie-only and the workout is started from its own dashboard module. **Rationale:** Preserves the user's mental model ("entered a mode," not "navigated away") and avoids touching `app-shell` nav or the intake input flow. Context-aware / dual-utility / segmented FABs were considered and rejected as either ambiguous or adding taps to the existing one-tap calorie flow.

### Sets and sessions are mutable (CRUD), not append-only

**Decision:** Sets can be edited (reps/load) and deleted, and an active session can be **discarded** (deleted with its sets) as distinct from **ended** (kept with `ended_at` recorded). **Rationale:** Mistyped reps/load are routine; an append-only log corrupts the source of truth. This matches the app's existing CRUD precedent — intake supports full create/update/delete via `useEntryModal`/`IntakeModal`; mutation flows follow `_conv-modals` + `_conv-validation`. (Weight is update-only by choice, but workout sets are closer to intake entries.)

### Rest timer is in-app only, target resolved from the exercise

**Decision:** Logging a set auto-starts a rest countdown, derived as `now − max(logged_at)` against a **rest target resolved from the logged exercise's `default_rest_seconds`, falling back to a global default** when the exercise defines none; it ends on user tap, expiry, or logging the next set, and Rest is a sub-mode of the active session (not a separate persisted state). **Rationale:** rest is core to a lifting tracker and the target genuinely depends on the work (≈2 min for high-volume, ≈5 min for heavy) — so it belongs on the exercise, not a single global value. Reuses the derived-timestamp model (no "resting" column — the latest set's `logged_at` is the anchor, durable across backgrounding). A per-set _manual override_ (the full _override > exercise > global_ hierarchy) is a reasonable later addition but deferred. **Boundary:** a rest alert that fires _while the app is backgrounded/locked_ requires an Android notification/foreground service and stays **deferred** with the persistent-bar work — only the in-app countdown is in scope.

### Session `type` selects layout AND metric schema; the skeleton is shared

**Decision:** Each session carries a `type` (seeded `workout_type` lookup). The type selects both the active dashboard layout (owned by `dashboard`) and the **metric schema** validated on each set (the Rust payload struct). Weight lifting (`wl`) is the only type this change ships. **Rationale:** with the compiled-schema payload, `type` is now a _real_ data seam, not merely a layout flag — but the relational **skeleton is shared** across types (`session → exercise → set`), and only the leaf `metrics` payload varies. **Danger recorded (updated):** a future type like cardio reuses the same skeleton with its `workout_exercise`/`workout_set` degenerating to single rows and a `{distance,pace}` payload — it does **not** get its own tables, and it is still a separate change (new Rust struct + layout + seed types). Do not read `type` as "cardio is already implemented"; read it as "the seam to add cardio without a device migration exists."

### Stale session auto-completion (zombie sessions)

**Decision:** A session left active with no set logged and no pause/resume for a prolonged inactivity threshold is auto-completed: transitioned active→completed with `ended_at` set to the **last activity** time (not the idle "now"), preserving all logged data. **Rationale:** an indefinitely-active session would pollute future daily averages/trends with meaningless duration and volume; anchoring `ended_at` to last activity keeps the recorded session honest. A long threshold mitigates the "unintended completion" risk of cutting off a legitimate long break. No hard kill — the data is preserved and reviewable. (Detection runs on app open / session read, consistent with the timestamp-derived model; no background process.)

### Two capabilities: `dashboard` owns composition, `workout-tracking` owns the domain

**Decision:** Split the work across two new capabilities. `workout-tracking` (`WO`) owns the workout domain (sessions, sets, library, live metrics, durability, pause/end). The home dashboard's cross-feature composition and Idle↔Active adaptation (layout/ordering, promoting the workout module, collapsing the calorie/weight cards to micro-rows, contextual expansion, the state machine that follows the session lifecycle) is owned by a new `dashboard` (`DH`) capability. **Rationale:** The morph is the first behavior in the app that belongs to no single feature — it cannot be stated without naming the calorie, weight, and workout surfaces together. Parking it in `workout-tracking` would make the workout feature own how intake/weight cards render (a reverse coupling leak); parking it in a feature spec it doesn't belong to is worse as a 4th feature arrives. The dependency direction is correct: `dashboard` composes features (it may know they exist), while `workout-tracking` knows nothing about intake/weight presentation.

**Discriminator (guardrail against sprawl):** a scenario belongs to `dashboard` **iff** stating it requires naming two or more features (composition / coexistence / adaptation). A scenario about a single feature's own card stays in that feature's spec. By this rule `dashboard` starts small (`[DH-001..006]`); nothing migrates out of intake/weight, and existing single-region placements (plan-review panel, header) stay with their owners. `app-shell` keeps the generic page contracts (data-freshness, pull-to-refresh) — those are "any page," not composition. The reusable morph patterns (micro-visualization, contextual-expansion accordion, visual-weight-shift palette) stay concrete inside `dashboard` until a second surface needs them; only then promote to a `_conv-*`.

### Slide-to-confirm scoped to workout (generalization deferred)

**Decision:** Slide-to-confirm (with threshold haptics, per `_conv-gestures`) guards only the workout's End and Discard (`WO-023/024`); it is **not** generalized to app-wide confirmations in this change. **Rationale:** the strong rationale (sweaty/shaky/one-handed, glance-and-tap) is gym-specific. Generalizing was considered and **deferred** to a future hand-written convention change (conventions are authored outside the opsx flow), where the rule would be _tiered_: haptic broadly, slide-to-confirm for **destructive/irreversible** actions only (delete entry, import-overwrite, discard), plain **tap to cancel** — friction belongs on the dangerous action, not the safe escape. A **bidirectional slider** (direction encodes confirm vs cancel for all modals) was considered and **rejected**: it taxes the safe action with symmetric friction, makes a wrong-direction slip on a delete dangerous, hurts discoverability/accessibility, and collides with the existing two-button `_conv-modals` + `VAL-013` (the Save-button shake has no button to shake under a slider).

### Responsive transitions: optimistic morph, committed state still the truth

**Decision:** The dashboard morph is driven by the _initiation_ of a workout transition (optimistic), not its settled persisted result. A transient transitional state (`starting`/`ending`, entering/leaving rest) layers above the committed state and binds the animation to the user's action; the committed session row remains the SSOT and reconciles it — confirm on success, **revert on failure** (error per `_conv-user-errors`). **Rationale:** even a local `tap → IPC → Rust → SQLite → reactive invalidate → re-render` round-trip makes a settle-then-react morph feel laggy, briefly showing the old layout for an already-transitioned session. Binding the morph to the action removes the gap. **This does not undermine durability:** the transitional state is never persisted, so an app kill mid-transition recovers from the committed state (an un-committed start → `idle` on restart, no ghost-active; a committed-active → resumes active). **Rollback is mandatory** — the classic optimistic-UI failure is a morph that begins on intent and never reverts; `WO-002` (start refused while one is active) is a real failure path the revert must cover. **Where it bites:** mostly Start (dashboard morphs to active under the opening overlay), the rest sub-mode (`DH-007/008`), and minimize/restore — _not_ End, whose idle morph is already masked by the post-workout summary surfacing first (`WO-022`).

### Cross-route persistent session bar deferred (the "Spotify bridge")

**Decision:** This change shows active-session state **only on the dashboard** (the Idle↔Active morph). A slim session bar visible on _every_ route while a workout runs — the brainstorm's "Spotify bridge" — is deliberately deferred to a follow-up change. **Rationale:** The bar is an `app-shell` concern (rendered in `(app)/+layout.svelte`, above the router) and this change deliberately leaves `app-shell` untouched. It is _not_ superseded by the dashboard morph: the morph covers only the dashboard surface, so without the bar, navigating to another route while a session is active leaves no indicator or re-entry point — that gap is the follow-up's scope. The bar needs no backend realtime; it would read the active session row and derive `now − started_at` exactly as the dashboard does. (This deferral is also why the earlier "real-time Rust service" framing was dropped — the liveness was always frontend-derived, never a service.)

### Idle↔Active adaptive dashboard

**Decision:** Two states only. **Idle:** calories card, weight card, then a Start Workout module below. **Active (overlay minimized):** the workout module moves to the top with a high-energy palette; the calorie and weight cards collapse into **micro-progress-bar** rows (a thin progress fill, not plain text — preserving pre-attentive readability); tapping a collapsed row expands it back to the full card (contextual expansion). **Rationale:** Shifts the dashboard's hierarchy from information (idle) to action/feedback (active) while keeping everything above the fold and never losing nutritional data. Time-of-day states were a brainstorm tangent and are out of scope.

## Data Model

**Hierarchy:** `workout → exercise → set` (conventional/nested). An _exercise_ groups the _sets_ done of it; a _set_ is the leaf you log (reps × weight for lifting); a _rep_ is the count on the set, not a row.

**Skeleton (relational, migratable) + flexible metric payload on the leaf:**

```
── seeded lookups (food_category precedent) ──
exercise_category {shortvalue PK, longvalue}   muscle {shortvalue PK, longvalue}
workout_type {shortvalue PK, longvalue}   seed: 'wl' → 'Weight lifting'

exercise (library)                     exercise_muscle (join, M:N)
  id PK                                  exercise_id FK → exercise  ┐ PK
  name                                   muscle      FK → muscle    ┘
  category    FK → exercise_category     role  ('primary'|'secondary')
  default_rest_seconds  INT NULL  (→ global fallback)

workout_session                        workout_pause
  id PK                                  id PK
  type  FK → workout_type                session_id FK → workout_session
  name  NULL                             paused_at  TEXT
  started_at TEXT                        resumed_at TEXT NULL
  ended_at   TEXT NULL (NULL = active)

  workout_exercise   (grouping)          workout_set   (leaf)
    id PK                                  id PK
    session_id  FK → workout_session       workout_exercise_id FK → workout_exercise
    exercise_id FK → exercise              sequence    INT
    sequence    INT                        logged_at   TEXT
                                           payload_ver INT
                                           metrics     TEXT  ◀── Rust-gated JSON blob
                                             wl: {"reps":10,"weight_kg":80,…}
```

The **skeleton columns are relational and migratable** (FKs, ordering, timestamps, `payload_ver`). Only the **type-varying metrics** live in `workout_set.metrics`, validated by a Rust struct per workout type (the SSOT) and never typed by the DB. Cardio later attaches `{distance,pace}` to the same leaf with its `workout_exercise`/`workout_set` degenerating to single rows; no new tables, no `ALTER TABLE` on shipped devices.

Derived (computed, never stored): **active work time** = `(now − started_at) − Σ(resumed_at − paused_at)` (primary duration; wall-clock = `now − started_at` available in details); **total volume** = `Σ(reps × weight_kg)` over the workout's sets (app-side, reads the payload); **sets completed** = count of `workout_set`; **rest elapsed** = `now − max(logged_at)` against the exercise's rest target. At most one session has `ended_at IS NULL`.

## Risks / Trade-offs

- **One-active-session invariant** isn't enforceable by a simple SQLite constraint. → Enforce in the repository/command layer (refuse to start a new session while one is active).
- **Metric blob loses SQL-level analytics.** Aggregating across the `metrics` payload (future history/ghosting/cross-type reports) needs `json_extract` or app-side loops, not indexed column scans. → Accepted: history is deferred; live metrics are small-N and computed app-side. Revisit (e.g. generated columns / metric extraction) only when a history/stats surface is built.
- **Blob ↔ migration decoupling.** Struct changes can strand historical payloads. → Mitigated by `payload_ver` + Lenient read (migration-on-read) + JSON1 SQL migrations for structural changes (see Decisions); the residual is discipline (every struct change ships an upcast path or a version bump).
- **No history surface** means logged sessions aren't browsable yet. → Acceptable because the change scopes history as a Non-Goal; revisit with a dedicated route. Note the highest-value driver for that follow-up is **performance ghosting** (see Non-Goals).
- **Interface volatility (accepted).** The active morph deliberately reorders the dashboard (workout → top, metric cards collapse), which trades against the brainstorm CRITIC's repeated argument for spatial stability / muscle memory. → Accepted: putting the active session in the prime slot is the intent. The micro-rows + contextual expansion keep the displaced metrics readable and one tap away, which mitigates the disorientation the warning was about. Not adding a fixed-anatomy constraint.

## Open Questions

- Seed content: what's the initial exercise/muscle/category seed list? (Resolve during implementation; not behavior-defining.)

## Deferred enhancements (summary-screen brainstorm)

Ideas raised while iterating on the post-workout summary. All are **out of scope for this change** — the summary ships as a read-only receipt (this-session stats, worked-muscle body map, per-exercise set recap). They cluster onto two future OpenSpec changes the architecture was already built to absorb:

**Metric-payload extension** (uses the compiled `LiftingSetMetrics` → typegen seam; add fields + regen Zod, no device migration):

- **RPE per set** — Rate of Perceived Exertion alongside reps/weight, giving the volume/time numbers qualitative context.
- **Set-level annotations** — a note/tag per set (e.g. RPE, a ⚠️ "twinge/pain" marker).
- **Session note** — a single free-text "post-workout thought" (e.g. "low sleep", "felt energized"); needs a `workout_session.note` column + command.

**History surface** (depends on cross-session queries; highest-value follow-up):

- **PR / volume-increase badges** — "New PR", "Volume +X%" on exercises — needs prior-session comparison (the summary is this-session only by decision).
- **Anomaly / "review required" highlighting** — flag suspicious sets. Note: zero-reps can't occur (reps validated ≥ 1) and "massive deviation" needs a baseline, so this is history-dependent; a purely in-session outlier flag is frontend-only but low value alone.
- **Editing finished sessions** — in-line edit/delete _from the summary_. Blocked today: the mutation commands require an **active** session (`require_active`), so editing an ended session needs backend support. Correction currently lives on the **active** screen, which already uses swipe edit/delete (`SwipeableListItem`); reuse that gesture if/when editing past sessions lands.

**Recovery bridge** (new content domain, lowest priority):

- **Mobility/stretch recommendations** keyed off the highlighted muscle groups — needs a routine/content library and a muscle→routine mapping.
