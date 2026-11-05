import manifest from "../data/manifest.json";
import { dataset } from "./dataset";
import { evaluate, EVALUATOR_VERSION } from "./evaluator";
import { fixtureResponse } from "./fixtures";
import type { Adapter, Run, TargetCase } from "./types";
// Generated and byte-checked before every build/CI run; safe to import in the public demo.
export const DATASET_HASH = manifest.sha256;
export async function executeRun(input: { name: string; adapter: Adapter; caseIds: string[] }, live?: (target: TargetCase) => Promise<string>, model = "") : Promise<Run> {
  const selected = input.caseIds.map(id => dataset.cases.find(c => c.id === id));
  if (selected.some(c => !c)) throw new Error("Unknown case ID.");
  if (new Set(input.caseIds).size !== input.caseIds.length) throw new Error("Duplicate case ID.");
  if (input.adapter === "live" && !live) throw new Error("Live adapter is unavailable.");
  const start = performance.now();
  const results: Run["results"] = [];
  for (const target of selected as TargetCase[]) {
    const before = performance.now();
    try {
      const raw = input.adapter === "live" ? await live!(target) : fixtureResponse(target, input.adapter === "perturbed");
      results.push({ caseId: target.id, raw, evaluation: evaluate(raw, target, dataset.evidence), durationMs: Math.round(performance.now() - before) });
    } catch {
      results.push({ caseId: target.id, raw: "", error: "Model request failed or exceeded its limit. No response was evaluated.", evaluation: evaluate("", target, dataset.evidence), durationMs: Math.round(performance.now() - before) });
    }
  }
  return { id: crypto.randomUUID(), name: input.name, adapter: input.adapter, model: input.adapter === "live" ? model : `scripted-${input.adapter}-v1`, createdAt: new Date().toISOString(), datasetVersion: dataset.version, datasetHash: DATASET_HASH, evaluatorVersion: EVALUATOR_VERSION, seed: dataset.seed,
    status: results.some(r => r.error) ? "partial" : "completed", results, durationMs: Math.round(performance.now() - start) };
}
