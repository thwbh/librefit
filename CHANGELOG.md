# Changelog

All notable changes to LibreFit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project uses [Calendar Versioning](https://calver.org/) (YY.WW.MICRO format).

## [Unreleased]

### Added

- Workout history on the History page: a per-day "Activity" section listing each workout; tap a card for full detail with a front/back muscle map, swipe to edit or delete, and add workouts for past dates.
- Today's completed workouts now appear on the dashboard, with Start Workout still available to begin another session.
- Progress page gains a Body / Workout toggle: the Workout view shows a muscle coverage map and your workouts over a selectable range (30 or 90 days), and remembers the selected tab.

## [26.23.3] - 2026-06-03

### Fixed

- Fixed indefinite dashboard loading loop caused by unguarded shared state mutation
- Stabilized refresh handler identity to prevent render-phase write↔read loops

## [26.23.2] - 2026-06-02

### Fixed

- Set minify from esbuild to oxc as support was dropped
- CI stability changes

## [26.23.1] - 2026-06-02

### Fixed

- Resolved tauri cargo/npm dependency mismatch
- Updated .npmrc configuration

## [26.23.0] - 2026-06-02

### Added

- Complete workout tracking system with weight-lifting support
- Live workout overlay with real-time stats and exercise management
- Exercise library with categorized exercises and muscle targeting
- Workout session management (start, pause, resume, end, discard)
- Set logging with reps and weight tracking
- Per-exercise set recap on completion summary
- Worked-muscle body map visualization on workout completion
- Adaptive dashboard that morphs to show active workout
- Searchable exercise picker with muscle group filtering
- Slide-to-confirm gesture for workout actions
- Rest timer with configurable durations

### Changed

- Dashboard layout now adapts to show active workout session
- Upgraded Svelte to version 5.50
- Upgraded Rust dependencies (Diesel, Validator, etc.)
- Upgraded JavaScript dependencies (SvelteKit, Vitest, etc.)
- Adopted svelte-body-highlighter muscle slugs as shared vocabulary
- Improved test coverage for workout tracking functionality

### Fixed

- Start Set button now always opens exercise picker (no longer reuses last exercise)
- Exercise picker properly handles search and filtering
- Workout completion screen shows correct muscle mapping
- Dashboard morphing animation works smoothly
- Fixed WebView Android insets that moved the FAB over the navigation bar

## [26.07.3] - 2026-02-16

### Fixed

- Background color for Android system bar in edge 2 edge
- Disabled Android app window overscrolling

## [26.07.2] - 2026-02-15

### Changed

- Branded headers on setup wizard, profile, import, and export pages
- Redesigned wizard step indicator with animated progress bar
- Weight goals card now shows an inline start-to-target flow with trend indicator
- Styled list indicators on import and export pages
- Settings menu with icons and improved close behavior
- Progress page shows a message when fewer than 2 days of data are tracked

### Fixed

- Progress charts no longer include today's incomplete data
- Day counter displays correctly on dashboard and progress pages
- Floating action button stays visible when scrolling
- Android safe area insets for devices with notches or gesture navigation

## [26.07.1] - 2026-02-12

### Changed

- Redesigned dashboard with branded header, journey progress bar, and calorie plan overview
- Redesigned progress page with weight and intake charts, category breakdown, and trend indicators
- Redesigned history page with category overview and improved entry management
- New calorie plan card with target and average intake progress bars
- Updated activity level and meal category colors
- Redesigned category picker
- Weight tracker entries can now be added and edited from the history page

### Removed

- Standalone review page (merged into dashboard)

## [26.07] - 2026-02-10

### Changed

- New app logo and refreshed color palette
- Updated app icons across all platforms

## [25.49.1] - 2025-12-03

### Fixed

- Data Import failing due to missing Android file system permissions
- Data Import/Export error messages not wrapping properly

## [25.49.0] - 2025-12-01

### Added

- Initial release of LibreFit
- Calorie tracking with customizable meal categories (breakfast, lunch, dinner, snacks, treats)
- Weight tracking with historical data and progress visualization
- Personalized targets based on user goals (maintain, lose, gain weight)
- Interactive dashboard with daily calorie and weight overview
- Historical view with weekly navigation and detailed entry management
- Progress visualization with interactive charts
- Data export functionality (CSV and raw SQLite database formats)
- Data import capability for restoring backups
- User profile management with customizable avatar
- Swipeable card interface for quick entry management
- Long-press gesture support for editing entries
- Onboarding wizard for first-time setup
- Haptic feedback on supported devices
- Android platform support
- Offline-first architecture with local SQLite database
- Privacy-focused: all data stored locally, no cloud sync required

### Technical Details

- Built with Tauri 2.2 for native performance
- Svelte 5 frontend with modern runes-based state management
- Rust backend with Diesel ORM
- SQLite database for data persistence
- CalVer versioning (YY.WW.MICRO)
- F-Droid compatible build process
- Reproducible builds support

[Unreleased]: https://github.com/thwbh/librefit/compare/26.23.0...HEAD
[26.23.0]: https://github.com/thwbh/librefit/releases/tag/26.23.0

[26.07.3] https://github.com/thwbh/librefit/releases/tag/26.07.3
[26.07.2]: https://github.com/thwbh/librefit/releases/tag/26.07.2
[26.07.1]: https://github.com/thwbh/librefit/releases/tag/26.07.1
[26.07]: https://github.com/thwbh/librefit/releases/tag/26.07
[25.49.1]: https://github.com/thwbh/librefit/releases/tag/25.49.1
[25.49.0]: https://github.com/thwbh/librefit/releases/tag/25.49.0
