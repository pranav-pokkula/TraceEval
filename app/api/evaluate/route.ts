import { runRequest } from "@/lib/contracts";
import { executeRun } from "@/lib/runner";
import { dataset } from "@/lib/dataset";
import { liveConfigured, liveResponse } from "@/lib/live.server";
import { authenticatedDatabase } from "@/lib/supabase.server";
import { HttpError, errorResponse, readBody } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const input = runRequest.safeParse(await readBody(request));
    if (!input.success) throw new HttpError(400, "Provide a name, adapter, and 1–500 unique case IDs.");
    if (input.data.caseIds.some(id => !dataset.cases.some(c => c.id === id))) throw new HttpError(400, "Unknown case ID.");
    // Public demos execute in the browser; every server evaluation requires a verified user.
    if (input.data.adapter === "live" && !liveConfigured()) throw new HttpError(503, "Live inference is disabled.");
    const context = await authenticatedDatabase(request);
    if (input.data.adapter === "live") {
      if (!liveConfigured() || !context) throw new HttpError(503, "Live inference is disabled. Configure server credentials and authenticated Supabase storage.");
      if (input.data.caseIds.length > 10) throw new HttpError(400, "Live runs are limited to 10 cases.");
      const { data: allowed, error } = await context.db.rpc("reserve_live_budget", { p_count: input.data.caseIds.length });
      if (error) throw new HttpError(503, "Live budget could not be reserved. Check the database migration.");
      if (!allowed) throw new HttpError(429, "Live quota reached: 10 cases per minute and 100 per rolling day.");
    }
    const run = await executeRun(input.data, input.data.adapter === "live" ? liveResponse : undefined, process.env.MODEL_NAME);
    const { error } = await context.db.from("runs").insert({ id: run.id, owner_id: context.user.id, payload: run });
    if (error?.code === "P0001") throw new HttpError(429, "Workspace storage limit reached. Export and delete old runs before creating another.");
    if (error) throw new HttpError(503, "The run finished but could not be saved. No success was recorded; any live quota remains reserved.");
    return Response.json(run, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
