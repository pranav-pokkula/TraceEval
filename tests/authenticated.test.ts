import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocked = vi.hoisted(() => ({ authenticate: vi.fn(), insert: vi.fn(), rpc: vi.fn() }));
vi.mock("../lib/supabase.server", () => ({ authenticatedDatabase: mocked.authenticate }));
import { POST } from "../app/api/evaluate/route";
const owner = "11111111-1111-4111-8111-111111111111";
const request = (body: unknown) => new Request("http://localhost/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer synthetic-test-token" }, body: JSON.stringify(body) });
const input = { name: "Private fixture", adapter: "fixture", caseIds: ["case-0001"] };
beforeEach(() => { mocked.insert.mockResolvedValue({ error: null }); mocked.authenticate.mockResolvedValue({ user: { id: owner }, db: { from: () => ({ insert: mocked.insert }), rpc: mocked.rpc } }); });
afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });
describe("authenticated run persistence", () => {
  it("stores server-evaluated output with verified owner identity", async () => { const response = await POST(request(input)); expect(response.status).toBe(200); const run = await response.json(); expect(run.results[0].evaluation.deterministicPass).toBe(true); expect(mocked.insert).toHaveBeenCalledWith({ id: run.id, owner_id: owner, payload: run }); });
  it("rejects a client-supplied owner identifier", async () => { expect((await POST(request({ ...input, owner_id: "forged" }))).status).toBe(400); expect(mocked.insert).not.toHaveBeenCalled(); });
  it("reports database rejection without returning success or database details", async () => { mocked.insert.mockResolvedValue({ error: { code: "42501", message: "PRIVATE_DATABASE_DETAIL" } }); const response = await POST(request(input)); expect(response.status).toBe(503); expect(await response.text()).not.toContain("PRIVATE_DATABASE_DETAIL"); });
  it("reports storage quota distinctly", async () => { mocked.insert.mockResolvedValue({ error: { code: "P0001" } }); expect((await POST(request(input))).status).toBe(429); });
  it("denies exhausted live quota before calling a provider", async () => {
    vi.stubEnv("TRACEEVAL_STORAGE", "supabase"); vi.stubEnv("TRACEEVAL_LIVE_ENABLED", "true"); vi.stubEnv("MODEL_API_KEY", "synthetic-not-a-key"); vi.stubEnv("MODEL_NAME", "synthetic"); vi.stubEnv("MODEL_API_URL", "https://api.openai.com/v1/chat/completions");
    mocked.rpc.mockResolvedValue({ data: false, error: null }); expect((await POST(request({ ...input, adapter: "live" }))).status).toBe(429); expect(mocked.insert).not.toHaveBeenCalled();
  });
});
