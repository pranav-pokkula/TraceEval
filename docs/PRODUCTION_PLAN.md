# TraceEval production implementation plan

## Audited starting point — November 5, 2026

The existing source and historical receipts are present. There is no Git repository or remote in this checkout. The previous final receipt records 45 Vitest tests, four Chromium tests, a build/typecheck, two 500-case fixture evaluations, and separate disposable PostgreSQL RLS checks. These are local historical results, not hosted verification.

The application has all core evaluation screens, but its global storage switch prevents an anonymous demo and authenticated database workspace from operating together. Authentication is browser-token based and server requests verify tokens using Supabase `getUser`. The first migration applies owner RLS and live quotas. Public fixture requests currently consume server execution; saved runs lack a general storage quota. Error/loading transitions and live endpoint restrictions need production review.

## Execution sequence

1. Confirm existing GitHub, Vercel, and Supabase access without printing credentials. Inspect conflicts; create only dedicated TraceEval resources on approved free plans. Document actual organization/access/billing limitations.
2. Preserve the current evaluator/dataset/UI. Run public fixtures in the browser, with a separate authenticated mode for user-owned Postgres runs/reviews. Keep paid inference disabled. Harden state transitions, protected APIs, live endpoint restrictions, database constraints, and storage limits.
3. Add regression and hosted verification tooling. Retain old receipts. Rerun reproducibility, unit/API tests, build/typecheck, 500-case fixtures, browser desktop/mobile workflows, and database isolation.
4. Initialize Git, review the publishable file set for secrets/private data, create the dedicated GitHub repository, push main, and inspect actual Actions runs. Fix failing CI with ordinary commits.
5. Provision a dedicated free Supabase organization/project if accessible; apply forward migrations, disable public signup, and test with disposable identities. Configure the dedicated Vercel project securely, connect Git, and deploy production without paid model keys.
6. Verify the exact deployed commit and live URL using browsers and API checks. Exercise public 10/500-case runs, inspector, review, export, comparison, methodology, mobile, denied anonymous private APIs, and hosted authenticated persistence/isolation when credentials are available. Clean up only verification-created data.
7. Update architecture, deployment, evaluation, release checklist, production verification, and machine-readable receipts. Report only verified external resource IDs/URLs/status. Any access or billing blocker remains explicit.

## Cost and credential boundaries

No paid upgrades, domains, or inference calls. Prefer the existing Vercel Hobby account if a new free team is unavailable. Never print tokens, passwords, connection strings, or environment-secret values. User action is needed only if a connection/login, permission, or missing credential prevents an external step; independent implementation and release work continues.
