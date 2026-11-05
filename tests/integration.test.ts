import { describe, it, expect, afterEach, vi } from "vitest";
import { POST } from "../app/api/evaluate/route";
import { POST as reviewPost } from "../app/api/reviews/route";
import { executeRun } from "../lib/runner";
import { dataset } from "../lib/dataset";
import { summarize, compareRuns } from "../lib/metrics";
import { parseStore } from "../lib/storage";
const ids = dataset.cases.map(c => c.id);
function request(body: unknown, headers = { "Content-Type": "application/json" }) { return new Request("http://localhost/api/evaluate", { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) }); }
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("fixture integration", () => {
  it("executes 500 cases per adapter and reports actual denominators", async () => {
    const a = await executeRun({ name: "Faithful", adapter: "fixture", caseIds: ids });
    const b = await executeRun({ name: "Faults", adapter: "perturbed", caseIds: ids });
    expect(summarize(a)).toEqual({ total: 500, errors: 0, schema: 500, citationsEligible: 500, citations: 500, passed: 500, targetMatches: 500 });
    expect(summarize(b)).toEqual({ total: 500, errors: 0, schema: 400, citationsEligible: 400, citations: 200, passed: 100, targetMatches: 300 });
    expect(compareRuns(a, b)).toEqual({ paired: 500, excludedErrors: 0, improved: 0, regressed: 400 });
    expect(parseStore({ runs: [a, b], reviews: [] }).runs).toHaveLength(2);
  });
  it("compares only shared cases and rejects mismatched provenance", async () => {
    const a = await executeRun({ name: "a", adapter: "fixture", caseIds: ids.slice(0, 10) });
    const b = await executeRun({ name: "b", adapter: "perturbed", caseIds: ids.slice(5, 15) });
    expect(compareRuns(a, b).paired).toBe(5); expect(() => compareRuns(a, { ...b, datasetHash: "other" })).toThrow();
  });
  it("records transport errors without leaking provider secrets", async () => {
    const run = await executeRun({ name: "error", adapter: "live", caseIds: ids.slice(0, 1) }, async () => { throw new Error("SECRET_PROVIDER_DATA"); }, "mock");
    expect(run.status).toBe("partial"); expect(summarize(run).errors).toBe(1); expect(JSON.stringify(run)).not.toContain("SECRET_PROVIDER_DATA");
  });
  it("rejects unknown IDs before model calls", async () => { const live = vi.fn(); await expect(executeRun({ name: "bad", adapter: "live", caseIds: ["case-9999"] }, live)).rejects.toThrow(); expect(live).not.toHaveBeenCalled(); });
  it("rejects corrupt browser history", () => { expect(() => parseStore({ runs: [{ id: "invalid" }], reviews: [] })).toThrow(); });
});
describe("API boundary", () => {
  it("denies anonymous server compute even when demo storage is local", async () => {
    vi.stubEnv("TRACEEVAL_STORAGE", "local"); const network = vi.fn(); vi.stubGlobal("fetch", network);
    const response = await POST(request({ name: "API run", adapter: "fixture", caseIds: ids.slice(0, 10) }));
    expect(response.status).toBe(401); expect(network).not.toHaveBeenCalled();
  });
  it.each([{ name: "bad", adapter: "fixture", caseIds: ["case-9999"] }, { name: "bad", adapter: "fixture", caseIds: [ids[0], ids[0]] }, { name: "", adapter: "fixture", caseIds: ids.slice(0, 1) }, { name: "bad", adapter: "invented", caseIds: [] }])("rejects invalid input", async body => { expect((await POST(request(body))).status).toBe(400); });
  it("rejects malformed JSON and wrong content type", async () => { expect((await POST(request("{"))).status).toBe(400); expect((await POST(request("{}", { "Content-Type": "text/plain" }))).status).toBe(415); });
  it("bounds request body without trusting content-length", async () => { expect((await POST(request(JSON.stringify({ a: "x".repeat(17000) })))).status).toBe(413); });
  it("does not silently fall back when live is disabled", async () => { vi.stubEnv("TRACEEVAL_STORAGE", "local"); vi.stubEnv("TRACEEVAL_LIVE_ENABLED", "false"); expect((await POST(request({ name: "live", adapter: "live", caseIds: ids.slice(0, 1) }))).status).toBe(503); });
  it("requires authentication before Supabase persistence", async () => { vi.stubEnv("TRACEEVAL_STORAGE", "supabase"); expect((await POST(request({ name: "private", adapter: "fixture", caseIds: ids.slice(0, 1) }))).status).toBe(401); });
  it("rejects unauthenticated persistent reviews", async () => { vi.stubEnv("TRACEEVAL_STORAGE", "supabase"); expect((await reviewPost(request({}))).status).toBe(401); });
});
