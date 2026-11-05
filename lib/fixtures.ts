import type { TargetCase } from "./types";
export function fixtureResponse(target: TargetCase, perturbed = false): string {
  const output = structuredClone(target.target);
  if (!perturbed) return JSON.stringify(output);
  switch (target.category) {
    case "direct": output.claims[0].citations[0].documentId = "doc-does-not-exist"; break;
    case "multi-source": output.claims[0].citations[0].quote = "This quotation was invented."; break;
    case "abstention": return JSON.stringify({ answer: 42, abstained: "yes", claims: [] });
    case "distractor": output.claims[0].citations = []; break;
    case "structured":
      // Valid citation, unsupported claim: deliberately passes deterministic checks.
      output.answer = "The observatory opens on Sundays.";
      output.claims[0].text = output.answer;
      break;
  }
  return JSON.stringify(output);
}
