## Why

The exercise library is **seeded and read-only** (`workout-tracking`: "Seeded exercise library"), so a lifter who does an exotic or gym-specific movement has nothing to log it against. This change lets users grow their own library — without breaking mid-session flow — and gives them a low-friction way to fill in the metadata they skipped. (Reusable workout templates build on this in a follow-up change, `add-workout-templates`.)

## What Changes

- **User-created exercises.** Users can add exercises to their library, distinguished from the seeded set. A user exercise created with only a name is flagged **unverified** ("Ghost") so it is usable immediately; supplying its category, muscles, and rest target promotes it to verified.
- **Mid-workout quick-add.** The in-session exercise picker gains a "+" that creates an unverified, name-only exercise and selects it in place — no leaving the active session.
- **Full add/edit screen.** A dedicated screen captures name, category (chips), muscles (a tap-to-cycle primary/secondary list), and default rest, and edits any user exercise. Seeded exercises remain read-only.
- **Dedicated library-management screen.** A Settings screen lists all user-created exercises with a search bar and a floating add action; rows use the standard `_conv-gestures` (swipe-left/long-press edit, swipe-right delete). Unlike the in-session picker, it lists the full library by default rather than prompting to search.
- **Library maintenance surface.** An indicator on the dashboard **user avatar** counts unverified exercises and applies **graceful decay** (prominent when new, muted/desaturated when stale) so it informs without nagging. Tapping it opens a quick-action entry into a **batch-tagging quick-fix**: multi-select unverified exercises and stage a category and/or one or more muscle tags, applied to the whole selection on confirm. The workspace is **edit-only**.
- **Reversible destructive/bulk actions.** Applying a batch tag and deleting a user exercise are reversible via a **grace-period Undo snackbar** (`_conv-undo`, a new convention introduced here).
- **Non-goals.** No one-at-a-time "swipe/Tinder card" review interface and no haptic/gamification layer (both were considered and rejected during exploration). No per-exercise history/stats surface, no cardio/other workout types (the `wl` type seam is untouched). Workout templates are a separate change (`add-workout-templates`). Mid-workout quick-add captures a **name only** — no metadata form is shown during a session.

## Capabilities

### New Capabilities

_None._ This extends existing capabilities rather than introducing a new domain.

### Modified Capabilities

- `workout-tracking` (`WO`): the exercise library becomes **user-extensible** (seeded + user-created), exercises carry a **verification status**, and the change adds full exercise CRUD, the mid-workout quick-add path, a **dedicated library-management screen**, and the **batch-tagging quick-fix** (multi-tag) for promoting unverified exercises. The existing "Seeded exercise library" requirement is amended; the search requirement is scoped to the in-session picker; seeded exercises stay read-only.
- `dashboard` (`DH`): the dashboard's user **avatar gains an unverified-exercise indicator** (count + graceful decay) and a quick-action entry into the batch-tagging quick-fix. This is dashboard composition — a workout-domain count surfaced on a profile element shown on the home surface — so it lives here, not in `workout-tracking` or `profile`.

## Impact

- **Backend (Rust/Diesel):** a migration hardening the single `exercise` table — a `slug` natural key (non-null for seeded rows, the stable reference used by seeded content), a `verified` flag, and an `added`/`time` creation stamp (split local date/time, per the intake/weight_tracker convention); no `user_id` (single local user). Seeded immutability is enforced at a single repository choke-point. New repository functions and Tauri commands for exercise create/edit/delete, listing seeded vs user, unverified count, and batch-tag application.
- **API bindings (TS):** new commands surfaced through the generated `$lib/api` bindings.
- **Frontend (SvelteKit 5):** "+" in the in-session exercise picker; exercise add/edit screen (`ValidatedInput`, a shared category-chips + muscle-cycle picker `ExerciseTagPicker`, and the cross-app trash-toggle delete pattern); dedicated `/exercises` management screen (search + floating add + swipe gestures); avatar indicator and batch-tagging quick-fix workspace on the dashboard. New app-shell **`SnackbarContainer`** + an `undoSnackbar` helper carry the grace-period Undo (toasts also moved to the bottom, clear of the nav dock).
- **Conventions:** `_conv-modals` (add/edit), `_conv-validation` + `_conv-user-errors` (validation, error surfacing), **`_conv-undo`** (new — grace-period Undo snackbar for batch-tag apply and delete), `_conv-gestures` (management-row swipe/long-press edit/delete), `_conv-empty-states` (empty library / nothing-to-verify states), `_conv-test-traceability` (every new scenario cited by a test).
- **Out of scope / future:** workout templates (`add-workout-templates`), per-exercise history & stats, cross-session prefill, and workout types beyond `wl`.
