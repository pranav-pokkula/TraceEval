"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { dataset } from "@/lib/dataset";
import { parseStore, STORAGE_KEY } from "@/lib/storage";
import { reviewRequest, runRequest } from "@/lib/contracts";
import type { Run, Review } from "@/lib/types";
import { Plus, X, LoaderCircle } from "lucide-react";

type Mode = "demo" | "account";
type Saved = { runs: Run[]; reviews: Review[] };
const empty: Saved = { runs: [], reviews: [] };
type Workspace = {
  runs: Run[]; reviews: Review[]; ready: boolean; persistent: boolean; accountAvailable: boolean;
  mode: Mode; switchMode: (mode: Mode) => void; email: string | null; error: string;
  setError: (message: string) => void; openRun: () => void; client: SupabaseClient | null;
  saveReview: (input: {runId: string; caseId: string; score: number; rationale: string}) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
};
const Context = createContext<Workspace | null>(null);
export function useWorkspace() { const value = useContext(Context); if (!value) throw new Error("Missing workspace"); return value; }
export function WorkspaceProvider({ children, persistent: accountAvailable, liveEnabled }: { children: ReactNode; persistent: boolean; liveEnabled: boolean }) {
  const [demo, setDemo] = useState<Saved>(empty);
  const [account, setAccount] = useState<Saved>(empty);
  const [mode, setMode] = useState<Mode>("demo");
  const [ready, setReady] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [identity, setIdentity] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [showRun, setShowRun] = useState(false);
  const boundary = useRef(0);
  const router = useRouter();
  const persistent = mode === "account" && !!token;
  const { runs, reviews } = persistent ? account : demo;

  const switchMode = useCallback((next: Mode) => {
    if (next === "account" && !token) { router.push("/settings"); return; }
    boundary.current++; setShowRun(false); setMode(next); setError("");
    try { sessionStorage.setItem("traceeval:mode", next); } catch { /* mode remains usable in memory */ }
    router.push("/");
  }, [router, token]);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setDemo(parseStore(JSON.parse(raw))); }
    catch { setError("Browser history could not be read. Export important runs before clearing site data."); }
    setReady(true);
    if (!accountAvailable) return;
    let active = true; let unsubscribe: (() => void) | undefined;
    import("@supabase/supabase-js").then(({ createClient }) => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error("Missing public configuration");
      if (!active) return;
      const db = createClient(url, key); setClient(db);
      const { data } = db.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        boundary.current++;
        setToken(session?.access_token ?? null); setEmail(session?.user.email ?? null); setIdentity(session?.user.id ?? null);
        if (!session) { setAccount(empty); setMode("demo"); setShowRun(false); }
        else if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          let chosen = "account";
          try { if (event === "INITIAL_SESSION") chosen = sessionStorage.getItem("traceeval:mode") || "account"; } catch {}
          setMode(chosen === "demo" ? "demo" : "account");
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    }).catch(() => { if (active) setError("Account sign-in is unavailable. The public fixture demo still works."); });
    return () => { active = false; unsubscribe?.(); };
  }, [accountAvailable]);

  useEffect(() => {
    setAccount(empty);
    if (!token || !identity) { setLoadingAccount(false); return; }
    setLoadingAccount(true);
    const controller = new AbortController();
    fetch("/api/runs", { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (!controller.signal.aborted) setAccount(parseStore(data));
    }).catch(() => { if (!controller.signal.aborted) setError("Private runs could not be loaded. Check your connection or sign in again."); })
      .finally(() => { if (!controller.signal.aborted) setLoadingAccount(false); });
    return () => controller.abort();
  }, [token, identity]);

  function persist(next: Saved) {
    if (persistent) { setAccount(next); return; }
    if (next.runs.length > 8) throw new Error("Demo history holds 8 runs. Export and delete an old run to make room.");
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { throw new Error("Browser storage is full or unavailable. The operation was not saved. Export and delete old runs to free space."); }
    setDemo(next);
  }
  async function saveReview(input: {runId: string; caseId: string; score: number; rationale: string}) {
    const parsed = reviewRequest.safeParse(input);
    if (!parsed.success) throw new Error("Choose a score and write a rationale of 10–2000 characters.");
    if (!runs.some(r => r.id === input.runId && r.results.some(c => c.caseId === input.caseId && !c.error))) throw new Error("Evaluated case not found in this workspace.");
    const epoch = boundary.current; let review: Review;
    if (persistent) {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(parsed.data) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error); review = data;
    } else review = { ...parsed.data, id: crypto.randomUUID(), source: "human", createdAt: new Date().toISOString() };
    if (epoch !== boundary.current) throw new Error("Workspace changed. Reload the selected workspace to see any saved result.");
    persist({ runs, reviews: [review, ...reviews.filter(r => r.runId !== input.runId || r.caseId !== input.caseId)] });
  }
  async function deleteRun(id: string) {
    const epoch = boundary.current;
    if (persistent) {
      const response = await fetch(`/api/runs?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error((await response.json()).error);
    }
    if (epoch !== boundary.current) return;
    persist({ runs: runs.filter(r => r.id !== id), reviews: reviews.filter(r => r.runId !== id) });
    router.push("/runs");
  }
  return <Context.Provider value={{ runs, reviews, ready: ready && (!persistent || !loadingAccount), persistent, accountAvailable, mode, switchMode, email, error, setError, openRun: () => setShowRun(true), saveReview, deleteRun, client }}>
    {children}
    {showRun && <RunDialog liveEnabled={liveEnabled && persistent} persistent={persistent} onClose={() => setShowRun(false)} onSubmit={async input => {
      const epoch = boundary.current;
      const validated = runRequest.parse(input);
      let run: Run;
      if (persistent) {
        const response = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(validated) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error); run = data;
      } else {
        if (validated.adapter === "live") throw new Error("Live inference is unavailable in the public demo.");
        // Lazy load AJV/evaluation code only when a visitor runs the demo. No public compute API.
        const { executeRun } = await import("@/lib/runner");
        run = await executeRun(validated);
      }
      if (epoch !== boundary.current) throw new Error("Workspace changed. Reload the selected workspace to see any saved result.");
      persist({ runs: [run, ...runs], reviews }); setShowRun(false); router.push(`/runs/${run.id}`);
    }} />}
  </Context.Provider>;
}
export function NewRunButton() { const { openRun, ready } = useWorkspace(); return <button className="button primary" onClick={openRun} disabled={!ready}><Plus size={16} /> New evaluation</button>; }
function RunDialog({ onClose, onSubmit, liveEnabled, persistent }: { onClose: () => void; onSubmit: (input: {name: string; adapter: string; caseIds: string[]}) => Promise<void>; liveEnabled: boolean; persistent: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [adapter, setAdapter] = useState("fixture"); const [count, setCount] = useState("500");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} aria-labelledby="run-dialog-title" onCancel={e => { if (busy) e.preventDefault(); }} onClose={onClose} className="modal">
    <div className="flex items-center justify-between"><span className="eyebrow">{persistent ? "PRIVATE WORKSPACE" : "PUBLIC FIXTURE DEMO"}</span><button aria-label="Close dialog" className="icon-button" onClick={onClose} disabled={busy}><X size={20}/></button></div>
    <h2 id="run-dialog-title" className="mt-4 text-2xl font-semibold">Start an evaluation</h2><p className="muted mt-2">One dataset. Reproducible checks. A trace for every result.</p>
    <form onSubmit={async event => { event.preventDefault(); setError(""); setBusy(true); const form = new FormData(event.currentTarget); try { await onSubmit({ name: String(form.get("name")), adapter, caseIds: dataset.cases.slice(0, Number(count)).map(c => c.id) }); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>
      <label className="field">Run name<input name="name" required maxLength={80} defaultValue="Baseline evaluation" disabled={busy}/></label>
      <label className="field">Adapter<select aria-label="Adapter" value={adapter} disabled={busy} onChange={e => { setAdapter(e.target.value); if (e.target.value === "live") setCount("10"); }}>
        <option value="fixture">Fixture · faithful target</option><option value="perturbed">Fixture · injected faults</option><option value="live" disabled={!liveEnabled}>Live model {liveEnabled ? "· provider charges apply" : "· not configured"}</option>
      </select></label>
      <label className="field">Sample size<select value={count} disabled={busy} onChange={e => setCount(e.target.value)}><option value="10">10 cases · 2 per family</option><option value="50" disabled={adapter === "live"}>50 cases · 10 per family</option><option value="500" disabled={adapter === "live"}>500 cases · full synthetic dataset</option></select></label>
      <div className="notice mt-5">{adapter === "live" ? "Sends fictional questions and evidence to your configured model provider. At most 10 cases; no retries. Provider billing is separate." : `Scripted responses, no model calls. Results measure validator behavior, not model quality. ${persistent ? "Saved to your private account." : "Executed and saved only in this browser."}`}</div>
      {error && <p role="alert" className="error-text mt-3">{error}</p>}
      <button className="button primary mt-6 w-full justify-center" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={16}/> : <Plus size={16}/>} {busy ? "Evaluating…" : "Run evaluation"}</button>
    </form>
  </dialog>;
}
