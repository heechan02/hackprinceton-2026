import { z } from "zod";
import { analyzeImage } from "./client";

const MedicationResultSchema = z.object({
  compartmentEmptied: z.boolean(),
  pillCountRemoved: z.number().int().min(0),
  confidence: z.enum(["low", "med", "high"]),
  notes: z.string(),
});

export type MedicationResult = z.infer<typeof MedicationResultSchema>;

export interface Prescription {
  medicationName: string;
  dosage: string;
  scheduledTime?: string;
  pillsPerDose?: number;
}

export async function verifyMedication(
  imageBase64: string,
  prescription: Prescription,
): Promise<MedicationResult> {
  const prompt = `You are analyzing a photo of a pill organizer compartment.

Prescription context:
- Medication: ${prescription.medicationName}
- Dosage: ${prescription.dosage}
${prescription.scheduledTime ? `- Scheduled time: ${prescription.scheduledTime}` : ""}
${prescription.pillsPerDose !== undefined ? `- Expected pills per dose: ${prescription.pillsPerDose}` : ""}

Determine:
1. Whether the compartment appears to have been emptied (taken)
2. How many pills appear to have been removed (best estimate based on empty space or visible pills)
3. Your confidence level in this assessment
4. Any notes about what you observe (lighting, angle issues, unusual findings)

Return JSON with this exact shape:
{
  "compartmentEmptied": boolean,
  "pillCountRemoved": number,
  "confidence": "low" | "med" | "high",
  "notes": string
}`;

  return analyzeImage({
    imageBase64,
    prompt,
    schema: MedicationResultSchema,
  });
}
