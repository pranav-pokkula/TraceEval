import { z } from "zod";
export const runRequest = z.object({
  name: z.string().trim().min(1).max(80),
  adapter: z.enum(["fixture", "perturbed", "live"]),
  caseIds: z.array(z.string().regex(/^case-\d{4}$/)).min(1).max(500).refine(ids => new Set(ids).size === ids.length, "Duplicate case IDs are not allowed")
}).strict();
export const reviewRequest = z.object({ runId: z.uuid(), caseId: z.string().regex(/^case-\d{4}$/), score: z.number().int().min(0).max(2), rationale: z.string().trim().min(10).max(2000) }).strict();
