# CI/CD Workflows Reference

## Pull request quality gate workflow

```yaml
name: CI
on:
  pull_request:
    branches: [main, master, develop]
  push:
    branches: [main, master, develop]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm --filter @smartfeed/shared build
      - run: pnpm exec tsc --noEmit
      - run: pnpm build
```

## Desktop build workflow (Tauri v2)

- Matrix for macOS (ARM64/x86_64), Linux (AppImage/deb), and Windows (msi/exe).
- Rust cache via `swatinem/rust-cache@v2`.
- Signing keys and certificates injected via GitHub Secrets.
