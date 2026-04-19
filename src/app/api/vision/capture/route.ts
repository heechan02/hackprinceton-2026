import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/services/supabase/admin";
import { verifyMedication } from "@/services/gemini/medication";
import { inventoryAssessment } from "@/services/gemini/pantry";
import { enqueueMessage } from "@/services/outbox";
import { syncCart, checkout } from "@/services/knot/shopping";
import { env } from "@/lib/env";

const BodySchema = z.object({
  imageBase64: z.string().min(1),
});

const VALID_KINDS = ["pill", "pantry"] as const;
type CamKind = (typeof VALID_KINDS)[number];

function toImageBuffer(imageBase64: string): Buffer {
  const raw = imageBase64.startsWith("data:")
    ? imageBase64.split(",")[1] ?? imageBase64
    : imageBase64;
  return Buffer.from(raw, "base64");
}

export async function POST(req: NextRequest) {
  try {
    const kind = req.nextUrl.searchParams.get("kind");
    if (!VALID_KINDS.includes(kind as CamKind)) {
      return NextResponse.json({ ok: false, error: "Invalid kind. Must be 'pill' or 'pantry'." }, { status: 400 });
    }

    const body = BodySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ ok: false, error: "imageBase64 is required." }, { status: 400 });
    }

    const { imageBase64 } = body.data;
    const timestamp = Date.now();

    // Load patient
    const { data: patients, error: pErr } = await adminClient
      .from("patients")
      .select("*")
      .limit(1);
    if (pErr || !patients?.length) {
      throw new Error("No patient found: " + (pErr?.message ?? "empty result"));
    }
    const patient = patients[0]!;

    if (kind === "pill") {
      // Load prescriptions
      const { data: prescriptions, error: rxErr } = await adminClient
        .from("prescriptions")
        .select("*")
        .eq("patient_id", patient.id);
      if (rxErr || !prescriptions?.length) {
        throw new Error("No prescriptions found: " + (rxErr?.message ?? "empty result"));
      }

      // Find prescription with a dose_time within ±60 minutes of now
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      let prescription = prescriptions[0]!;
      outer: for (const rx of prescriptions) {
        for (const t of rx.dose_times ?? []) {
          const parts = (t as string).split(":");
          const h = parseInt(parts[0] ?? "0", 10);
          const m = parseInt(parts[1] ?? "0", 10);
          const rxMinutes = h * 60 + m;
          if (Math.abs(rxMinutes - nowMinutes) <= 60) {
            prescription = rx;
            break outer;
          }
        }
      }

      const geminiResult = await verifyMedication(imageBase64, {
        medicationName: prescription.name,
        dosage: `${prescription.compartments_per_dose} compartment(s)`,
        scheduledTime: prescription.dose_times?.[0],
        pillsPerDose: prescription.compartments_per_dose,
      });

      // Upload snapshot
      const snapshotPath = `events/${timestamp}-pill.jpg`;
      const { error: uploadErr } = await adminClient.storage
        .from("snapshots")
        .upload(snapshotPath, toImageBuffer(imageBase64), { contentType: "image/jpeg", upsert: true });

      let snapshotUrl: string | null = null;
      if (uploadErr) {
        console.warn("[capture] Snapshot upload failed:", uploadErr.message);
      } else {
        const { data: urlData } = adminClient.storage
          .from("snapshots")
          .getPublicUrl(snapshotPath);
        snapshotUrl = urlData.publicUrl;
      }

      // Insert event
      const { data: event, error: evErr } = await adminClient
        .from("events")
        .insert({
          patient_id: patient.id,
          kind: "med_check",
          status: "completed",
          payload: geminiResult as unknown as Record<string, unknown>,
          snapshot_url: snapshotUrl,
        })
        .select("id")
        .single();
      if (evErr) throw new Error("Failed to insert event: " + evErr.message);

      const takenStr = geminiResult.compartmentEmptied ? "taken ✓" : "not taken ✗";
      const summary = `${prescription.name}: compartment ${takenStr} (confidence: ${geminiResult.confidence}). ${geminiResult.notes}`;

      await enqueueMessage({
        phone: env.CARETAKER_PHONE,
        body: summary,
        attachmentPath: snapshotUrl ?? undefined,
      });

      return NextResponse.json({ ok: true, eventId: event.id, summary });
    }

    // kind === "pantry"
    const { data: inventoryItems, error: invErr } = await adminClient
      .from("inventory_items")
      .select("*")
      .eq("patient_id", patient.id);
    if (invErr) throw new Error("Failed to load inventory: " + invErr.message);

    const items = (inventoryItems ?? []).map((i) => ({ name: i.name }));
    const geminiResult = await inventoryAssessment(imageBase64, items);

    const snapshotPath = `events/${timestamp}-pantry.jpg`;
    const { error: uploadErr } = await adminClient.storage
      .from("snapshots")
      .upload(snapshotPath, toImageBuffer(imageBase64), { contentType: "image/jpeg", upsert: true });

    let snapshotUrl: string | null = null;
    if (uploadErr) {
      console.warn("[capture] Snapshot upload failed:", uploadErr.message);
    } else {
      const { data: urlData } = adminClient.storage
        .from("snapshots")
        .getPublicUrl(snapshotPath);
      snapshotUrl = urlData.publicUrl;
    }

    const { data: event, error: evErr } = await adminClient
      .from("events")
      .insert({
        patient_id: patient.id,
        kind: "pantry_check",
        status: "completed",
        payload: geminiResult as unknown as Record<string, unknown>,
        snapshot_url: snapshotUrl,
      })
      .select("id")
      .single();
    if (evErr) throw new Error("Failed to insert event: " + evErr.message);

    const lowResults = geminiResult.filter(
      (r) => r.stockLevel === "empty" || r.stockLevel === "low"
    );

    const lowItemNames = lowResults.map((r) => r.item);
    const summary =
      lowItemNames.length > 0
        ? `Pantry check: low/empty — ${lowItemNames.join(", ")}`
        : "Pantry check: all items stocked ✓";

    await enqueueMessage({
      phone: env.CARETAKER_PHONE,
      body: summary,
      attachmentPath: snapshotUrl ?? undefined,
    });

    // Reorder logic for low/empty items
    if (lowResults.length > 0) {
      // Load spending rules
      const { data: spendingRules } = await adminClient
        .from("spending_rules")
        .select("max_single_txn")
        .eq("patient_id", patient.id)
        .limit(1);
      const maxSingleTxn: number = spendingRules?.[0]?.max_single_txn ?? 100;

      // Build cart items from inventory_items
      const cartItems = lowResults
        .map((r) => {
          const inv = (inventoryItems ?? []).find((i) => i.name === r.item);
          if (!inv) return null;
          const currentQty = r.stockLevel === "empty" ? 0 : 1;
          const reorderQty = Math.max(inv.typical_qty - currentQty, 1);
          return {
            product_id: inv.id as string,
            name: inv.name as string,
            quantity: reorderQty,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      if (cartItems.length > 0) {
        // Estimate total (unit_price not in inventory_items; use reorder_threshold as proxy cost)
        const estimatedTotal = cartItems.reduce((sum, ci) => {
          const inv = (inventoryItems ?? []).find((i) => i.id === ci.product_id);
          return sum + ci.quantity * (inv?.reorder_threshold ?? 5);
        }, 0);

        const needsApproval = estimatedTotal > 2 * maxSingleTxn;

        if (needsApproval) {
          const reorderEvent = await adminClient
            .from("events")
            .insert({
              patient_id: patient.id,
              kind: "reorder_pending_approval" as "reorder",
              status: "pending",
              payload: { items: cartItems, estimatedTotal } as unknown as Record<string, unknown>,
            })
            .select("id")
            .single();
          if (reorderEvent.error) {
            console.warn("[capture] Failed to insert reorder_pending_approval event:", reorderEvent.error.message);
          }
          await enqueueMessage({
            phone: env.CARETAKER_PHONE,
            body: `Pantry reorder needs approval (est. $${estimatedTotal.toFixed(2)} > 2× $${maxSingleTxn} limit). Items: ${cartItems.map((c) => `${c.name} ×${c.quantity}`).join(", ")}. Reply "approve ${reorderEvent.data?.id}" to confirm.`,
          });
        } else {
          try {
            const { cartId } = await syncCart(cartItems);
            const { orderId } = await checkout(cartId);
            const reorderEvent = await adminClient
              .from("events")
              .insert({
                patient_id: patient.id,
                kind: "reorder_placed" as "reorder",
                status: "completed",
                payload: { items: cartItems, cartId, orderId } as unknown as Record<string, unknown>,
              })
              .select("id")
              .single();
            if (reorderEvent.error) {
              console.warn("[capture] Failed to insert reorder_placed event:", reorderEvent.error.message);
            }
            await enqueueMessage({
              phone: env.CARETAKER_PHONE,
              body: `Pantry reorder placed ✓ (order ${orderId}): ${cartItems.map((c) => `${c.name} ×${c.quantity}`).join(", ")}`,
            });
          } catch (reorderErr) {
            const msg = reorderErr instanceof Error ? reorderErr.message : String(reorderErr);
            console.error("[capture] Reorder failed:", msg);
            await adminClient.from("events").insert({
              patient_id: patient.id,
              kind: "reorder_placed" as "reorder",
              status: "failed",
              payload: { items: cartItems, error: msg } as unknown as Record<string, unknown>,
            });
          }
        }
      }
    }

    return NextResponse.json({ ok: true, eventId: event.id, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[capture] Error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
