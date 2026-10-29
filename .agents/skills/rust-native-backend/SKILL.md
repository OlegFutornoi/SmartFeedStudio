---
name: rust-native-backend
description: Native Rust backend engineering in Tauri v2 (apps/desktop/src-tauri). Governs SQLCipher encrypted SQLite (rusqlite), schema migrations, atomic transactions, thiserror error handling, IPC commands, and cargo clippy linting.
rules:
  - core
  - backend
  - security
---

# Rust Native Backend Engineering

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/backend.md`, and `.agents/rules/security.md`.
2. Note all native desktop and SQLite invariants in working notes (BE-02, SEC-07).
3. If using Tauri v2 or rusqlite APIs, call context7: `resolve-library-id {libraryName: "tauri", query: "..."}` and `query-docs`.
4. Do not write or edit Rust code until steps 1-3 are complete.

## Architecture and native boundaries

1. Native runtime separation: The Desktop Client (`apps/desktop`) operates with its own native SQLite database in Rust (`src-tauri/src/db.rs`). Product catalogs, feed parsing, local feed imports, and local counters are handled directly in Rust, not routed through NestJS.
2. Atomic database transactions: Wrap all multi-row operations (bulk product inserts, catalog imports, supplier deletions) in explicit `rusqlite::Transaction` blocks. Call `tx.commit()?` only after all statements succeed.
3. Zero unhandled panics: Never use `.unwrap()` or `.expect()` in production Tauri command handlers. Map all errors to structured enums using `thiserror` and serialize errors as strings across IPC.
4. Foreign key enforcement and cascading deletes: Always enable `PRAGMA foreign_keys = ON;` upon opening every SQLite connection. Deleting a supplier or feed must automatically cascade-delete products and local media to prevent orphan records.
5. Safe operating system execution: Never invoke system shells (`sh -c` or `cmd.exe /c`) with interpolated strings (CWE-78). Use `std::process::Command` with discrete arguments array without shell evaluation.
6. Lint verification: After editing Rust code in `apps/desktop/src-tauri`, run `cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings` and confirm zero warnings.
7. Incremental verification: Run `pnpm verify:rust` (or background watcher `pnpm watch:rust`) to verify compilation in <1.5s. Git commits touching Rust files trigger `node scripts/verify-rust.mjs` automatically via lint-staged.
