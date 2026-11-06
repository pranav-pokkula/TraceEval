# Production verification

## Release state

**DEPLOYED WITH LIMITATIONS.** The public fixture application is live and browser-verified at **https://traceeval.vercel.app**. Hosted Supabase persistence is blocked by the account's free-project capacity and was explicitly deferred by the user. Live paid inference remains disabled.

Verified application commit: `e59d3c6fda8e81eeca372eb0dd0894068948b16d`, branch `main`. This report and its receipts are published in a subsequent documentation-only commit, which Vercel deploys automatically. The final handoff records that commit's actual CI/deployment identifiers rather than embedding a self-referential Git hash.

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

## Actual CI and production verification

- GitHub Actions: [run 42129996388](https://github.com/pranav-pokkula/TraceEval/actions/runs/42129996388), **success**. Both `fixture-and-browser` and `postgres-rls` jobs completed successfully on the verified application commit. Actual logs and metadata are `artifacts/production/ci-42129996388.log` and `.json`.
- Vercel production deployment: `dpl_6oFiQTWY92R9P3nvjaAunKZQTJMH`, **READY**, exact application commit confirmed by deployment metadata. Build log reports completion in 25 seconds; this is one deployment observation, not a performance benchmark.
- Production URL: https://traceeval.vercel.app. The repository is connected to this project; subsequent `main` pushes deploy automatically through Vercel Git integration.
- Five real Chromium browser workflows passed against the production URL. Receipt: `artifacts/production/browser-first.log`. Tracing was disabled for remote execution.
- Production executed a faithful 500-case fixture, perturbed 500-case fixture, and 10-case fixture: **1,010 fixture case executions on shared synthetic targets**. No real model or paid endpoint was called.
- Runtime error/fatal query returned no groups for the tested deployment during the queried 30-minute window. This is a bounded log observation, not a security or reliability certification.

| Production behavior | Result |
| --- | --- |
| Homepage/dashboard | Passed |
| Dataset/evidence search and target inspection | Passed |
| 10-case and 500-case fixture execution | Passed; no server evaluation API needed |
| Trace inspection | Passed |
| Human review and refresh | Passed for browser-local demo storage |
| JSON export | Parsed as valid JSON, 500 results and saved review checked |
| Paired run comparison | Passed |
| Methodology | Passed |
| Mobile navigation and modal | Passed at 390px; no horizontal overflow |
| Protected run/review/evaluation/delete APIs | Anonymous requests denied |
| Disabled live mode | Explicit 503; no silent fixture fallback |
| Hosted account persistence/two-user isolation | Blocked; not run |

Screenshots are actual production browser captures under `artifacts/production/screenshots/`: desktop dashboard, mobile dashboard, trace inspector, comparison, and methodology. Desktop/mobile images were visually inspected. The single review created by the browser test is scripted test input, not an independent human evaluation study.

## Outstanding limitations

Hosted Supabase login, private persistence, cross-session reload, and two-user hosted isolation cannot run until a dedicated project can be provisioned. No legitimate data or existing project was modified to bypass the account limit. Public demo data stays in each browser and is not backed up. Reviews are subjective and mutable. The current implementation does not provide an automated model grader, signed benchmark attestations, load/concurrency certification, or cross-browser coverage beyond Chromium. GitHub CI and Vercel Git deployments run independently; branch protection/deployment checks should be configured if a formal release gate is required.
