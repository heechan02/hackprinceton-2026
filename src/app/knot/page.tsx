import { adminClient } from "@/services/supabase/admin";
import KnotActions from "./KnotActions";

export default async function KnotPage() {
  const { data: patients } = await adminClient.from("patients").select("id").limit(1);
  const patientId = patients?.[0]?.id ?? null;

  const { count } = patientId
    ? await adminClient
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patientId)
    : { count: 0 };

  const alreadyLinked = (count ?? 0) > 0;

  return <KnotActions alreadyLinked={alreadyLinked} txnCount={count ?? 0} />;
}
