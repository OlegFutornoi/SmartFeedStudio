# 🖥 Antigravity Agent Guide — Desktop Client (`apps/desktop`)

## 📌 Purpose

The **Desktop Client** is a high-performance native desktop application designed for heavy XML/CSV e-commerce product feed parsing, local image caching, OS Keychain security, and direct S3/MinIO cloud backup.

---

## 🛠 Tech Stack

- **Native Host Engine**: Tauri v2 (Rust 2021)
- **Frontend Framework**: React 18 + Vite (TypeScript)
- **Styling**: Tailwind CSS + Lucide Icons
- **Security & Storage**:
  - `keyring` crate: Native OS Keychain storage for JWT refresh tokens (macOS Keychain, Windows Credential Manager, Linux Secret Service).
  - `rusqlite` crate with `sqlcipher`: Local SQLite database encrypted with AES-256 for fast catalog caching.
- **Shared Types**: `@smartfeed/shared`

---

## 📂 Folder Structure

```text
apps/desktop/
├── src-tauri/                 # Rust Native Core
│   ├── src/
│   │   ├── main.rs            # Entry point for Tauri binary
│   │   └── lib.rs             # Tauri commands: store_refresh_token, get_refresh_token, etc.
│   ├── Cargo.toml             # Rust dependencies (tauri v2, keyring, rusqlite with sqlcipher)
│   └── tauri.conf.json        # Tauri v2 configuration (window size, permissions, dev URL)
├── src/                       # React / Vite Frontend
│   ├── services/
│   │   ├── keychain.ts        # OS Keychain invoke wrapper (falls back gracefully in browser dev)
│   │   ├── storage.ts         # Direct S3 Presigned URL uploader with progress tracking
│   │   └── sqlite.ts          # Local SQLite / cache database interface
│   ├── App.tsx                # Main desktop interface (XML Catalog, Direct S3, Cache, Keychain)
│   ├── main.tsx               # React DOM root entry
│   ├── index.css              # Dark desktop UI styles
│   └── vite-env.d.ts          # Vite client types
├── vite.config.ts             # Vite config (Port 1420)
├── tsconfig.json              # TypeScript configuration
└── package.json
```

---

## 🔒 Security & S3 Upload Workflow

1. **OS Keychain Token Storage (`src/services/keychain.ts`)**:
   - Access tokens (15m expiry) live in memory.
   - Refresh tokens (7d expiry) are securely saved into the OS Keychain via Tauri's `store_refresh_token` Rust command.

2. **Direct S3 Upload (`src/services/storage.ts`)**:
   - Client sends `POST /api/storage/presigned-url` to NestJS Backend API.
   - NestJS CQRS `GeneratePresignedUploadUrlHandler` generates an S3 PUT URL.
   - Desktop client uploads the file directly to MinIO / Cloudflare R2 via HTTP PUT with progress updates, bypassing the API server for binary transfer.

3. **Offline Catalog Caching (`src/services/sqlite.ts`)**:
   - Stores catalog products locally in encrypted SQLite for instantaneous search and offline editing.

---

## ⚡ Development & Build Commands

```bash
# Run Vite dev server in browser (Port 1420)
pnpm dev:desktop

# Run native Tauri v2 desktop application in dev mode (requires Rust)
pnpm --filter @smartfeed/desktop tauri:dev

# Build Vite web assets
pnpm build:desktop

# Build final native executable / installer (.dmg, .app, .msi, .exe)
pnpm --filter @smartfeed/desktop tauri:build
```
