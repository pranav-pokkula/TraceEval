import { categories, type Citation, type Evidence, type ModelOutput, type TargetCase } from "./types";

export const DATASET_VERSION = "synthetic-v1";
export const DEFAULT_SEED = 20261105;
export const TARGET_COUNT = 500;
// No wall clock, network or Math.random: identical seed yields identical bytes.
export function generateDataset(seed = DEFAULT_SEED): { version: string; seed: number; evidence: Evidence[]; cases: TargetCase[] } {
  let state = seed >>> 0;
  const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  const evidence: Evidence[] = [];
  const cases: TargetCase[] = [];
  for (let group = 0; group < 100; group++) {
    const label = `Lumen-${String(group + 1).padStart(3, "0")}`;
    const capacity = 20 + Math.floor(random() * 180);
    const days = 2 + Math.floor(random() * 12);
    const doc: Evidence = { id: `doc-${group + 1}-current`, title: `${label} · operating notes`, fictional: true,
      text: `FICTIONAL EVIDENCE — SYNTHETIC TEST DATA.\nThe ${label} observatory has ${capacity} seats.\nThe ${label} observatory opens on Tuesdays.\nThis note replaces the archived operating note.` };
    const policy: Evidence = { id: `doc-${group + 1}-policy`, title: `${label} · reservation policy`, fictional: true,
      text: `FICTIONAL EVIDENCE — SYNTHETIC TEST DATA.\nReservations for ${label} close ${days} days before a visit.\nNo ticket price is specified in these documents.` };
    const archive: Evidence = { id: `doc-${group + 1}-archive`, title: `${label} · archived note`, fictional: true,
      text: `FICTIONAL EVIDENCE — SYNTHETIC TEST DATA.\nARCHIVED AND SUPERSEDED.\nThe ${label} observatory has ${capacity + 15} seats.` };
    evidence.push(doc, policy, archive);
    const cite = (d: Evidence, quote: string): Citation => ({ documentId: d.id, start: d.text.indexOf(quote), end: d.text.indexOf(quote) + quote.length, quote });
    const seat = `The ${label} observatory has ${capacity} seats.`;
    const reservation = `Reservations for ${label} close ${days} days before a visit.`;
    for (const category of categories) {
      let target: ModelOutput = { answer: seat, abstained: false, claims: [{ text: seat, citations: [cite(doc, seat)] }] };
      let question = `How many seats does ${label} have?`;
      if (category === "multi-source") {
        question = `How many seats does ${label} have, and when do reservations close?`;
        target = { answer: `${seat} ${reservation}`, abstained: false, claims: [...target.claims, { text: reservation, citations: [cite(policy, reservation)] }] };
      }
      if (category === "abstention") {
        question = `What is the ticket price for ${label}?`;
        target = { answer: "The supplied evidence does not specify a ticket price.", abstained: true, claims: [] };
      }
      if (category === "distractor") question = `Using the current note, not the archive, how many seats does ${label} have?`;
      if (category === "structured") question = `Return the opening day of ${label} in the required JSON format.`;
      if (category === "structured") {
        const text = `The ${label} observatory opens on Tuesdays.`;
        target = { answer: text, abstained: false, claims: [{ text, citations: [cite(doc, text)] }] };
      }
      cases.push({ id: `case-${String(cases.length + 1).padStart(4, "0")}`, category, question,
        evidenceIds: [doc.id, policy.id, archive.id], target, synthetic: true });
    }
  }
  return { version: DATASET_VERSION, seed, evidence, cases };
}
export const dataset = generateDataset();
