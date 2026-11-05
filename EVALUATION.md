# Evaluation record and limits

## Production revision — November 5, 2026

The production revision was rerun rather than relying on historical claims. Receipt `artifacts/receipts/2026-11-05T23-18-10-684Z/summary.json` records 61 Vitest tests, five Chromium desktop/mobile browser workflows, production build, typecheck, reproducibility, and two complete 500-case fixture evaluations, all successful. Both SQL migrations passed the separate PostgreSQL test in `artifacts/receipts/rls-2026-11-05T23-23-26-525Z.log`.

The public demo now executes entirely in the browser; tests confirm no evaluation/review/run API calls are needed. Additional tests cover verified bearer identity, owner-field rejection, database errors and quotas, protected API denial, disallowed model endpoint configurations, valid JSON export contents, and deletion. These are software tests, not a human support study. Hosted production/CI evidence is recorded separately in `docs/PRODUCTION_VERIFICATION.md`; no hosted Supabase or paid inference success is implied.

The earlier local receipts below remain intact as historical evidence.

TraceEval separates deterministic structure/citation checks from human factual-support judgments. This document records synthetic fixture behavior and actual verification, not production model accuracy.

## Dataset

| Property | Value |
| --- | --- |
| Version | `synthetic-v1` |
| Seed | `20261105` |
| Synthetic target cases | 500 |
| Scenario families | 5, with 100 cases each |
| Fictional observatories | 100 |
| Fictional evidence documents | 300, with 3 per observatory |
| Canonical JSON SHA-256 | `b1fb31c7d38de0cdc04e48f52d79f387a756e19edb5a5e05d1e649e58c387855` |

The five families are direct lookup, multi-source, abstention, distractor, and structured output. Each observatory shares facts across five questions. The 500 cases are **not independent observations**, not real user requests, and not a held-out test set. Templates are intentionally small and English-only. No population estimate, significance test, confidence interval, fairness claim, or production quality conclusion is justified.

The generator is deterministic for a seed. `npm run generate -- --check` checks byte-for-byte consistency of generated data, schema, manifest, and sample evidence. Run metadata includes the dataset hash and evaluator version (`deterministic-v1`). IDs and timestamps of executed runs are intentionally unique.

## Deterministic definitions

| Check | Definition | Denominator |
| --- | --- | --- |
| JSON Schema pass | Parse JSON; fixed schema, no coercion/repair/additional fields | All attempted cases |
| Citation integrity | Assigned document ID, valid UTF-16 range, exact quoted substring | Schema-valid outputs only |
| Claim coverage | Every declared claim has at least one citation | Schema-valid outputs only |
| Overall deterministic pass | Schema + integrity + coverage all pass | All attempted cases, including provider errors |
| Synthetic target match | Exact `answer` text and `abstained` equality | All attempted cases |

Offsets use JavaScript UTF-16 code units; start is inclusive and end exclusive. No Unicode or whitespace normalization is performed. Empty quotations and whitespace-only fields are rejected. Citations outside the current case's evidence are rejected even if the document exists elsewhere in the dataset. Invalid-schema cases have null citation/coverage results, not a fabricated citation failure. Zero-claim abstentions pass citation integrity and coverage vacuously.

Claim coverage does not decompose answer prose, assess source quality, identify all implicit claims, or prove entailment. A plausible but false answer can pass all deterministic checks. Exact synthetic target match is also not semantic correctness; alternative supported wording can fail it.

## Executed fixture observations

Both adapters were actually executed on all 500 targets during local verification on November 5, 2026. The full response/check records are in `artifacts/evaluations/fixture.json` and `artifacts/evaluations/perturbed.json`; `summary.json` records execution timestamps, IDs, hashes, and counts.

| Adapter | Attempted | Schema pass | Citation integrity | Overall pass | Exact target match | Provider errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Faithful fixture | 500 | 500 / 500 | 500 / 500 eligible | 500 / 500 | 500 / 500 | 0 |
| Injected-fault fixture | 500 | 400 / 500 | 200 / 400 eligible | 100 / 500 | 300 / 500 | 0 |

These are software-fixture observations, **not model benchmark results**. The faithful adapter returns the target. The fault adapter alters each family differently: unknown document, wrong quotation, schema violation, missing citation, or unsupported claim with an otherwise valid citation. The last 100 pass deterministic checks by design, demonstrating the factual-support gap. The same 500 targets were used twice; this does not create 1,000 independent cases.

Fixture durations include local execution overhead and are not model latency. No throughput, monetary cost, or accuracy benchmark was attempted.

## Human judgments

Factual support starts at `{ source: "not-reviewed", score: null }`. The reviewer may record:

- **0:** unsupported or contradicted.
- **1:** partially supported.
- **2:** fully supported, including a justified abstention.

A 10–2,000 character rationale is required. The saved review is explicitly human and is separate from immutable run check output. The latest review replaces the previous judgment for the same run/case; historical review revisions are not retained. The dashboard reports reviewed counts and individual scores, not an unqualified accuracy average.

No model grader is implemented. No multi-reviewer calibration, agreement measurement, adjudication, or independent human study was performed. A browser test saves one scripted review to exercise the UI; that is not a human evaluation study.

## Comparisons

Runs must have matching dataset hashes and evaluator versions. Only intersecting case IDs are paired. Improvement means deterministic fail→pass; regression means pass→fail. Pairs with provider errors are excluded and reported. Different model adapters/prompts may be compared, but this measures observed paired check outcomes, not causal superiority or statistical significance.

## Verification receipts

The final complete local receipt is [artifacts/receipts/2026-11-05T17-58-15-155Z/summary.json](artifacts/receipts/2026-11-05T17-58-15-155Z/summary.json). Every command exited 0: **45 Vitest unit/integration tests**, **4 Chromium browser tests**, production build, typecheck, dataset reproducibility, and both full fixture evaluations. Browser tests cover create/inspect/review/export/reload/compare, catalog filters, methodology, mobile navigation/dialog dismissal, and disabled live/API error behavior. Five real browser screenshots were captured and inspected.

The initial receipt `artifacts/receipts/2026-11-05T17-49-30-988Z/summary.json` had two browser selector failures. Those failures and traces were preserved, not relabeled as success. The corrected browser-only rerun is `artifacts/receipts/browser-rerun-2.log`. `browser-rerun-1.log` records the sandbox's localhost-listen restriction before the permitted rerun.

The migration and RLS checks also **passed on actual disposable PostgreSQL 17**, using the minimal Supabase auth schema/helper described in the deployment guide. Receipt: [rls-2026-11-05T17-59-10-945Z.log](artifacts/receipts/rls-2026-11-05T17-59-10-945Z.log). Checks covered owner insert/read, another user's read/update/delete isolation, forged owner insertion, cross-owner review association, minute quota denial, quota-table inaccessibility, and anonymous denial. Test data was rolled back and the temporary container/VM stopped. This is not hosted Supabase Auth or PostgREST verification.

`npm run verify` stores command stdout/stderr, exit code, start/end timestamps, Node version, and lockfile hash. GitHub Actions retains artifacts with its actual run ID when it executes. There is no claimed GitHub CI execution or Vercel deployment in this local delivery.

Not verified against external systems: hosted Supabase authentication/persistence, a live paid model endpoint, production deployment, GitHub Actions execution, and browser engines other than Chromium. The database quota test covers sequential enforcement; no concurrent load/throughput benchmark was performed.

## Reproduce

```sh
npm ci
npx playwright install chromium
npm run verify
```

For database verification, follow `DEPLOYMENT.md`; do not use a production database. A successful local fixture suite does not establish database isolation in your deployed environment. Read `/methodology` in the application for the same scoring boundaries and counts.
