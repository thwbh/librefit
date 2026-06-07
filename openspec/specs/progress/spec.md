## Purpose

**ID prefix:** `PG`

Visualize weight and calorie intake trends over time with charts and analytics, showing actual performance against targets.

## Requirements

### Requirement: Progress charts

The system SHALL display weight and intake trend charts when the user has 2 or more days of tracked data. The weight chart SHALL show daily weight averages as a line with the target weight as an overlay. The intake chart SHALL show daily calorie totals as a line with the target calories as an overlay. A category breakdown SHALL show average calories per food category as horizontal bars.

#### Scenario: [PG-001] Sufficient data renders charts

- **WHEN** the user has 2 or more days of data and navigates to /progress
- **THEN** weight chart, intake chart, and category breakdown are displayed

#### Scenario: [PG-002] Chart legends distinguish actual vs target

- **WHEN** charts are rendered
- **THEN** chart legends distinguish "Actual" vs "Target" and theme colors are applied from CSS variables

### Requirement: Progress header

The system SHALL display a progress header with "Day X of Y", a progress bar, and a weight summary showing start weight, current weight, and trend direction.

#### Scenario: [PG-003] Progress display

- **WHEN** the progress page loads
- **THEN** the header shows elapsed days, total days, progress percentage, and weight trend

### Requirement: Insufficient data state

The system SHALL display a "Not enough data yet" message when the user has fewer than 2 days of tracked data, instead of rendering charts (see `_conv-empty-states`).

#### Scenario: [PG-004] New user with one day

- **WHEN** the user has only 1 day of data
- **THEN** charts are not rendered and an encouraging empty state message is shown

### Requirement: Segmented progress navigation

The progress page SHALL present a segmented control with two segments — Body and Workout — at the top of the page. Body SHALL be selected by default and SHALL host the existing weight, intake, and category charts unchanged. Workout data SHALL not be loaded until the Workout segment is first selected. Switching segments SHALL update the displayed view and reflect the active segment in the URL hash for deep linking. The selected segment SHALL persist when the user navigates away from and back to the progress page, and across app restarts.

#### Scenario: [PG-005] Default segment

- **WHEN** the user navigates to the progress page
- **THEN** the segmented control shows Body and Workout with Body selected, and the existing charts are shown under Body

#### Scenario: [PG-006] Segment switching updates the view and URL

- **WHEN** the user selects the Workout segment
- **THEN** the workout view is shown and the URL hash updates to that segment

#### Scenario: [PG-007] Workout data loaded lazily

- **WHEN** the progress page first loads on the Body segment
- **THEN** workout data is not fetched until the Workout segment is selected

#### Scenario: [PG-008] Segment persists across navigation and restart

- **WHEN** the user selects a segment, leaves the progress page, and returns (or restarts the app)
- **THEN** the previously selected segment is restored

### Requirement: Workout segment time range

The Workout segment SHALL summarise workouts over a selectable time range, defaulting to the last 30 days. The selected range SHALL govern both the muscle coverage map and the workout overview within the segment.

#### Scenario: [PG-009] Default range and selection

- **WHEN** the user views the Workout segment
- **THEN** the last 30 days is summarised by default
- **AND** the user can select a different range, which updates the muscle coverage map and the workout overview together

### Requirement: Muscle coverage map

The Workout segment SHALL display front and back muscle maps for the selected range. Each muscle group SHALL be colored by the strongest role any exercise targeted it with over the range: not targeted, targeted as a secondary muscle, or targeted as a primary muscle. Tapping a muscle group SHALL show its name and that role. (Subjective "intensity" / "activation %" metrics are out of scope — see the deferred analytics exploration.)

#### Scenario: [PG-010] Front and back maps colored by role

- **WHEN** the user views the Workout segment with workouts in range
- **THEN** front and back muscle maps are shown, each muscle colored as not targeted, secondary, or primary based on the strongest role it was trained with over the range

#### Scenario: [PG-011] Muscle group tap

- **WHEN** the user taps a muscle group on the map
- **THEN** its name and its coverage role (not targeted / secondary / primary) are shown

### Requirement: Workout overview list

The Workout segment SHALL list the workouts logged in the selected range as summary cards, most recent first, reusing the history-page card and its detail modal. Tapping a card SHALL open the workout detail modal.

#### Scenario: [PG-012] Workouts listed for the range

- **WHEN** the user views the Workout segment with workouts in range
- **THEN** a summary card is shown for each workout in the range, most recent first

#### Scenario: [PG-013] Card opens detail

- **WHEN** the user taps a workout card in the Workout segment
- **THEN** the workout detail modal opens

### Requirement: Workout segment empty state

When no workouts fall in the selected range, the Workout segment SHALL show an encouraging empty state instead of an empty map and list (see `_conv-empty-states`).

#### Scenario: [PG-014] No workouts in range

- **WHEN** the user views the Workout segment and no workouts fall in the selected range
- **THEN** an empty state is shown in place of the muscle map and overview list, with a prompt to log a workout
