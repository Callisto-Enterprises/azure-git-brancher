# Change Log

All notable changes to the "turbo-task-3000" extension will be documented in this file.

## [Unreleased]

## [1.0.0] - 2023-03-21

### Added

- Initial release

## [1.0.1] - 2023-03-21

### Added

- Added CHANGELOG.md
- Added Icon

## [1.0.2] - 2023-03-21

### Fixed

- Fixed issue where git command was not called in correct working directory

## [1.0.3] - 2023-06-07

### Changed

- Use Azure DevOps REST API to get work item title instead of Azure CLI

## [1.0.6] - 2025-05-31

- Removed dependency on `axios` :D
- Now creates work items and branches in the same command
- Automatically assigns the work item to the user based on `git config user.email`
