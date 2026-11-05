# Production verification

## Release state

Release work is in progress. This document will be updated from actual deployment and CI receipts; project creation alone is not deployment verification.

## Confirmed resources

- GitHub repository: https://github.com/pranav-pokkula/TraceEval (public, account `pranav-pokkula`).
- Supabase organization: **TraceEval**, ID `btlsovfmukmukguofcny`.
- Supabase project: **blocked**. Management API rejected creation with the account's two-active-free-project limit. Receipt: `artifacts/production/supabase-provisioning.json`. The user chose to leave it blocked; no existing project was paused/deleted, and no billing was enabled.
- Vercel project: **traceeval**, ID `prj_ZcAfvvGVo2LYNlMsd7RvgYWcHKhU`.
- Vercel team: **Pranav Pokkula's projects**, `pranav-pokkulas-projects`, ID `team_hyDyuYXt4tQ5Ui1y2SkdmeYs`. Existing authorized Hobby scope; no new paid team was created.
- Node runtime: **22.x**. Public production access enabled for the requested demo. Live inference explicitly disabled.

## Reproduced local verification

Receipt: `artifacts/receipts/2026-11-05T23-18-10-684Z/summary.json`.

- 61 Vitest unit/API/authentication-boundary tests passed.
- Five Chromium browser workflows passed, including a 390-pixel mobile viewport.
- Dataset regeneration consistency, TypeScript, and production build passed.
- Both fixture adapters actually executed all 500 targets (1,000 executions on 500 shared synthetic targets).
- Faithful fixture: 500/500 deterministic passes; injected-fault fixture: 100/500. These are validator demonstration outcomes, not model accuracy.
- Both SQL migrations and RLS constraints passed on disposable PostgreSQL 17. Receipt: `artifacts/receipts/rls-2026-11-05T23-23-26-525Z.log`.

The SQL test uses a minimal Supabase auth contract. It verifies owner access, cross-user isolation, forged-owner rejection, review membership, anonymous denial, and live quota enforcement. It does not verify hosted Supabase Auth/PostgREST. The temporary container/VM was stopped after testing.

## Required hosted checks

CI commit/run URL, Vercel deployment/commit/URL, live browser results, screenshots, and final status are added after they actually execute. Hosted Supabase login, private persistence, cross-session reload, and two-user hosted isolation cannot run until the free-project capacity blocker is resolved. Live paid model inference remains intentionally disabled and unverified.
