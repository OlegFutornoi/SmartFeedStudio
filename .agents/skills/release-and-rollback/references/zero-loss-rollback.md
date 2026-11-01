# Zero-Loss Rollback Strategy

## 1. Core Doctrine: Database Never Rolled Back via Destructive Scripts

In production incidents, never run `DROP COLUMN` or destructive rollback scripts because users may have already written live records during the new release window.

- Follow Expand/Contract migration discipline:
  - All new columns are added as NULLABLE or with sensible defaults.
  - Previous code version continues functioning with the updated table schema.
  - Rolling back application code (Docker image / Railway deployment) restores stable behavior without data loss.

## 2. Railway Deployment Rollback

Using Railway CLI or MCP tool:

```bash
# 1. Inspect service deployment history
railway deployment list

# 2. Rollback to preceding stable deployment
railway rollback <previous-deployment-id>
```

## 3. Incident Triage Workflow

1. Impact assessment:
   - Does incident affect financial data, licenses, or catalog integrity?
   - If YES: immediate ROLLBACK of code to preceding version tag. Database remains intact (Expand/Contract compatibility).
   - If NO (minor cosmetic UI bug): deploy fast hotfix forward without rollback.
2. Team notification and incident capture in Sentry and structured logs.
3. Root cause isolation in local environment via `systematic-debugging`.
4. Codify missing regression test to prevent defect re-emergence.

## 4. BullMQ Queue Backward Compatibility During Rollback

- All new job payload fields must be optional.
- If an older worker version processes a job with new payload fields, it must safely ignore unrecognized properties.
- Guarantees zero dropped or corrupted jobs during rapid version switches.
