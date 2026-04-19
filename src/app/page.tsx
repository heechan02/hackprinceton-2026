import { redirect } from "next/navigation";
import { adminClient } from "@/services/supabase/admin";

export default async function Home() {
  const { data: patient } = await adminClient
    .from("patients")
    .select("id")
    .limit(1)
    .single();

  if (patient) {
    redirect("/dashboard");
  } else {
    redirect("/onboarding");
  }
}
