export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError(415, "Use application/json.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "A JSON body is required.");
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 16384) throw new HttpError(413, "Request is too large."); chunks.push(value); }
  } finally { await reader.cancel(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new HttpError(400, "Invalid JSON."); }
}
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof HttpError ? error.message : "The operation could not be completed. Check server configuration and try again." }, { status: error instanceof HttpError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
}
