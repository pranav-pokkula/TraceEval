import { beforeEach, afterEach, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({ getUser: vi.fn(), createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mock.createClient }));
import { authenticatedDatabase } from "../lib/supabase.server";
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-public-key"); mock.createClient.mockReturnValue({ auth: { getUser: mock.getUser } }); });
afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });
it("requires a bearer token", async () => { await expect(authenticatedDatabase(new Request("http://localhost"))).rejects.toMatchObject({ status: 401 }); expect(mock.createClient).not.toHaveBeenCalled(); });
it("verifies token with Supabase rather than trusting JWT payloads", async () => { mock.getUser.mockResolvedValue({ data: { user: null }, error: { message: "not valid" } }); await expect(authenticatedDatabase(new Request("http://localhost", { headers: { Authorization: "Bearer forged" } }))).rejects.toMatchObject({ status: 401 }); expect(mock.getUser).toHaveBeenCalledWith("forged"); });
it("uses the caller token with the public key, not a service role", async () => { mock.getUser.mockResolvedValue({ data: { user: { id: "verified-user" } }, error: null }); const result = await authenticatedDatabase(new Request("http://localhost", { headers: { Authorization: "Bearer test-token" } })); expect(result.user.id).toBe("verified-user"); expect(mock.createClient.mock.calls[0][2].global.headers.Authorization).toBe("Bearer test-token"); });
