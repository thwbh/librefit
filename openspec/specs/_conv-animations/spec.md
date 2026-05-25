## Purpose

Define consistent animation and transition conventions used across the app.

## Requirements

### Requirement: Page transitions

The system SHALL use fade animations when transitioning between app routes via the bottom dock.

#### Scenario: Route change

- **WHEN** the user navigates to a different route
- **THEN** the page content transitions with a fade animation

### Requirement: Overlay animations

The system SHALL use fly animations for floating menus and modal overlays (e.g. settings menu).

#### Scenario: Settings menu appears

- **WHEN** the settings menu opens
- **THEN** it appears with a fly animation

### Requirement: Content navigation animations

The system SHALL use slide animations when navigating between items in a sequence (e.g. day-by-day in history, card-by-card in intake stack).

#### Scenario: Day navigation

- **WHEN** the user swipes between days in history
- **THEN** the content transitions with a slide animation
