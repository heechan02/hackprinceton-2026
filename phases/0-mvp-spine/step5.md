# Step 5: Gemini structured-JSON wrapper

## Task

Implement `src/services/gemini/client.ts` with a generic `analyzeImage<T>({ imageBase64, prompt, schema: ZodSchema<T> }): Promise<T>` that:

1. Calls gemini-robotics-er-1.5 (or gemini-2.5-flash if ER unavailable)
2. Requests JSON output matching the schema
3. Parses through Zod; on parse failure, retries once; on second failure, throws typed error

Implement `src/services/gemini/medication.ts` exporting `verifyMedication(imageBase64, prescription)`: returns `{ compartmentEmptied: boolean, pillCountRemoved: number, confidence: 'low'|'med'|'high', notes: string }`.

Implement `src/services/gemini/pantry.ts` exporting `inventoryAssessment(imageBase64, items)`: returns array of `{ item: string, stockLevel: 'empty'|'low'|'ok'|'full', confidence }`.

## AC

- Tests in `__tests__/` cover schema-valid response, schema-invalid response (retry behavior), and API failure
- Both functions work against a real Gemini key on a test image
- No `z.any()` in schemas
