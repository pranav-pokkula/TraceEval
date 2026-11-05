// JSON Schema is the canonical output contract. AJV never coerces or removes fields.
export const outputSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object", additionalProperties: false, required: ["answer", "abstained", "claims"],
  properties: {
    answer: { type: "string", minLength: 1, maxLength: 8000, pattern: "\\S" },
    abstained: { type: "boolean" },
    claims: { type: "array", maxItems: 30, items: {
      type: "object", additionalProperties: false, required: ["text", "citations"],
      properties: {
        text: { type: "string", minLength: 1, maxLength: 2000, pattern: "\\S" },
        citations: { type: "array", maxItems: 10, items: {
          type: "object", additionalProperties: false, required: ["documentId", "start", "end", "quote"],
          properties: { documentId: { type: "string", minLength: 1 }, start: { type: "integer", minimum: 0 },
            end: { type: "integer", minimum: 1 }, quote: { type: "string", minLength: 1, maxLength: 4000, pattern: "\\S" } }
        } }
      }
    } }
  },
  allOf: [{ if: { properties: { abstained: { const: true } } }, then: { properties: { claims: { maxItems: 0 } } }, else: { properties: { claims: { minItems: 1 } } } }]
} as const;
