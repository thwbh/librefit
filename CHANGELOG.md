# Changelog

All notable changes to LibreFit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project uses [Calendar Versioning](https://calver.org/) (YY.WW.MICRO format).

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

[25.49.1]: https://github.com/thwbh/librefit/releases/tag/25.49.1
[25.49.0]: https://github.com/thwbh/librefit/releases/tag/25.49.0
