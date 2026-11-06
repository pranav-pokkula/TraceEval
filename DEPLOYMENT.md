# Deploy TraceEval

Current release state and provider identifiers are in [docs/PRODUCTION_VERIFICATION.md](docs/PRODUCTION_VERIFICATION.md). Supabase organization `TraceEval` exists, but the account's free-project limit blocks its database. The user chose to leave that integration blocked. Never pause another project or enable billing without separate authorization.

## Vercel: fixture mode

1. Put this project in a Git repository and import it into the intended Vercel team/project.
2. Choose the **Next.js** preset, repository root, Node.js **22.x**, install command `npm ci`, and build command `npm run build`. Keep the default Next.js output directory.
3. Set `TRACEEVAL_STORAGE=local` and `TRACEEVAL_LIVE_ENABLED=false` (both are also safe runtime defaults). No model or database credentials are needed.
4. Deploy a preview. Open the dashboard, run 10 fixture cases, inspect one, export JSON, reload, and compare a second run. Check `/methodology` and the mobile layout.
5. Require both GitHub verification jobs before release and retain their artifacts. Promote the tested deployment using your normal Vercel review process.

`vercel.json` sets the evaluation function maximum duration to 60 seconds. The application uses Node.js runtime; there is no static export or local filesystem persistence in server routes. Database/provider configuration is read on the server; `NEXT_PUBLIC_*` variables are bundled at build time, so changes to public Supabase configuration require a rebuild.

The release process creates a dedicated Vercel project and connects the repository. Refer to the production verification report for actual deployment status, rather than assuming it from these instructions. No Vercel credentials are required to run/build locally. Verify the intended team, project, commit, and environment before publishing. See [Vercel deployments](https://vercel.com/docs/deployments) and [Git integration](https://vercel.com/docs/git).

## Supabase/Postgres persistence

1. Create a dedicated Supabase project. Use a separate project for previews/tests.
2. Review and apply both migrations in filename order: `202611050001_traceeval.sql`, then `202611050002_production_constraints.sql`. Use the Supabase SQL editor or a migration runner, once each. The first creates tables, RLS, indexes, and live quotas; the second enforces payload size/shape, a 50-run owner storage limit, and review case membership. Do not rewrite already-applied migrations.
3. Set these variables privately in the Vercel environment settings (or a local ignored `.env.local`):

   ```dotenv
   TRACEEVAL_STORAGE=supabase
   NEXT_PUBLIC_SUPABASE_URL=<project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable or legacy anon key>
   TRACEEVAL_LIVE_ENABLED=false
   ```

4. Enable Supabase email/password auth. Provision an approved user in Supabase Auth and set their password through your secure onboarding process. Keep public signup disabled if live inference will be enabled. The app provides sign-in/sign-out, not public signup or password recovery UI; manage recovery through Supabase.
5. Rebuild/deploy, open **Settings**, sign in, and run a fixture. Reload and confirm the stored run/review. Sign in as a second user and confirm the first user's data is invisible.
6. Inspect database RLS, grants, and the function before enabling live inference. The application uses the caller's verified access token and public key, never a service-role key. The user's identity comes from `auth.getUser`, not a client-submitted owner ID.

RLS ownership is enforced by `(select auth.uid()) = owner_id`; reviews also have a composite foreign key to `(run_id, owner_id)`. Anonymous table access is revoked. Quota rows have no client grants/policies, and only a scoped security-definer function can reserve quota. [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) explains the model.

Authenticated owners can manage their own records through granted interfaces; this is not a signed audit ledger. Storage is limited to 50 runs per owner; export and delete old runs using the detail page. The UI loads reviews for those runs, with an application cap of 5,000 and any tighter PostgREST response limit configured by the host. Review counts describe loaded records, not an independent human study. Use your organization's backup/retention policy; no background pruning job is included. Consider deleting expired quota rows through an administrator job as usage grows.

## Optional live adapter

Live inference requires Supabase mode, a signed-in user, and all four server variables below. Configure these in the host's secret UI, never in `NEXT_PUBLIC_*`, Git, CLI arguments, or chat.

```dotenv
TRACEEVAL_LIVE_ENABLED=true
MODEL_API_URL=https://your-provider.example/v1/chat/completions
MODEL_API_KEY=<private server-side credential>
MODEL_NAME=<explicit supported model identifier>
MODEL_ALLOWED_HOSTS=your-provider.example
```

The adapter implements an OpenAI-compatible Chat Completions request: `messages`, `temperature: 0`, `max_tokens: 1200`, and `response_format: { type: "json_object" }`. Use a provider/model that supports those fields. Some reasoning models and providers require a different contract; adapt and test `lib/live.server.ts` before enabling them. This endpoint contract is optional and has been tested with mocks, not a paid provider.

The endpoint must use HTTPS without URL credentials/query parameters. Redirects are rejected. It is deployment-configured, never user-supplied. For each case the server sends the question, 3 fictional evidence documents, and the output schema. It does not send the target answer or human review. Responses are capped at 64 KiB transport size and 32,000 characters of model content, with a 4-second timeout and no retry. Slow providers may yield partial runs. Adjust limits, function duration, and tests together if needed.

Limits are atomically reserved before execution: at most 10 cases/run, 10 cases/minute/user, 100 cases/rolling 24 hours/user. Failed provider calls or failed database saves do not refund quota. Reservations bound case counts, not currency; set spending limits at the provider and restrict account provisioning. No billing integration is included. Provider error bodies and credentials are never returned to clients or logged by app code.

After configuration, run a 10-case live smoke test, verify provenance/model identity and timeout handling, check persisted results, then review actual factual support. Do not substitute fixture scores for this check. **Stop at this step if needed credentials or the intended provider are unavailable.** Keep live mode disabled until they are supplied privately.

## Database tests

`npm run test:rls` requires `TRACEEVAL_TEST_DATABASE_URL` in the process environment, pointing at an isolated test database. Never point it at production. It creates test users/rows in a transaction and rolls back; it needs a test administrator connection.

- On an already migrated test Supabase database: leave `TRACEEVAL_TEST_BOOTSTRAP` unset.
- On a fresh, disposable PostgreSQL 17 database: set `TRACEEVAL_TEST_BOOTSTRAP=true`. The script creates temporary auth roles/schema/helper and applies the migration inside the rollback transaction. This verifies real PostgreSQL RLS against a minimal Supabase auth contract; it does not test hosted Supabase Auth/GoTrue.
- The GitHub `postgres-rls` job provisions the disposable database automatically. Its fixed database password is non-production test data, not a credential for any hosted system.

The script prints only assertion outcomes and safe error codes; it never prints the database URL. No database secrets are needed by the fixture/browser CI job.

## Rollback and troubleshooting

To repeat public production browser verification after deployment:

```sh
BASE_URL=https://traceeval.vercel.app npm run test:e2e
```

This uses the actual remote application, captures screenshots under `artifacts/production/screenshots`, and disables Playwright tracing for remote runs. It never enters private credentials or invokes a paid model. Hosted account verification remains a separate blocked gate until the dedicated Supabase project exists.

- Roll back the application deployment through Vercel if the new version fails. This first migration is additive; keep it in place when reverting the app. Destructive down migrations are intentionally omitted.
- `401`: sign in again; check Supabase project configuration.
- `503` on a live run: verify server configuration and migration privately. Do not print environment values.
- `429`: wait for the per-user quota window; no retry loop is implemented.
- Provider errors: check the endpoint/model contract and timeout. The app intentionally hides raw provider error bodies.
- Browser storage errors: export existing runs, then free site storage. The app reports failed saves and does not silently discard history.
- Build/browser test failures: inspect `artifacts/receipts`, `playwright-report`, and test traces. CI fixture traces contain only fictional data; avoid uploading traces from real authenticated/provider sessions.
