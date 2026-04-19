import { redirect } from "next/navigation";
import { adminClient } from "@/services/supabase/admin";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const { data: patient } = await adminClient
      .from("patients")
      .select("id")
      .limit(1)
      .single();

    if (patient) {
      redirect("/dashboard");
    } else {
      redirect("/demo-video");
    }
  } catch {
    redirect("/demo-video");
  }
}
