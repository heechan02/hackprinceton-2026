"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/services/supabase/client";
import {
  Activity,
  Pill,
  ShoppingCart,
  CreditCard,
} from "lucide-react";

type EventKind =
  | "med_check"
  | "pantry_check"
  | "reorder"
  | "reorder_placed"
  | "reorder_pending_approval"
  | "txn_flagged"
  | "txn_ok"
  | "system";

type EventStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "approved"
  | "blocked"
  | "failed";

export interface EventRow {
  id: string;
  kind: EventKind;
  status: EventStatus;
  payload: Record<string, unknown> | null;
  snapshot_url: string | null;
  created_at: string;
}

function statusColor(status: EventStatus): string {
  switch (status) {
    case "completed":
    case "approved":
      return "bg-green-50 text-green-700";
    case "pending":
    case "in_progress":
      return "bg-amber-50 text-amber-700";
    case "blocked":
    case "failed":
      return "bg-red-50 text-red-700";
    default:
      return "bg-stone-100 text-stone-600";
  }
}

function kindLabel(kind: EventKind): string {
  switch (kind) {
    case "med_check":
      return "Medication Check";
    case "pantry_check":
      return "Pantry Check";
    case "reorder":
    case "reorder_placed":
      return "Reorder";
    case "reorder_pending_approval":
      return "Reorder (Pending Approval)";
    case "txn_flagged":
      return "Transaction Flagged";
    case "txn_ok":
      return "Transaction OK";
    case "system":
      return "System";
  }
}

function KindIcon({ kind }: { kind: EventKind }) {
  const cls = "shrink-0";
  switch (kind) {
    case "med_check":
      return <Pill size={20} strokeWidth={1.75} className={cls} />;
    case "pantry_check":
    case "reorder":
    case "reorder_placed":
    case "reorder_pending_approval":
      return <ShoppingCart size={20} strokeWidth={1.75} className={cls} />;
    case "txn_flagged":
    case "txn_ok":
      return <CreditCard size={20} strokeWidth={1.75} className={cls} />;
    default:
      return <Activity size={20} strokeWidth={1.75} className={cls} />;
  }
}

function getEventSummary(event: EventRow): string {
  const p = event.payload as Record<string, unknown> | null;
  if (!p) return kindLabel(event.kind);
  if (typeof p.summary === "string") return p.summary;
  if (typeof p.message === "string") return p.message;
  return kindLabel(event.kind);
}

function formatTime(iso: string, timezone: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface EventsFeedProps {
  initialEvents: EventRow[];
  timezone: string;
  dateLabel: string;
}

export default function EventsFeed({
  initialEvents,
  timezone,
  dateLabel,
}: EventsFeedProps) {
  const [events, setEvents] = useState<EventRow[]>(initialEvents);

  useEffect(() => {
    const channel = supabaseClient
      .channel("events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          setEvents((prev) => [payload.new as EventRow, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "events" },
        (payload) => {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === (payload.new as EventRow).id
                ? (payload.new as EventRow)
                : e
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  return (
    <div className="rounded-lg bg-white border border-stone-200 shadow-sm">
      <div className="px-6 py-4 border-b border-stone-200">
        <p className="text-base font-medium text-stone-900">Today&apos;s Events</p>
        <p className="text-sm text-stone-500">{dateLabel}</p>
      </div>
      {events.length === 0 ? (
        <div className="px-6 py-8 text-center text-stone-500 text-base">
          No events recorded today.
        </div>
      ) : (
        <ul className="divide-y divide-stone-100">
          {events.map((event) => (
            <li key={event.id} className="px-6 py-4 flex items-start gap-3">
              <span className="text-stone-400 mt-0.5">
                <KindIcon kind={event.kind} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base text-stone-900 font-medium">
                    {kindLabel(event.kind)}
                  </span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(event.status)}`}
                  >
                    {event.status}
                  </span>
                </div>
                <p className="text-base text-stone-700 leading-relaxed mt-0.5">
                  {getEventSummary(event)}
                </p>
                <p className="text-sm text-stone-500 mt-0.5">
                  {formatTime(event.created_at, timezone)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
