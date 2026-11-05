import Ajv2020 from "ajv/dist/2020";
import { outputSchema } from "./output-schema";
import type { Evaluation, Evidence, ModelOutput, TargetCase } from "./types";
export const EVALUATOR_VERSION = "deterministic-v1";
const ajv = new Ajv2020({ allErrors: true, strict: true, strictTypes: false, coerceTypes: false, removeAdditional: false });
const validate = ajv.compile<ModelOutput>(outputSchema);
export function evaluate(raw: string, target: TargetCase, evidence: Evidence[]): Evaluation {
  let parsed: unknown;
  const base = { citations: null, coverage: null, deterministicPass: false, targetMatch: false, factualSupport: { source: "not-reviewed" as const, score: null } };
  try { parsed = JSON.parse(raw); } catch { return { ...base, schema: { passed: false, issues: ["Response is not valid JSON."] } }; }
  if (!validate(parsed)) return { ...base, schema: { passed: false, issues: (validate.errors ?? []).map(e => `${e.instancePath || "/"} ${e.message}`) } };
  const issues: string[] = [];
  const coverage: string[] = [];
  const allowed = new Map(evidence.filter(d => target.evidenceIds.includes(d.id)).map(d => [d.id, d]));
  parsed.claims.forEach((claim, i) => {
    if (!claim.citations.length) coverage.push(`Claim ${i + 1} has no citation.`);
    claim.citations.forEach((citation, j) => {
      const prefix = `Claim ${i + 1}, citation ${j + 1}`;
      const doc = allowed.get(citation.documentId);
      if (!doc) { issues.push(`${prefix}: document is not in this case's evidence.`); return; }
      if (citation.end <= citation.start || citation.end > doc.text.length) issues.push(`${prefix}: invalid UTF-16 range.`);
      else if (doc.text.slice(citation.start, citation.end) !== citation.quote) issues.push(`${prefix}: quotation does not match the exact evidence span.`);
    });
  });
  return {
    schema: { passed: true, issues: [] }, citations: { passed: issues.length === 0, issues }, coverage: { passed: coverage.length === 0, issues: coverage },
    deterministicPass: issues.length === 0 && coverage.length === 0,
    // A synthetic oracle check only; never a factual-support or model benchmark score.
    targetMatch: parsed.answer === target.target.answer && parsed.abstained === target.target.abstained,
    factualSupport: { source: "not-reviewed", score: null }
  };
}
