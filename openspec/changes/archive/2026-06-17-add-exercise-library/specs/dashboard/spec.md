## ADDED Requirements

### Requirement: Unverified-exercise indicator on the dashboard avatar

The dashboard SHALL surface a maintenance indicator on the user avatar reflecting the count of unverified exercises (owned by `workout-tracking`). The indicator SHALL show the count, and SHALL apply **graceful decay**: prominent when the unverified exercises are recent, muting/desaturating as they age, so it informs without nagging. The indicator SHALL clear when no unverified exercises remain. This is dashboard composition — a workout-domain count rendered on a profile element on the home surface — and the indicator's placement on the dashboard is owned here; the underlying verification status and count are owned by `workout-tracking`.

#### Scenario: [DH-019] Avatar indicator shows the unverified count

- **WHEN** the dashboard is shown and unverified exercises exist
- **THEN** the avatar carries an indicator displaying the number of unverified exercises

#### Scenario: [DH-020] Indicator decays as unverified exercises age

- **WHEN** the unverified exercises behind the indicator have aged past the recency window
- **THEN** the indicator is rendered in its muted/desaturated (decayed) state rather than the prominent state

#### Scenario: [DH-021] Indicator clears when nothing is unverified

- **WHEN** no unverified exercises remain
- **THEN** the avatar shows no maintenance indicator

### Requirement: Quick-action entry to the batch-tagging quick-fix

Tapping the avatar maintenance indicator SHALL open a quick-action entry that takes the user into the batch-tagging quick-fix workspace (owned by `workout-tracking`), without navigating through deep menus.

#### Scenario: [DH-022] Tapping the indicator opens the quick-fix

- **WHEN** the user taps the avatar maintenance indicator
- **THEN** a quick-action entry opens leading directly into the batch-tagging quick-fix workspace
