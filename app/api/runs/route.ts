import { authenticatedDatabase } from "@/lib/supabase.server";
import { HttpError, errorResponse } from "@/lib/http";
export async function GET(request: Request) {
  try {
    const { db } = await authenticatedDatabase(request);
    const runs = await db.from("runs").select("id,payload").order("created_at", { ascending: false }).limit(50);
    if (runs.error) throw new HttpError(503, "Saved runs could not be loaded.");
    // Reviews are fetched only for the visible run page, avoiding unrelated counts.
    const reviews = runs.data.length ? await db.from("reviews").select("id,run_id,case_id,score,rationale,created_at")
      .in("run_id", runs.data.map(r => r.id)).order("created_at", { ascending: false }).limit(5000) : { data: [], error: null };
    if (runs.error || reviews.error) throw new HttpError(503, "Saved runs could not be loaded.");
    return Response.json({ runs: runs.data.map(r => r.payload), reviews: reviews.data.map(r => ({ id: r.id, runId: r.run_id, caseId: r.case_id, score: r.score, rationale: r.rationale, createdAt: r.created_at, source: "human" })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const { db } = await authenticatedDatabase(request);
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new HttpError(400, "A valid run ID is required.");
    const { data, error } = await db.from("runs").delete().eq("id", id).select("id");
    if (error) throw new HttpError(503, "Run could not be deleted.");
    if (!data.length) throw new HttpError(404, "Run not found in your workspace.");
    return Response.json({ deleted: id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
