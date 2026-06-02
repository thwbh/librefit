## Purpose

**ID prefix:** `GES`

Define consistent touch gesture conventions used across all interactive data entries and navigable item sequences. Picker-specific swipe semantics (e.g. avatar randomize/reset) live in the owning feature spec.

## Requirements

### Requirement: Long-press to edit

The system SHALL trigger edit mode when the user long-presses an entry card. The long-press SHALL trigger haptic feedback (vibrate) before opening the edit modal. Concrete duration is declared by the scenarios below.

#### Scenario: [GES-001] Long-press at threshold triggers edit

- **WHEN** the user presses and holds an entry card for 300 ms
- **THEN** the device vibrates and the edit modal opens with the entry's data pre-filled

#### Scenario: [GES-002] Press below threshold does not trigger edit

- **WHEN** the user presses and releases an entry card after less than 300 ms
- **THEN** no edit modal opens and no haptic feedback fires

### Requirement: Swipe to edit

The system SHALL open the edit modal when the user swipes left on an entry card.

#### Scenario: [GES-003] Swipe left opens edit

- **WHEN** the user swipes left on an entry card
- **THEN** the edit modal opens with the entry's data pre-filled

### Requirement: Swipe to delete

The system SHALL open a delete confirmation dialog when the user swipes right on an entry card.

#### Scenario: [GES-004] Swipe right opens delete confirmation

- **WHEN** the user swipes right on an entry card
- **THEN** a delete confirmation dialog appears showing a read-only preview of the entry

### Requirement: Swipe to navigate

The system SHALL support left/right swipe gestures to navigate between sibling items in stacked or paginated UIs. This applies to: intake stack cards (adjacent entries), history date selector (adjacent weeks), and the history content area (adjacent days, with cross-week loading at boundaries).

#### Scenario: [GES-005] Swipe between intake cards

- **WHEN** the user swipes left or right on the intake stack
- **THEN** the displayed card changes to the next or previous entry

#### Scenario: [GES-006] Swipe weeks in history

- **WHEN** the user swipes the history date selector left or right
- **THEN** the next or previous week loads

#### Scenario: [GES-007] Swipe days in history content

- **WHEN** the user swipes the history content area left or right
- **THEN** the next or previous day is selected with a slide animation

#### Scenario: [GES-008] Swipe across history week boundary

- **WHEN** the user swipes past the last or first day of the visible week
- **THEN** the adjacent week is loaded and the boundary day is selected
