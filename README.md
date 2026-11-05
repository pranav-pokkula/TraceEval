# TraceEval

An inspectable evaluation workbench for structured answers and citations, built with Next.js App Router, TypeScript, Tailwind CSS, Zod, AJV, and optional Supabase/Postgres persistence.

Source: [pranav-pokkula/TraceEval](https://github.com/pranav-pokkula/TraceEval). Actual deployment/CI status is recorded in [Production verification](docs/PRODUCTION_VERIFICATION.md). The TraceEval Supabase organization exists, but its project is blocked by the account's two-active-free-project limit. Hosted account persistence is not claimed operational. [Architecture](docs/ARCHITECTURE.md) explains the boundaries.

**All bundled documents are fictional. The 500 dataset cases are synthetic targets, not a real-world benchmark.** Deterministic citation checks do not establish factual support. Human judgments are stored and labeled separately.

## Quick start — no credentials

Requires Node.js 22+ and npm. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:3000>. Select **New evaluation**, keep the faithful fixture or choose injected faults, and run 10, 50, or 500 cases. Inspect a case, read its fictional source documents, record a human review, export JSON, and compare two runs.

No `.env` file is needed in fixture mode. After the page assets load, fixture execution needs no external network, model, database, or remote font. “Offline” does not mean an installable service-worker app. Public demo runs execute entirely in the browser and are stored locally, with a limit of 8 runs. Export and delete old runs from their detail page to free space. No sample evaluation is preloaded or presented as an executed run.

## Included

- Overview, evaluation history, trace inspector, searchable dataset and evidence, paired comparison, settings/sign-in, and `/methodology`.
- A seeded generator producing 500 cases and 300 fictional documents across 100 fictional observatories. Three sample Markdown evidence documents are included.
- Fixed JSON Schema 2020-12 validation; exact document/span/quotation checks; declared-claim citation coverage.
- Faithful and deliberately perturbed fixture adapters. An optional server-only Chat Completions adapter sends questions and evidence, never target answers.
- Null-by-default factual support, explicit human 0–2 judgments and rationales. No automatic factual-support grader is implemented.
- Optional Supabase email/password authentication, private run/review storage, RLS migrations, and database-backed live quotas.
- Vitest unit/integration tests, Playwright desktop/mobile browser flows and screenshots, Postgres RLS tests, and GitHub Actions.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` / `npm start` | Build and serve production |
| `npm run generate` | Regenerate checked-in dataset/schema/manifest and sample evidence |
| `npm run generate -- --check` | Detect generated-artifact drift |
| `npm run evaluate` | Execute both fixtures on all 500 cases; save full run JSON |
| `npm test` | Unit/integration tests, including mocked live boundaries |
| `npm run typecheck` | TypeScript validation |
| `npm run test:e2e` | Browser tests against a production build on port 3100 |
| `npm run verify` | Sequential verification with stdout, stderr, timestamps, exit codes |
| `npm run test:rls` | Opt-in SQL isolation tests on a disposable database |

Install Chromium before browser verification: `npx playwright install chromium` (Linux CI uses `--with-deps`). `npm run verify` checks generated data, tests, builds, typechecks, executes fixtures, and runs browser tests. It stops on failure and preserves the receipt. Browser tests start and stop their own production server. Do not run another process on port 3100.

## Layout

```text
app/                   App Router pages and API handlers
components/            Responsive dashboard and workspace state
lib/dataset.ts         Seeded target/evidence generator
lib/output-schema.ts   Canonical response JSON Schema
lib/evaluator.ts       Deterministic schema/citation/coverage checks
lib/runner.ts          Run execution and provenance
lib/live.server.ts     Optional bounded server-only model adapter
lib/supabase.server.ts Authenticated, RLS-respecting database client
data/                  Generated JSON and fictional sample evidence
supabase/migrations/   Owner-scoped schema and live quota function
scripts/               Generation, evaluation, verification, SQL tests
tests/                 Unit, API integration, and Playwright tests
artifacts/             Actual command receipts and fixture outputs
public/screenshots/    Browser-generated desktop/mobile screenshots
```

## Modes and boundaries

| Mode | Persistence | Model traffic | Credentials |
| --- | --- | --- | --- |
| Public demo (always available) | Browser localStorage | None | None |
| Private workspace + fixtures | Private Postgres rows | None | Supabase URL and publishable/anon key; user login |
| Private workspace + live | Private Postgres rows | Configured server endpoint | Server-only model key/name/URL; user login |

Live runs are bounded to 10 cases/request, 10 cases/minute/user, and 100 cases/rolling day/user. A case has a 4-second timeout and bounded output size. Failed calls consume reserved quota; there are no retries. Public signup is omitted. Administrators should keep Supabase signup disabled and provision approved users when enabling paid live inference. No service-role key is needed.

The server configures account availability. When configured, signed-in users can switch between the demo and private workspace in Settings. Private history is never merged into demo storage. Every server evaluation, run, review, and delete API requires a verified user. Missing credentials never silently trigger live inference. Do not paste secrets into chat, source, screenshots, or issue reports. See [.env.example](.env.example) for variable names and [DEPLOYMENT.md](DEPLOYMENT.md) for private configuration.

## Evidence and verification

See [EVALUATION.md](EVALUATION.md) for actual executed counts, receipts, formulas, and limits; [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for release gates. GitHub Actions configuration is included, but a workflow file is not evidence that CI has run. Hosted Supabase and live-provider integration need separate verification.

Screenshots are captured from real browser runs, not mockups:

- [Desktop dashboard](public/screenshots/dashboard-desktop.png)
- [Mobile dashboard](public/screenshots/dashboard-mobile.png)
- [Trace inspector](public/screenshots/trace-inspector-desktop.png)
- [Comparison](public/screenshots/comparison-desktop.png)
- [Methodology](public/screenshots/methodology-desktop.png)

## Scope decisions

The repository was empty and the earlier detailed spec was not available. The implemented workbench scope was confirmed in this session. Static, versioned evidence and target cases ship with the application; Postgres stores user runs, human reviews, and quota reservations. Custom dataset uploads, evidence editing, organizations, automated graders, background jobs, statistical benchmark claims, and tamper-proof attestations are outside this implementation.
