import { z } from "zod";
import { analyzeImage } from "./client";

const StockLevelSchema = z.enum(["empty", "low", "ok", "full"]);

const InventoryItemResultSchema = z.object({
  item: z.string(),
  stockLevel: StockLevelSchema,
  confidence: z.enum(["low", "med", "high"]),
});

const InventoryAssessmentSchema = z.array(InventoryItemResultSchema);

export type InventoryItemResult = z.infer<typeof InventoryItemResultSchema>;

export interface PantryItem {
  name: string;
  unit?: string;
}

export async function inventoryAssessment(
  imageBase64: string,
  items: PantryItem[],
): Promise<InventoryItemResult[]> {
  const itemList = items
    .map((i) => `- ${i.name}${i.unit ? ` (${i.unit})` : ""}`)
    .join("\n");

  const prompt = `You are analyzing a photo of a pantry or refrigerator.

Assess the stock level for each of the following items:
${itemList}

For each item, determine:
- stockLevel: "empty" (none visible), "low" (less than ~25% of typical supply), "ok" (25–75%), "full" (more than 75% or well-stocked)
- confidence: "low" (item not clearly visible), "med" (partially visible), "high" (clearly visible)

Return a JSON array with one entry per item in the same order:
[
  { "item": string, "stockLevel": "empty"|"low"|"ok"|"full", "confidence": "low"|"med"|"high" },
  ...
]`;

  return analyzeImage({
    imageBase64,
    prompt,
    schema: InventoryAssessmentSchema,
  });
}
