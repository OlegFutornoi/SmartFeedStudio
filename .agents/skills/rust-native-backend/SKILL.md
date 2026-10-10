---
name: rust-native-backend
description: Native Rust backend engineering in Tauri v2 (apps/desktop/src-tauri). Governs SQLCipher encrypted SQLite (rusqlite), database migrations, transactions, thiserror error handling, IPC commands, and cargo clippy linting. Use when creating or modifying Rust commands, SQLite schemas, catalog queries, or Keychain storage in the desktop client.
---

# 🦀 Rust Native Backend Engineering (Tauri v2 + SQLCipher)

## 📌 Architecture & Responsibilities

The Desktop Client (`apps/desktop`) operates with its **own native SQLite backend** written in Rust:

- **`src-tauri/src/db.rs`**: Encrypted SQLCipher database connection, schema migrations, and queries.
- **`src-tauri/src/models.rs`**: Rust domain structs with `serde::Serialize` and `serde::Deserialize`.
- **`src-tauri/src/lib.rs`**: Tauri command handlers exposed to React via IPC `invoke()`.
- **`src-tauri/src/workspace.rs`**: Local catalog workspace filesystem management.

---

## 🔒 Iron Rules for Native Rust Code

### 1. Atomic Database Transactions

All multi-record operations (bulk product inserts, catalog deletion with cascades, feed sync) **MUST** execute within an explicit `rusqlite::Transaction`:

```rust
let mut conn = pool.get()?;
let tx = conn.transaction()?;
// Execute bulk statements...
tx.commit()?;
```

### 2. Zero Unhandled Panics (`unwrap()` / `expect()`)

Never use `unwrap()` or `expect()` in production Tauri commands. Every error must map to a structured error enum using `thiserror`:

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("Keychain error: {0}")]
    Keychain(#[from] keyring::Error),
    #[error("Not found: {0}")]
    NotFound(String),
}

// Convert into string for Tauri command boundary:
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

### 3. Cascading Deletions in SQLite

Foreign keys must have `PRAGMA foreign_keys = ON;` enabled on every connection. Deleting a supplier or feed **MUST** automatically cascade-delete products and local media to prevent orphan records.

### 4. Zero Command Injection (Safe OS Calls)

Never invoke `std::process::Command::new("sh")` with string interpolation. Use discrete argument vectors without shell evaluation:

```rust
Command::new("open")
    .arg(&path)
    .spawn()?;
```

---

## 🧪 Verification Protocol

After modifying any Rust files in `apps/desktop/src-tauri`:

```bash
# 1. Verify Rust compiles and passes clippy
pnpm verify:rust

# 2. Or direct cargo check inside src-tauri
cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings
```

---

## ✅ Pre-Completion Checklist

- [ ] Zero `unwrap()` calls on user-supplied inputs or database queries
- [ ] Multi-row updates are wrapped in `tx.commit()?` transactions
- [ ] TypeScript IPC types in `apps/desktop/src/types` match Rust serde structs
- [ ] `pnpm verify:rust` passes with 0 warnings/errors
