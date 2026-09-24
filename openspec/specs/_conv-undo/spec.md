## Purpose

**ID prefix:** `UND`

Define the consistent **grace-period Undo** convention for actions that complete immediately. Destructive or bulk actions SHALL let users act decisively (no blocking confirmation for every case) while still offering a brief, low-friction way to reverse them. Shared across features — e.g. exercise delete and batch-tagging in `workout-tracking`.

## Requirements

### Requirement: Grace-period Undo affordance

A reversible action SHALL, on completion, surface a non-blocking Undo affordance (a snackbar) for a bounded grace period. The affordance appears **after** any originating modal closes (a snackbar behind a dialog backdrop is not acceptable). Tapping Undo within the grace period SHALL revert the action; letting the period lapse SHALL commit it. Undo is best-effort and SHALL fail silently per `_conv-user-errors` if it cannot complete.

#### Scenario: [UND-001] Completed action offers Undo

- **WHEN** a reversible action completes
- **THEN** a snackbar with an Undo action is shown for a bounded grace period

#### Scenario: [UND-002] Undo reverts within the grace period

- **WHEN** the user taps Undo before the grace period lapses
- **THEN** the action is reverted

#### Scenario: [UND-003] Lapsing the grace period commits

- **WHEN** the grace period lapses without the user tapping Undo
- **THEN** the action remains applied (no automatic revert)
