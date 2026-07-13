# Rollback Guide

## Vercel Deployment Rollback

### Instant rollback via Vercel Dashboard

Vercel keeps every deployment and allows instant rollback to any previous one:

1. Open [Vercel Dashboard](https://vercel.com) > your project
2. Go to **Deployments**
3. Find the last known-good deployment (green status, before the problematic one)
4. Click the `...` menu > **Promote to Production**
5. Confirm

This switches the production URL to the previous deployment within seconds. No rebuild needed.

### Instant rollback via Vercel CLI

```bash
npx vercel rollback
```

This promotes the previous deployment to production. Run from the project root.

### Important notes

- Rollback is **instant** — it switches which build is served, it does not rebuild
- The rolled-back deployment's build artifacts are still available in Vercel's CDN
- Rollback does **not** affect the database or Redis

## Database Rollback

### Neon Point-in-Time Recovery

If using Neon PostgreSQL, use the built-in branching and restore features:

1. Open the Neon Dashboard at [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Go to **Branches**
4. Create a new branch from a point in time before the problematic migration
5. Update `DATABASE_URL` in Vercel to point to the new branch
6. Redeploy

### Prisma Migration Rollback

Prisma does not support automatic migration rollback. Manual steps:

1. Identify the problematic migration in `web/prisma/migrations/`
2. Write the inverse SQL manually (e.g., `DROP INDEX`, `ALTER TABLE DROP COLUMN`)
3. Execute against the production database via Neon SQL Editor or `psql`
4. Delete or mark the migration as rolled back in the `_prisma_migrations` table:
   ```sql
   DELETE FROM _prisma_migrations WHERE migration_name = '<timestamp_name>';
   ```
5. Update `DATABASE_URL` in Vercel if needed

### When schema rollback is needed

Schema rollback is required only when:
- A migration introduced a column/table that breaks existing queries
- A migration changed a constraint that causes data integrity issues

Most code-only deployments (no schema changes) do not need database rollback.

## Full Recovery Procedure

### Scenario: Bad deployment with no schema changes

1. Rollback Vercel deployment via Dashboard or CLI
2. Verify the site works on the previous deployment
3. Fix the issue in a branch, test locally, then push to `main`

### Scenario: Bad deployment with schema changes

1. **Immediately** rollback the Vercel deployment to the previous build
2. Assess whether the old code is compatible with the new schema:
   - If the migration only **added** columns/tables/indexes → old code likely works fine
   - If the migration **dropped or renamed** columns → old code will break
3. If old code is incompatible:
   a. Create a Neon branch from before the migration
   b. Update `DATABASE_URL` in Vercel to the new branch
   c. Redeploy the old build
4. Fix the issue in a branch with a corrective migration
5. Test locally, then push to `main`

### Scenario: Database data corruption

1. Create a Neon branch from a point in time before the corruption
2. Verify the branch data is correct
3. Update `DATABASE_URL` in Vercel to the new branch
4. Redeploy

### Scenario: Rate limiter / Redis issue

1. If Redis is causing login failures, remove `KV_REST_API_URL` and `KV_REST_API_TOKEN` from Vercel environment variables
2. The rate limiter will fall back to in-memory mode
3. Redeploy — login will work immediately (rate limiting will be per-instance only)
4. Fix the Redis issue and re-add the environment variables

## Key Contacts and Resources

| Resource | URL |
|---|---|
| Vercel Dashboard | https://vercel.com |
| Neon Dashboard | https://console.neon.tech |
| Upstash Dashboard | https://console.upstash.com |
| GitHub Repository | https://github.com/azkafarhanm/tahfidz-tracker |
