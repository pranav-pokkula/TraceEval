# Release checklist

## Production revision

- [x] Public browser-only fixture demo is separate from account-owned history.
- [x] All server run/review/evaluation/delete APIs require verified authentication.
- [x] Safe forward migration adds payload bounds, 50-run owner limit, and review case membership.
- [x] Reproduced 61 Vitest tests and five browser workflows; build, typecheck, and seeded artifacts passed.
- [x] Reproduced PostgreSQL isolation checks with both migrations.
- [x] Dedicated public GitHub repository and dedicated Vercel project created.
- [x] Dedicated Supabase organization created.
- [ ] Supabase project provisioned — blocked by the account's two-active-free-project limit; user elected to leave blocked.
- [ ] Hosted Supabase authentication/persistence/isolation verified — unavailable until a dedicated project exists.
- [ ] GitHub Actions and production Vercel browser results confirmed — see the production verification report for current evidence.

Historical implementation and local verification checklist follows. Hosted gates are not marked complete merely because code exists.

This checklist distinguishes implementation, local verification, and deployment work. Checked items refer to work actually completed; unchecked items are not implied by provided code.

## Implemented

- [x] Next.js App Router, TypeScript, Tailwind, Zod, fixed AJV JSON Schema validation.
- [x] Dataset/evidence browsing, run creation/history/details, comparison, JSON export, human review, methodology, settings.
- [x] Reproducible generator with 500 synthetic target cases and 300 explicitly fictional documents.
- [x] Faithful and perturbed fixtures; live model adapter server-only and disabled by default.
- [x] Owner-scoped Supabase migrations and database-backed live quotas.
- [x] `.env.example` contains no real credentials.
- [x] Unit/integration/browser/SQL tests and GitHub Actions configuration.
- [x] README, deployment guide, evaluation record, and this checklist.

## Local verification

- [x] Reproducibility check of generated dataset artifacts.
- [x] 45 Vitest unit/integration tests executed successfully.
- [x] Production Next.js build executed successfully.
- [x] TypeScript check executed successfully.
- [x] Both full 500-case fixture evaluations executed; full outputs retained.
- [x] Initial failed browser receipts preserved with two selector failures.
- [x] Final complete receipt: `artifacts/receipts/2026-11-05T17-58-15-155Z/summary.json`; all commands exit 0, including 4 Chromium tests.
- [x] Desktop and mobile screenshots captured and visually inspected.
- [x] Migration and RLS test executed successfully on disposable PostgreSQL 17; receipt `artifacts/receipts/rls-2026-11-05T17-59-10-945Z.log`.

The PostgreSQL test uses a minimal Supabase auth contract. It does not certify the hosted Supabase Auth/PostgREST path. The temporary container was stopped after the rollback; the isolated `traceeval-test` Colima profile is retained in a stopped state for reuse.

## Before a hosted fixture release

- [ ] Commit reviewed source and lockfile to the intended repository.
- [ ] Run both GitHub Actions jobs on that commit; retain actual artifacts.
- [ ] Verify Vercel team, project, environment, and deployed commit.
- [ ] Configure Node 22.x, default Next.js build settings, and fixture environment.
- [ ] Smoke-test the hosted dashboard, run/inspection/review/export/reload flow, and mobile layout.
- [ ] Record actual deployment URL and status. No deployment URL exists from local verification alone.

## Before enabling Supabase or live inference

- [ ] Provision an isolated Supabase project and apply the migration once.
- [ ] Configure public Supabase URL/key privately and rebuild.
- [ ] Verify login, persistence, sign-out, and cross-user isolation against the hosted project.
- [ ] Keep public signup disabled; provision approved users.
- [ ] Configure server-only model endpoint/key/name privately; never print secrets.
- [ ] Verify provider request compatibility, timeout/error handling, persisted live run, and quota denial.
- [ ] Review factual support manually; label judgments and actual reviewed sample count.
- [ ] Set provider spending limits and database backup/retention policies.
- [ ] Confirm rollback procedure with the intended deployment owner.

No external credentials are needed for the verified fixture path. Stop at any optional integration step requiring missing credentials; do not invent them or publish an untested integration as verified.
