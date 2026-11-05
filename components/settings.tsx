"use client";
import { useState } from "react";
import { useWorkspace } from "./workspace";
import { PageHeading } from "./overview";
export function Settings() {
  const { persistent, accountAvailable, email, client, switchMode } = useWorkspace();
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  return <><PageHeading title="Workspace settings" description="A public fixture demo and a separate private evaluation workspace."/>
    <div className="panel panel-body max-w-2xl">
      <h2 className="font-semibold">{persistent ? "Private account workspace" : "Public fixture demo"}</h2>
      <p className="muted text-sm mt-3">{persistent ? "Runs and reviews are saved in your account's Postgres records. Row-level security isolates your data. Export and delete old runs when you reach the 50-run storage limit." : "Synthetic evaluations execute in this browser without an evaluation API or model call. Demo runs and reviews are stored only here, with a limit of 8 runs. Export or delete runs from their detail page."}</p>
      {email && <div className="mt-5"><p className="text-sm">Signed in as {email}</p><div className="flex gap-3 flex-wrap mt-4">
        <button className="button" onClick={() => switchMode(persistent ? "demo" : "account")}>{persistent ? "Open public demo" : "Open private workspace"}</button>
        <button className="button" disabled={busy} onClick={async () => { setBusy(true); setMessage(""); try { const result = await client?.auth.signOut(); if (result?.error) throw result.error; } catch { setMessage("Sign out failed. Check your connection and retry."); } finally { setBusy(false); } }}>Sign out</button>
      </div></div>}
    </div>
    {!email && <div className="panel panel-body max-w-2xl mt-5"><h2 className="font-semibold">Private workspace sign-in</h2>{accountAvailable ? <form onSubmit={async e => {
      e.preventDefault(); if (!client) return; setBusy(true); setMessage(""); const data = new FormData(e.currentTarget);
      try { const result = await client.auth.signInWithPassword({ email: String(data.get("email")), password: String(data.get("password")) }); if (result.error) throw result.error; }
      catch { setMessage("Sign in failed. Check your credentials, connection, and account status."); }
      finally { setBusy(false); }
    }}><label className="field">Email<input type="email" name="email" autoComplete="username" required/></label><label className="field">Password<input name="password" type="password" autoComplete="current-password" required/></label><button className="button primary mt-5" disabled={busy || !client}>{busy ? "Signing in…" : "Sign in"}</button><p className="muted text-xs mt-4">Accounts are provisioned by the project administrator. Public signup is disabled. Your browser demo history is kept separate from your account.</p></form> : <p className="muted text-sm mt-3">Private account storage is not configured for this deployment. The public fixture demo is fully available. Hosted database setup status is documented in the project release report.</p>}</div>}
    <p role="status" className="error-text mt-3">{message}</p>
    <div className="notice mt-5 max-w-2xl">Live inference is disabled unless the administrator explicitly configures it. Provider credentials stay on the server. Model-grader assessment is unavailable; human review is labeled separately.</div>
  </>;
}
