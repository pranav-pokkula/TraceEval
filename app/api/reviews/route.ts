import { reviewRequest } from "@/lib/contracts";
import { authenticatedDatabase } from "@/lib/supabase.server";
import { HttpError, errorResponse, readBody } from "@/lib/http";
import type { Run } from "@/lib/types";
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticatedDatabase(request);
    const parsed = reviewRequest.safeParse(await readBody(request));
    if (!parsed.success) throw new HttpError(400, "Provide a score from 0–2 and a rationale of 10–2000 characters.");
    const review = parsed.data;
    const { data: run, error: readError } = await db.from("runs").select("payload").eq("id", review.runId).single();
    if (readError || !run || !(run.payload as Run).results.some(r => r.caseId === review.caseId && !r.error)) throw new HttpError(404, "Evaluated case not found in your runs.");
    const { data, error } = await db.from("reviews").upsert({ owner_id: user.id, run_id: review.runId, case_id: review.caseId, score: review.score, rationale: review.rationale, created_at: new Date().toISOString() }, { onConflict: "run_id,case_id" }).select().single();
    if (error) throw new HttpError(503, "Review could not be saved.");
    return Response.json({ id: data.id, runId: data.run_id, caseId: data.case_id, score: data.score, rationale: data.rationale, createdAt: data.created_at, source: "human" });
  } catch (error) { return errorResponse(error); }
}
