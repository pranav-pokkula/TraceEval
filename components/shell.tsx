"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, Layers3, Files, GitCompareArrows, BookOpen, Settings2, ArrowUpRight, CircleDot, X } from "lucide-react";
import { useWorkspace } from "./workspace";
const links = [ ["/", "Overview", LayoutDashboard], ["/runs", "Evaluations", Activity], ["/dataset", "Dataset", Layers3], ["/evidence", "Evidence library", Files], ["/compare", "Compare runs", GitCompareArrows] ] as const;
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const { persistent, error, setError, email, switchMode } = useWorkspace();
  return <div className="app-shell">
    <aside className="sidebar"><Link href="/" className="brand"><span className="brand-mark"><Activity size={22}/></span>TraceEval<span className="version">v1</span></Link>
      <div className="workspace-label"><span className="workspace-avatar">T</span><div>Evaluation workspace<small>Fictional evidence suite</small></div></div>
      <div className="nav-label">WORKSPACE</div><nav aria-label="Main navigation">{links.map(([href, label, Icon]) => <Link key={href} href={href} className={`nav-link ${path === href || (href === "/runs" && path.startsWith("/runs/")) ? "active" : ""}`}><Icon size={17}/>{label}{href === "/dataset" && <span className="nav-count">500</span>}</Link>)}</nav>
      <div className="nav-label mt-8">RESOURCES</div><nav aria-label="Resources"><Link className={`nav-link ${path === "/methodology" ? "active" : ""}`} href="/methodology"><BookOpen size={17}/>Methodology</Link><Link className={`nav-link ${path === "/settings" ? "active" : ""}`} href="/settings"><Settings2 size={17}/>Settings</Link></nav>
      <div className="sidebar-bottom"><div className="mode-card"><CircleDot size={15}/><strong>{persistent ? "Private workspace" : "Public fixture demo"}</strong><p>{persistent ? "Private, account-owned runs." : "Runs stay in this browser."}</p></div>{email && <button className="text-link mt-3" onClick={() => switchMode(persistent ? "demo" : "account")}>{persistent ? "Switch to public demo" : "Switch to private workspace"}</button>}<Link href="/methodology" className="text-xs flex items-center justify-between muted mt-4">Know what the scores mean<ArrowUpRight size={14}/></Link></div>
    </aside>
    <div className="main-shell"><header className="topbar"><span>Workspace <span className="mx-2 text-stone-300">/</span> <strong>{path.startsWith("/runs/") ? "Evaluation detail" : [...links, ["/methodology", "Methodology"], ["/settings", "Settings"]].find(([href]) => href === path)?.[1] ?? "TraceEval"}</strong></span><span className="badge"><span className="status-dot"/>Synthetic dataset</span></header>
      <main id="main" className="main-content">{error && <div role="alert" className="error-banner">{error}<button aria-label="Dismiss error" onClick={() => setError("")}><X size={16}/></button></div>}{children}</main>
      <footer className="footer"><span>TraceEval <span className="mx-2">·</span> Evidence you can inspect.</span><span>500 synthetic targets <span className="mx-2">·</span> No real-world benchmark claims</span></footer>
    </div>
  </div>;
}
