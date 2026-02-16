# Changelog

All notable changes to LibreFit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project uses [Calendar Versioning](https://calver.org/) (YY.WW.MICRO format).

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

[26.07.3] https://github.com/thwbh/librefit/releases/tag/26.07.3
[26.07.2]: https://github.com/thwbh/librefit/releases/tag/26.07.2
[26.07.1]: https://github.com/thwbh/librefit/releases/tag/26.07.1
[26.07]: https://github.com/thwbh/librefit/releases/tag/26.07
[25.49.1]: https://github.com/thwbh/librefit/releases/tag/25.49.1
[25.49.0]: https://github.com/thwbh/librefit/releases/tag/25.49.0
