# Tauri v2 Capabilities & Permission Scoping Architecture

## 1. Capabilities Architecture in Tauri v2

Tauri v2 replaces global allowlists with modular capabilities files located in `apps/desktop/src-tauri/capabilities/`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Scoped permissions for SmartFeed Studio desktop application window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:path:default",
    "core:event:default",
    {
      "identifier": "fs:allow-read",
      "allow": [{ "path": "$APPDATA/feeds/**" }, { "path": "$DOWNLOAD/**" }]
    },
    {
      "identifier": "fs:allow-write",
      "allow": [{ "path": "$APPDATA/feeds/**" }]
    }
  ]
}
```

## 2. External Domain IPC Isolation

When rendering external content or HTML descriptions:

- Prohibited: Granting full capabilities to untrusted remote URLs.
- Mandatory: Configure strict Content Security Policy (CSP) in `tauri.conf.json`:

```json
"app": {
  "security": {
    "csp": "default-src 'self'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' http://localhost:4000 https://api.smartfeed.studio;"
  }
}
```

## 3. Pre-Release Capabilities Security Checklist

- Verify absence of permissive `fs:allow-all` or `fs:scope` permissions targeting filesystem roots (`/` or `C:\`).
- Ensure filesystem scopes are restricted to `$APPDATA` and dedicated feed directories.
- Restrict dialog plugin permissions (`dialog:default`) strictly to explicit file picker flows.
- Verify that `dangerousRemoteUrlValidation` is absent or set to `false`.
