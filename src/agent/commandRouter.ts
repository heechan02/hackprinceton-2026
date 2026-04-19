import { adminClient } from "@/services/supabase/admin";
import { inventoryAssessment } from "@/services/gemini/pantry";
import type { EventKind, EventStatus } from "@/types/db";

export async function route(input: {
  from: string;
  text: string;
}): Promise<string> {
  const t = input.text.trim();

  // status / how is mom|dad|her|him|they
  if (/^status|how is (mom|dad|her|him|they)/i.test(t)) {
    try {
      const { data: events, error } = await adminClient
        .from("events")
        .select("kind, status, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      if (!events || events.length === 0) return "No events recorded yet.";
      const lines = events.map((e) => {
        const ts = new Date(e.created_at).toLocaleString();
        return `[${ts}] ${e.kind} — ${e.status}`;
      });
      return `Last 5 events:\n${lines.join("\n")}`;
    } catch (err) {
      return `Error fetching status: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // rules
  if (/^rules/i.test(t)) {
    try {
      const { data: rules, error } = await adminClient
        .from("spending_rules")
        .select("max_single_txn, daily_limit, blocked_categories");
      if (error) throw error;
      if (!rules || rules.length === 0) return "No spending rules configured.";
      const r = rules[0]!;
      const blocked =
        r.blocked_categories?.length
          ? r.blocked_categories.join(", ")
          : "none";
      return `Spending rules:\n• Max single txn: $${r.max_single_txn}\n• Daily limit: $${r.daily_limit}\n• Blocked categories: ${blocked}`;
    } catch (err) {
      return `Error fetching rules: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // reorder (bare) — assess last pantry snapshot and report low/empty items
  if (/^reorder$/i.test(t)) {
    try {
      // Get last pantry_check event with a snapshot_url
      const { data: events, error: evErr } = await adminClient
        .from("events")
        .select("snapshot_url, patient_id")
        .eq("kind", "pantry_check")
        .not("snapshot_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);
      if (evErr) throw evErr;
      const lastEvent = events?.[0];
      if (!lastEvent?.snapshot_url) return "No pantry snapshot available. Capture a pantry image first.";

      // Fetch image and convert to base64
      const imageRes = await fetch(lastEvent.snapshot_url);
      if (!imageRes.ok) throw new Error(`Failed to fetch snapshot: ${imageRes.statusText}`);
      const arrayBuf = await imageRes.arrayBuffer();
      const imageBase64 = Buffer.from(arrayBuf).toString("base64");

      // Load inventory items for the patient
      const { data: inventoryItems, error: invErr } = await adminClient
        .from("inventory_items")
        .select("name")
        .eq("patient_id", lastEvent.patient_id);
      if (invErr) throw invErr;

      const items = (inventoryItems ?? []).map((i) => ({ name: i.name }));
      if (items.length === 0) return "No inventory items configured.";

      const assessment = await inventoryAssessment(imageBase64, items);
      const needReorder = assessment.filter(
        (r) => r.stockLevel === "empty" || r.stockLevel === "low"
      );

      if (needReorder.length === 0) return "Pantry looks well-stocked — nothing to reorder.";

      const itemList = needReorder.map((r) => `${r.item} (${r.stockLevel})`).join(", ");
      return `Pantry reorder triggered for: ${itemList}`;
    } catch (err) {
      return `Error during reorder: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // reorder <item>
  const reorderMatch = t.match(/^reorder\s+(.+)/i);
  if (reorderMatch) {
    const item = reorderMatch[1]!.trim();
    try {
      // Get active patient
      const { data: patients } = await adminClient
        .from("patients")
        .select("id")
        .limit(1);
      const patientId = patients?.[0]?.id;
      if (!patientId) return "No patient configured.";
      await adminClient.from("events").insert({
        patient_id: patientId,
        kind: "reorder" as EventKind,
        status: "pending" as EventStatus,
        payload: { item },
      });
      return `Ok, queued reorder for "${item}" — pending review.`;
    } catch (err) {
      return `Error queuing reorder: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // approve <id>
  const approveMatch = t.match(/^approve\s+(\w+)/i);
  if (approveMatch) {
    const id = approveMatch[1]!;
    try {
      const { data, error } = await adminClient
        .from("events")
        .update({ status: "approved" as EventStatus })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) return `No event found with id ${id}.`;
      return `✓ Approved.`;
    } catch (err) {
      return `Error approving: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // block <id>
  const blockMatch = t.match(/^block\s+(\w+)/i);
  if (blockMatch) {
    const id = blockMatch[1]!;
    try {
      const { data, error } = await adminClient
        .from("events")
        .update({ status: "blocked" as EventStatus })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) return `No event found with id ${id}.`;
      return `✗ Blocked.`;
    } catch (err) {
      return `Error blocking: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return "Try: status, rules, approve <id>, block <id>, reorder <item>";
}
