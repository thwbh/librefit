## Purpose

Visualize weight and calorie intake trends over time with charts and analytics, showing actual performance against targets.

## Requirements

### Requirement: Progress charts

The system SHALL display weight and intake trend charts when the user has 2 or more days of tracked data. The weight chart SHALL show daily weight averages as a line with the target weight as an overlay. The intake chart SHALL show daily calorie totals as a line with the target calories as an overlay. A category breakdown SHALL show average calories per food category as horizontal bars.

#### Scenario: Sufficient data

- **WHEN** the user has 2 or more days of data and navigates to /progress
- **THEN** weight chart, intake chart, and category breakdown are displayed

#### Scenario: Chart data accuracy

- **WHEN** charts are rendered
- **THEN** chart legends distinguish "Actual" vs "Target" and theme colors are applied from CSS variables

### Requirement: Progress header

The system SHALL display a progress header with "Day X of Y", a progress bar, and a weight summary showing start weight, current weight, and trend direction.

#### Scenario: Progress display

- **WHEN** the progress page loads
- **THEN** the header shows elapsed days, total days, progress percentage, and weight trend

### Requirement: Insufficient data state

The system SHALL display a "Not enough data yet" message when the user has fewer than 2 days of tracked data, instead of rendering charts (see `_conv-empty-states`).

#### Scenario: New user with one day

- **WHEN** the user has only 1 day of data
- **THEN** charts are not rendered and an encouraging empty state message is shown
