---
name: git-commit
description: 'Execute git commit with conventional commit message analysis, intelligent staging, and message generation. Use when user asks to commit changes, create a git commit, or mentions "/commit".'
---

# Git Commit with Conventional Commits

Semantic git commits using the Conventional Commits specification.

---

## 1. Commit Format

```text
<type>(<scope>): <imperative description>

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat`: New feature or test capability
- `fix`: Bug fix, locator fix, or flakiness resolution
- `test`: Adding or updating test cases
- `refactor`: Code refactoring without behavior changes
- `chore`: Maintenance, config, dependency updates
- `docs`: Documentation or plan updates
- `perf`: Performance optimization

---

## 2. Standard Workflow

1. **Check Status & Diff:**

   ```bash
   git status --short
   git diff --staged || git diff
   ```

2. **Stage Targeted Files:**

   ```bash
   git add path/to/file1 path/to/file2
   ```

   _Never stage secrets (`.env`, credentials, private tokens)._

3. **Format Message:**
   - Present tense, imperative mood ("add", "fix", "refactor" - not "added", "fixes").
   - Description < 72 characters.
   - Example: `git commit -m "test(osago): add boundary tests for driver license validation"`

4. **Safety Invariants:**
   - Never run destructive commands (`--force`, `reset --hard`) without explicit user instruction.
   - Never skip hooks (`--no-verify`) unless explicitly asked.
   - If hooks fail: fix the underlying issue and stage the fix.
