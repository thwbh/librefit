## Purpose

**ID prefix:** `PR`

Allow users to review their fitness plan on the dashboard — showing progress, calorie targets, weight journey, and contextual encouragement.

## Requirements

### Requirement: Dashboard plan summary

The system SHALL provide a collapsible "Review plan" section on the home dashboard. When expanded, it SHALL display: a day counter ("Day X of Y"), a journey timeline (start weight to current weight to target weight with visual progress), a calorie plan card (daily target, maximum, weekly rate), and a contextual encouragement message.

#### Scenario: [PR-001] Expand plan review

- **WHEN** the user taps the "Review plan" toggle
- **THEN** the plan details expand with animated transitions

#### Scenario: [PR-002] Collapse plan review

- **WHEN** the user taps the toggle again while expanded
- **THEN** the plan details collapse

### Requirement: Encouragement messages

The system SHALL display contextual motivational messages based on progress. Messages SHALL adapt to: goal reached, last 2 weeks of plan, first 3 days, no intake tracked, within target, and over target.

#### Scenario: [PR-003] Goal reached

- **WHEN** the user's current weight has reached or passed the target weight
- **THEN** a celebratory message is shown suggesting a new goal

#### Scenario: [PR-004] Early days

- **WHEN** the user is in the first 3 days of their plan
- **THEN** a habit-building encouragement message is shown

#### Scenario: [PR-005] Over target intake

- **WHEN** the user's average intake exceeds the target calories
- **THEN** a gentle adjustment suggestion is shown

#### Scenario: [PR-006] Near finish line

- **WHEN** the user has 14 or fewer days remaining in their plan
- **THEN** a motivational finish-line message is shown
