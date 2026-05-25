## Purpose

Provide the app's navigation structure, settings access, informational pages, and error handling.

## Requirements

### Requirement: Bottom dock navigation

The system SHALL display a bottom dock on all app routes with four items: Home (/), Progress (/progress), History (/history), and Settings (modal). The active route SHALL be visually highlighted. Page transitions SHALL use fade animation (see `_conv-animations`).

#### Scenario: Navigate via dock

- **WHEN** the user taps Home, Progress, or History in the bottom dock
- **THEN** the app navigates to the corresponding route with a fade transition

#### Scenario: Settings opens modal

- **WHEN** the user taps Settings in the bottom dock
- **THEN** a floating settings menu appears instead of navigating to a route

### Requirement: Settings menu

The system SHALL display a floating settings menu with items: Profile (/profile), Export (/export), Import (/import), Wizard (/wizard), About (/about). The menu SHALL appear with a fly animation (see `_conv-animations`). Tapping the backdrop SHALL close the menu.

#### Scenario: Navigate from settings

- **WHEN** the user taps a settings menu item
- **THEN** the app navigates to the corresponding route and the menu closes

#### Scenario: Dismiss settings

- **WHEN** the user taps outside the settings menu
- **THEN** the menu closes

### Requirement: About page

The system SHALL display an informational about page with the app logo, tagline, feature highlights, privacy badge, and version number.

#### Scenario: View about

- **WHEN** the user navigates to /about
- **THEN** the page displays logo, features, privacy info, and version

### Requirement: Global error page

The system SHALL display an error page with the HTTP status code, error message, and a Back button that navigates to the home route when an unhandled error occurs.

#### Scenario: Unhandled error

- **WHEN** a navigation error occurs
- **THEN** the error page shows the status code and message with a Back button
