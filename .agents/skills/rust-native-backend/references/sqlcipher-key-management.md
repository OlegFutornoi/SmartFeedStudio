# SQLCipher Encryption & OS Keychain Key Management

## 1. Local Data Protection Architecture

Catalog items, supplier pricing, and change logs in the desktop application are encrypted with AES-256 via SQLCipher.
The master encryption key is never hardcoded in the application binary or stored unencrypted on disk.

## 2. Key Management Pattern via `keyring-rs`

The `keyring` crate delegates directly to the host operating system secure enclave:

- macOS: Apple Keychain (Secure Enclave / APFS encrypted storage)
- Windows: Windows Credential Manager
- Linux: Secret Service API / libsecret

```rust
use keyring::Entry;
use rand::RngCore;

const SERVICE_NAME: &str = "studio.smartfeed.desktop";
const KEY_NAME: &str = "sqlcipher_master_key";

pub fn get_or_create_db_key() -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, KEY_NAME).map_err(|e| e.to_string())?;

    match entry.get_password() {
        Ok(key) => Ok(key),
        Err(_) => {
            // Generate cryptographically secure 256-bit random key
            let mut key_bytes = [0u8; 32];
            rand::rngs::OsRng.fill_bytes(&mut key_bytes);
            let hex_key = hex::encode(key_bytes);

            entry.set_password(&hex_key).map_err(|e| e.to_string())?;
            Ok(hex_key)
        }
    }
}
```

## 3. Opening Encrypted Database via `rusqlite` and SQLCipher

```rust
use rusqlite::{Connection, OpenFlags};

pub fn open_encrypted_database(db_path: &std::path::Path) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open_with_flags(
        db_path,
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE,
    )?;

    let master_key = get_or_create_db_key().map_err(|e| {
        rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_AUTH),
            Some(e),
        )
    })?;

    // Apply encryption key before executing queries
    conn.pragma_update(None, "key", &master_key)?;

    // Validate key correctness
    conn.query_row("SELECT count(*) FROM sqlite_master;", [], |_| Ok(()))?;

    Ok(conn)
}
```

## 4. JWT Refresh Token Storage

Session refresh tokens used for cloud API access persist in a distinct Keychain record:

```rust
pub fn store_refresh_token(token: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, "user_refresh_token").map_err(|e| e.to_string())?;
    entry.set_password(token).map_err(|e| e.to_string())
}
```

Never store refresh tokens in browser `localStorage`.
