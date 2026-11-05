import { z } from "zod";
import type { Run, Review } from "./types";
const check = z.object({ passed: z.boolean(), issues: z.array(z.string()) });
const run = z.object({ id: z.uuid(), name: z.string(), adapter: z.enum(["fixture", "perturbed", "live"]), model: z.string(), createdAt: z.iso.datetime(), datasetVersion: z.string(), datasetHash: z.string(), evaluatorVersion: z.string(), seed: z.number(), status: z.enum(["completed", "partial"]), durationMs: z.number(), results: z.array(z.object({ caseId: z.string(), raw: z.string(), durationMs: z.number(), error: z.string().optional(), evaluation: z.object({ schema: check, citations: check.nullable(), coverage: check.nullable(), deterministicPass: z.boolean(), targetMatch: z.boolean(), factualSupport: z.object({ source: z.literal("not-reviewed"), score: z.null() }) }) })) });
const review = z.object({ id: z.uuid(), runId: z.uuid(), caseId: z.string(), source: z.literal("human"), score: z.number().int().min(0).max(2), rationale: z.string(), createdAt: z.iso.datetime() });
const store = z.object({ runs: z.array(run).max(50), reviews: z.array(review).max(5000) });
export function parseStore(raw: unknown): { runs: Run[]; reviews: Review[] } { return store.parse(raw); }
export const STORAGE_KEY = "traceeval:v1";
