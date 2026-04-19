import { notFound } from "next/navigation";
import WebcamCapture from "@/components/cam/WebcamCapture";

const VALID_KINDS = ["pill", "pantry"] as const;
type CamKind = (typeof VALID_KINDS)[number];

export default async function CamPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;

  if (!VALID_KINDS.includes(kind as CamKind)) {
    notFound();
  }

  const camKind = kind as CamKind;
  const label = camKind === "pill" ? "Pill Organizer" : "Pantry";

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-start py-12 px-4">
      <div className="w-full max-w-xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">{label} Camera</h1>
          <p className="text-base text-stone-500 mt-1">
            Grant webcam access, then click "Capture & analyze" to run a check.
          </p>
        </div>

        <div className="rounded-lg bg-white border border-stone-200 p-6 shadow-sm">
          <WebcamCapture kind={camKind} auto={false} />
        </div>
      </div>
    </main>
  );
}
