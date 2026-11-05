import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dataset } from "../lib/dataset";
import { outputSchema } from "../lib/output-schema";
async function main() {
  const files: Record<string, string> = {
    "data/dataset.json": JSON.stringify(dataset, null, 2) + "\n",
    "data/output.schema.json": JSON.stringify(outputSchema, null, 2) + "\n",
    "data/manifest.json": JSON.stringify({ version: dataset.version, seed: dataset.seed, syntheticTargetCount: dataset.cases.length, fictionalDocumentCount: dataset.evidence.length, sha256: createHash("sha256").update(JSON.stringify(dataset)).digest("hex") }, null, 2) + "\n"
  };
  for (const doc of dataset.evidence.slice(0, 3)) files[`data/evidence/${doc.id}.md`] = `# ${doc.title}\n\n> Fictional sample evidence. Not a real organization or policy.\n> Citation offsets refer to the text field in dataset.json, excluding this Markdown wrapper.\n\n${doc.text}\n`;
  const checking = process.argv.includes("--check");
  if (!checking) await mkdir("data/evidence", { recursive: true });
  for (const [file, value] of Object.entries(files)) {
    if (checking) { if (await readFile(file, "utf8") !== value) throw new Error(`Generated artifact differs: ${file}`); }
    else await writeFile(file, value);
  }
  console.log(`${checking ? "Verified" : "Generated"} ${dataset.cases.length} synthetic target cases, ${dataset.evidence.length} fictional evidence documents. Seed ${dataset.seed}.`);
  console.log(files["data/manifest.json"]);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
