import { describe, it, expect } from "vitest";
import { dataset, generateDataset } from "../lib/dataset";
import { evaluate } from "../lib/evaluator";
import { fixtureResponse } from "../lib/fixtures";
import { runRequest } from "../lib/contracts";
const target = dataset.cases[0];
function changed(mutator: (output: typeof target.target) => void) { const output = structuredClone(target.target); mutator(output); return evaluate(JSON.stringify(output), target, dataset.evidence); }
describe("deterministic evaluator", () => {
  it("accepts all 500 faithful synthetic targets", () => { for (const c of dataset.cases) expect(evaluate(fixtureResponse(c), c, dataset.evidence).deterministicPass).toBe(true); });
  it("rejects malformed JSON without pretending citations were checked", () => { const r = evaluate("{", target, dataset.evidence); expect(r.schema.passed).toBe(false); expect(r.citations).toBeNull(); });
  it.each([null, [], { answer: "a" }, { answer: "a", abstained: false, claims: [] }, { answer: "a", abstained: "true", claims: [] }, { answer: " ", abstained: true, claims: [] }, { ...target.target, extra: true }])("rejects invalid schema: %j", value => { expect(evaluate(JSON.stringify(value), target, dataset.evidence).schema.passed).toBe(false); });
  it("forbids claims on abstention", () => { expect(changed(o => { o.abstained = true; }).schema.passed).toBe(false); });
  it("rejects unknown documents", () => { expect(changed(o => { o.claims[0].citations[0].documentId = "missing"; }).citations?.passed).toBe(false); });
  it("rejects real documents outside the assigned evidence", () => { expect(changed(o => { o.claims[0].citations[0].documentId = dataset.evidence[4].id; }).citations?.passed).toBe(false); });
  it("rejects quote mismatch and whitespace normalization", () => { expect(changed(o => { o.claims[0].citations[0].quote += " "; }).citations?.passed).toBe(false); });
  it.each([[-1, 4], [2.5, 10], [1, 100000], [2, 1], [5, 5]])("rejects bad offsets %s %s", (start, end) => { expect(changed(o => { Object.assign(o.claims[0].citations[0], { start, end }); }).deterministicPass).toBe(false); });
  it("treats offsets as UTF-16, including astral Unicode", () => { const doc = { id: "unicode", title: "fictional", fictional: true as const, text: "🌙 moon" }; const output = { answer: "moon", abstained: false, claims: [{ text: "moon", citations: [{ documentId: "unicode", start: 3, end: 7, quote: "moon" }] }] }; expect(evaluate(JSON.stringify(output), { ...target, evidenceIds: [doc.id] }, [doc]).deterministicPass).toBe(true); });
  it("checks claim coverage separately from valid citation spans", () => { const result = changed(o => { o.claims[0].citations = []; }); expect(result.citations?.passed).toBe(true); expect(result.coverage?.passed).toBe(false); });
  it("does not equate a valid citation with factual support", () => { const result = changed(o => { o.claims[0].text = "An unsupported fact."; o.answer = "An unsupported fact."; }); expect(result.deterministicPass).toBe(true); expect(result.targetMatch).toBe(false); expect(result.factualSupport).toEqual({ source: "not-reviewed", score: null }); });
  it("is repeatable without mutating inputs", () => { const before = JSON.stringify(target); const a = evaluate(fixtureResponse(target), target, dataset.evidence); expect(evaluate(fixtureResponse(target), target, dataset.evidence)).toEqual(a); expect(JSON.stringify(target)).toBe(before); });
});
describe("dataset and request contract", () => {
  it("has unique IDs, 500 targets, 300 fictional docs, 100 per family", () => { expect(dataset.cases).toHaveLength(500); expect(dataset.evidence).toHaveLength(300); expect(new Set(dataset.cases.map(c => c.id)).size).toBe(500); for (const category of new Set(dataset.cases.map(c => c.category))) expect(dataset.cases.filter(c => c.category === category)).toHaveLength(100); expect(dataset.evidence.every(d => d.fictional && d.text.includes("FICTIONAL"))).toBe(true); });
  it("is seeded and independent of clock/random", () => { expect(generateDataset()).toEqual(generateDataset()); expect(generateDataset(7)).not.toEqual(dataset); });
  it("rejects duplicates and oversized case sets", () => { expect(runRequest.safeParse({ name: "test", adapter: "fixture", caseIds: [target.id, target.id] }).success).toBe(false); expect(runRequest.safeParse({ name: "test", adapter: "fixture", caseIds: Array(501).fill(target.id) }).success).toBe(false); });
});
