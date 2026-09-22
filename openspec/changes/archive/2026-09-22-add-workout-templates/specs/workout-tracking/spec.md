## ADDED Requirements

### Requirement: Workout templates

The system SHALL allow saving a workout as a reusable template, building a template from scratch, and cloning a predefined template. A template names an ordered list of exercises (optionally with target reps/weight and notes). Cloning produces an independent, editable copy; editing a clone SHALL NOT modify the predefined source. A template exercise MAY be swapped for another library exercise via a bottom-sheet picker (per `_conv-modals`). Template editing follows `_conv-modals` and `_conv-validation`.

#### Scenario: [WO-037] Build a template from scratch

- **WHEN** the user names a template and adds an ordered set of exercises
- **THEN** the template is saved with its exercises in the given order

#### Scenario: [WO-038] Clone a predefined template

- **WHEN** the user clones a predefined template
- **THEN** an independent, editable copy is created and editing it leaves the predefined source unchanged

#### Scenario: [WO-039] Swap a template exercise via the bottom sheet

- **WHEN** the user taps a template exercise and selects a replacement from the bottom-sheet picker
- **THEN** that template entry references the replacement exercise, preserving its position in the order

### Requirement: Start a workout from a template

Starting a workout SHALL optionally begin from a template, prefilling the session with the template's exercises in order; the user MAY then log sets as usual. Starting from a template is subject to the existing single-active-session rule.

#### Scenario: [WO-040] Starting from a template prefills its exercises

- **WHEN** the user starts a workout from a template while no session is active
- **THEN** a session is created prefilled with the template's exercises in order, ready for set logging
