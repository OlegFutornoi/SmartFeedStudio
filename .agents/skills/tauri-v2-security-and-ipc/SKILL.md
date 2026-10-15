---
name: tauri-v2-security-and-ipc
description: Tauri v2 native desktop security. Governs capabilities and permission scoping, secure IPC commands, SQLCipher key derivation via OS Keychain, path traversal defense, and safe filesystem operations.
rules:
  - core
  - security
  - backend
---

# Tauri v2 Security and IPC

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/security.md`, and `.agents/rules/backend.md`.
2. Note all desktop security and IPC invariants in working notes (SEC-07, BE-02).
3. If modifying Tauri capabilities or permissions, call context7: `resolve-library-id {libraryName: "tauri", query: "..."}` and `query-docs`.
4. Do not modify IPC commands or configuration until steps 1-3 are complete.

## Security and IPC invariants

1. Least privilege capabilities: Configure explicit permissions in `src-tauri/capabilities/*.json`. Do not grant wildcard core defaults (`"core:default"`) across all windows. Restrict each command and plugin to authorized windows and webview origins.
2. OS Keychain for secrets: Never store SQLCipher encryption keys, passwords, or JWT refresh tokens in plaintext (avoid `localStorage`, config files, or unencrypted SQLite). Store and retrieve keys exclusively from the host OS Keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) using the `keyring` Rust crate.
3. Path traversal prevention (CWE-22): Any file or directory path received from the webview through IPC must be canonicalized and validated using `dunce::canonicalize()`. Block any path navigating outside the authorized workspace directory.
4. Command injection prevention (CWE-78): Never pass unvalidated user inputs or shell command strings to `std::process::Command`. Always pass separate arguments in discrete vector items with `shell: false`.
5. Strict IPC argument typing: Every Tauri command handler (`#[tauri::command]`) must accept strongly typed Rust structs implementing `serde::Deserialize`. Do not accept raw unvalidated strings or untyped JSON values.
6. Webview XSS mitigation: Keep CSP (Content Security Policy) enabled in `tauri.conf.json`. Restrict external script and stylesheet loading.
