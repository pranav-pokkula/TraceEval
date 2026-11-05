import type { Metadata } from "next";
import { WorkspaceProvider } from "@/components/workspace";
import { Shell } from "@/components/shell";
import { liveConfigured } from "@/lib/live.server";
import "./globals.css";
export const metadata: Metadata = { title: { default: "TraceEval — Evidence before confidence", template: "%s · TraceEval" }, description: "An inspectable evaluation workbench for structured answers and citations. Fictional evidence. Transparent limits." };
export const dynamic = "force-dynamic";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a href="#main" className="skip-link">Skip to content</a><WorkspaceProvider persistent={process.env.TRACEEVAL_STORAGE === "supabase"} liveEnabled={!!liveConfigured()}><Shell>{children}</Shell></WorkspaceProvider></body></html>;
}
