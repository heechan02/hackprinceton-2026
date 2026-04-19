"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ExternalLink, RefreshCw } from "lucide-react";

const MERCHANT_IDS = [19]; // DoorDash

export default function KnotActions({
  alreadyLinked,
  txnCount,
}: {
  alreadyLinked: boolean;
  txnCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ total: number; flagged: number } | null>(null);

  async function syncNow() {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/knot/sync", { method: "POST" });
      const data = await res.json() as { ok: boolean; total: number; flagged: number; reclassified?: number; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Sync failed");
      setSyncResult({ total: data.total + (data.reclassified ?? 0), flagged: data.flagged });
      router.refresh(); // re-fetch server data so txnCount updates
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSyncing(false);
    }
  }

  async function openKnotLink() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/knot/session", { method: "POST" });
      const data = await res.json() as { ok: boolean; sessionId?: string; error?: string };
      if (!data.ok || !data.sessionId) throw new Error(data.error ?? "Failed to get session");

      const KnotapiJS = (await import("knotapi-js")).default;
      const knotapi = new KnotapiJS();
      knotapi.open({
        sessionId: data.sessionId,
        clientId: process.env.NEXT_PUBLIC_KNOT_CLIENT_ID ?? "",
        environment: "production",
        merchantIds: MERCHANT_IDS,
        entryPoint: "onboarding",
        useCategories: true,
        useSearch: true,
        onSuccess: () => { setLoading(false); router.refresh(); },
        onExit: () => setLoading(false),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (knotError: any) => { setLoading(false); setError(typeof knotError === 'string' ? knotError : knotError?.message ?? JSON.stringify(knotError) ?? "Unknown error"); },
        onEvent: (event: any) => console.log("[knot] event:", event),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="rounded-lg bg-white border border-stone-200 p-8 shadow-sm max-w-md w-full space-y-6">
        <div className="flex items-center gap-3">
          <CreditCard size={24} strokeWidth={1.75} className="text-stone-500" />
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Bill Protector</h1>
            <p className="text-sm text-stone-500 mt-0.5">Link a merchant account to monitor transactions</p>
          </div>
        </div>

        {alreadyLinked && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-700 font-medium">Account linked</p>
            <p className="text-sm text-green-700 mt-1">
              {txnCount} transaction{txnCount !== 1 ? "s" : ""} monitored so far.
            </p>
          </div>
        )}

        {syncResult && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-700 font-medium">Sync complete</p>
            <p className="text-sm text-blue-700 mt-1">
              {syncResult.total} new transaction{syncResult.total !== 1 ? "s" : ""} processed
              {syncResult.flagged > 0 ? `, ${syncResult.flagged} flagged` : ""}.
            </p>
          </div>
        )}

        {!alreadyLinked && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-700 leading-relaxed">
              Transactions are checked against spending rules you set during onboarding.
              Anything flagged sends an iMessage alert to the caretaker for approval.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={openKnotLink}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-stone-900 text-white px-4 py-3 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
          >
            <ExternalLink size={16} strokeWidth={1.75} />
            {loading ? "Opening Knot Link…" : alreadyLinked ? "Link Another Account" : "Link Merchant Account"}
          </button>
          <button
            onClick={syncNow}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw size={16} strokeWidth={1.75} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing…" : "Sync Transactions Now"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}

        <p className="text-xs text-stone-400 text-center">
          Powered by Knot · Transactions monitored in real-time
        </p>
      </div>
    </main>
  );
}
