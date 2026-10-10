# SQLCipher Encryption & OS Keychain Key Management

## 1. Архітектура захисту локальних даних SQLCipher

Каталог товарів, ціни постачальників та історія змін у десктопному додатку шифруються за алгоритмом AES-256 через SQLCipher.
Майстер-ключ шифрування ніколи не хардкодиться в бінарнику і не зберігається на диску без шифрування.

## 2. Патерн збереження ключів через `keyring-rs`

Крейт `keyring` звертається безпосередньо до захищеного сховища поточної ОС:

- macOS: **Apple Keychain** (Secure Enclave / APFS шифрування)
- Windows: **Windows Credential Manager**
- Linux: **Secret Service API / libsecret**

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
            // Ключ ще не створено — генеруємо криптографічно стійкий 256-бітний ключ
            let mut key_bytes = [0u8; 32];
            rand::rngs::OsRng.fill_bytes(&mut key_bytes);
            let hex_key = hex::encode(key_bytes);

            entry.set_password(&hex_key).map_err(|e| e.to_string())?;
            Ok(hex_key)
        }
    }
}
```

## 3. Відкриття зашифрованої бази через `rusqlite` + SQLCipher

```rust
use rusqlite::{Connection, OpenFlags};

pub fn open_encrypted_database(db_path: &std::path::Path) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open_with_flags(
        db_path,
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE,
    )?;

    let master_key = get_or_create_db_key().expect("Не вдалося отримати ключ шифрування з Keychain");

    // Негайне застосування ключа до першого читання чи запису
    conn.pragma_update(None, "key", &master_key)?;

    // Перевірка коректності розшифрування (кине помилку, якщо ключ невірний або файл пошкоджено)
    conn.query_row("SELECT count(*) FROM sqlite_master;", [], |_| Ok(()))?;

    Ok(conn)
}
```

## 4. Зберігання JWT Refresh Token

Токен оновлення сесії для доступу до хмарного бекенду зберігається в окремому записі Keychain:

```rust
pub fn store_refresh_token(token: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, "user_refresh_token").map_err(|e| e.to_string())?;
    entry.set_password(token).map_err(|e| e.to_string())
}
```

Ніколи не повертайте refresh-токен назад у відкритий `localStorage` браузера.
