# SemVer and Changelog Specification

## 1. Semantic Versioning Rules (SemVer 2.0.0)

Format: `MAJOR.MINOR.PATCH` (e.g. `1.4.2`):

- MAJOR (X.0.0): Incompatible API changes, breaking DTO changes, auth contract updates (`feat!: ...` or `BREAKING CHANGE:`).
- MINOR (0.X.0): Backwards-compatible new features, new export endpoints, new UI modals (`feat: ...`).
- PATCH (0.0.X): Bug fixes, non-breaking refactorings, CSS tuning (`fix: ...`, `perf: ...`, `refactor: ...`).

## 2. CHANGELOG.md Format (Keep a Changelog)

Each release appends a section to root `CHANGELOG.md`:

```markdown
## [1.5.0] - 2026-10-04

### Added

- Streaming SAX XML import for up to 100k SKU catalogs without RAM blockage.
- Accessibility audit integration with axe-core.

### Fixed

- Eliminated duplicate API requests using useRef request deduplication.
- Enforced 100% solid sticky header backgrounds for data tables.

### Security

- Secure token persistence using native OS Keychain in Tauri v2 desktop client.
```

## 3. Monorepo Version Synchronization

Upon release, versions synchronize across:

- `package.json` (repository root)
- `packages/shared/package.json`
- `services/backend-api/package.json`
- `apps/desktop/package.json` and `apps/desktop/src-tauri/tauri.conf.json` (`version`)
- `apps/admin-portal/package.json`
