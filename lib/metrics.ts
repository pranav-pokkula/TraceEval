import type { Run } from "./types";
export function summarize(run: Run) {
  const total = run.results.length;
  const completed = run.results.filter(r => !r.error);
  return { total, errors: total - completed.length, schema: completed.filter(r => r.evaluation.schema.passed).length,
    citationsEligible: completed.filter(r => r.evaluation.citations !== null).length,
    citations: completed.filter(r => r.evaluation.citations?.passed).length,
    passed: completed.filter(r => r.evaluation.deterministicPass).length,
    targetMatches: completed.filter(r => r.evaluation.targetMatch).length };
}
export function compareRuns(a: Run, b: Run) {
  if (a.datasetHash !== b.datasetHash || a.evaluatorVersion !== b.evaluatorVersion) throw new Error("Runs must use the same dataset and evaluator versions.");
  const right = new Map(b.results.map(r => [r.caseId, r]));
  const paired = a.results.filter(r => right.has(r.caseId));
  return { paired: paired.length, excludedErrors: paired.filter(r => r.error || right.get(r.caseId)!.error).length,
    improved: paired.filter(r => !r.error && !right.get(r.caseId)!.error && !r.evaluation.deterministicPass && right.get(r.caseId)!.evaluation.deterministicPass).length,
    regressed: paired.filter(r => !r.error && !right.get(r.caseId)!.error && r.evaluation.deterministicPass && !right.get(r.caseId)!.evaluation.deterministicPass).length };
}
