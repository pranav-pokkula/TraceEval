import { mkdir, writeFile } from "node:fs/promises";
import { dataset } from "../lib/dataset";
import { executeRun } from "../lib/runner";
import { summarize } from "../lib/metrics";
async function main() {
  await mkdir("artifacts/evaluations", { recursive: true });
  const receipts = [];
  for (const adapter of ["fixture", "perturbed"] as const) {
    const run = await executeRun({ name: `${adapter} full synthetic suite`, adapter, caseIds: dataset.cases.map(c => c.id) });
    const summary = summarize(run);
    const receipt = { adapter, ...summary, runId: run.id, createdAt: run.createdAt, datasetHash: run.datasetHash, evaluatorVersion: run.evaluatorVersion, factualSupport: "Not human-reviewed. No model benchmark claim." };
    await writeFile(`artifacts/evaluations/${adapter}.json`, JSON.stringify(run, null, 2) + "\n");
    receipts.push(receipt); console.log(JSON.stringify(receipt));
  }
  await writeFile("artifacts/evaluations/summary.json", JSON.stringify(receipts, null, 2) + "\n");
}
main().catch(() => { console.error("Fixture evaluation failed."); process.exitCode = 1; });
