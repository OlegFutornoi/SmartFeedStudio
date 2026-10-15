# Turborepo Recipes and Configuration Patterns

## Package tasks vs root tasks

- Put scripts in package.json files within individual apps and packages.
- Root package.json delegates via `turbo run <task>`.
- Use root tasks (`//#taskname`) only for cross-package global tooling that cannot run in isolated packages.

## Pipeline task dependencies

- Use `"dependsOn": ["^build"]` to ensure upstream packages build before dependents.
- Specify `"outputs": ["dist/**", ".next/**"]` to enable output caching.
- Use `"cache": false` for dev watchers and interactive tasks.

## Filtering and affected runs

- Run tasks for a single package: `pnpm exec turbo run build --filter=@smartfeed/backend-api`
- Run tasks for modified packages: `pnpm exec turbo run test --filter=...[origin/main]`
- Run tasks for package and its dependencies: `pnpm exec turbo run build --filter=@smartfeed/desktop...`

## Environment variables in turbo.json

- Declare runtime env vars in `globalEnv` or per-task `env` arrays:
  ```json
  {
    "globalEnv": ["NODE_ENV"],
    "tasks": {
      "build": {
        "env": ["DATABASE_URL", "JWT_SECRET", "NEXT_PUBLIC_API_URL"]
      }
    }
  }
  ```
