export const categories = ["direct", "multi-source", "abstention", "distractor", "structured"] as const;
export type Category = typeof categories[number];
export type Evidence = { id: string; title: string; fictional: true; text: string };
export type Citation = { documentId: string; start: number; end: number; quote: string };
export type ModelOutput = { answer: string; abstained: boolean; claims: { text: string; citations: Citation[] }[] };
export type TargetCase = { id: string; category: Category; question: string; evidenceIds: string[]; target: ModelOutput; synthetic: true };
export type Check = { passed: boolean; issues: string[] };
export type Evaluation = {
  schema: Check; citations: Check | null; coverage: Check | null;
  deterministicPass: boolean;
  targetMatch: boolean;
  factualSupport: { source: "not-reviewed"; score: null };
};
export type CaseResult = { caseId: string; raw: string; evaluation: Evaluation; durationMs: number; error?: string };
export type Adapter = "fixture" | "perturbed" | "live";
export type Run = {
  id: string; name: string; adapter: Adapter; model: string; createdAt: string;
  datasetVersion: string; datasetHash: string; evaluatorVersion: string; seed: number;
  status: "completed" | "partial"; results: CaseResult[]; durationMs: number;
};
export type Review = { id: string; runId: string; caseId: string; source: "human"; score: number; rationale: string; createdAt: string };
