import { adminClient } from "@/services/supabase/admin";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pill,
  ShoppingCart,
  CreditCard,
  User,
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

interface EventRow {
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

function formatTime(iso: string, timezone: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(iso: string, timezone: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getEventSummary(event: EventRow): string {
  const p = event.payload as Record<string, unknown> | null;
  if (!p) return kindLabel(event.kind);
  if (typeof p.summary === "string") return p.summary;
  if (typeof p.message === "string") return p.message;
  return kindLabel(event.kind);
}

export default async function DashboardPage() {
  // Fetch patient (first one for MVP)
  const { data: patient } = await adminClient
    .from("patients")
    .select("*")
    .limit(1)
    .single();

  // Fetch today's events
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: events } = await adminClient
    .from("events")
    .select("*")
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch spending rules
  const { data: rules } = patient
    ? await adminClient
        .from("spending_rules")
        .select("*")
        .eq("patient_id", patient.id)
        .limit(1)
        .single()
    : { data: null };

  const eventRows: EventRow[] = (events ?? []) as EventRow[];
  const timezone = patient?.timezone ?? "America/New_York";
  const now = new Date().toISOString();

  // Quick stats
  const medChecks = eventRows.filter((e) => e.kind === "med_check").length;
  const pantryChecks = eventRows.filter((e) => e.kind === "pantry_check").length;
  const txnFlagged = eventRows.filter((e) => e.kind === "txn_flagged").length;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Page title */}
        <h1 className="text-3xl font-semibold text-stone-900">NannyCam Dashboard</h1>

        {/* 1. Patient header */}
        <div className="rounded-lg bg-white border border-stone-200 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <User size={20} strokeWidth={1.75} className="text-stone-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-base font-medium text-stone-900">
                {patient?.name ?? "—"}
              </p>
              <p className="text-sm text-stone-500">
                {timezone.replace("_", " ")}
              </p>
              <p className="text-sm text-stone-500 flex items-center gap-1.5">
                <Clock size={14} strokeWidth={1.75} />
                Last seen: {formatDate(now, timezone)},{" "}
                {formatTime(now, timezone)}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Today's events feed */}
        <div className="rounded-lg bg-white border border-stone-200 shadow-sm">
          <div className="px-6 py-4 border-b border-stone-200">
            <p className="text-base font-medium text-stone-900">
              Today&apos;s Events
            </p>
            <p className="text-sm text-stone-500">
              {formatDate(now, timezone)}
            </p>
          </div>
          {eventRows.length === 0 ? (
            <div className="px-6 py-8 text-center text-stone-500 text-base">
              No events recorded today.
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {eventRows.map((event) => (
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

        {/* 3. Quick stats */}
        <div className="rounded-lg bg-white border border-stone-200 p-6 shadow-sm">
          <p className="text-base font-medium text-stone-900 mb-4">
            Today at a Glance
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-stone-500">
                <Pill size={20} strokeWidth={1.75} />
                <span className="text-sm">Med Checks</span>
              </div>
              <span className="text-3xl font-semibold text-stone-900">
                {medChecks}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-stone-500">
                <ShoppingCart size={20} strokeWidth={1.75} />
                <span className="text-sm">Pantry Checks</span>
              </div>
              <span className="text-3xl font-semibold text-stone-900">
                {pantryChecks}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-stone-500">
                <AlertTriangle size={20} strokeWidth={1.75} />
                <span className="text-sm">Flagged Txns</span>
              </div>
              <span
                className={`text-3xl font-semibold ${txnFlagged > 0 ? "text-red-700" : "text-stone-900"}`}
              >
                {txnFlagged}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Active rules summary */}
        <div className="rounded-lg bg-white border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} strokeWidth={1.75} className="text-stone-500" />
            <p className="text-base font-medium text-stone-900">Spending Rules</p>
          </div>
          {rules ? (
            <dl className="space-y-3">
              <div className="flex justify-between items-baseline">
                <dt className="text-base text-stone-700">Max single transaction</dt>
                <dd className="text-base font-medium text-stone-900">
                  ${rules.max_single_txn.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between items-baseline">
                <dt className="text-base text-stone-700">Daily limit</dt>
                <dd className="text-base font-medium text-stone-900">
                  ${rules.daily_limit.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-base text-stone-700 mb-1">
                  Blocked categories
                </dt>
                <dd className="flex flex-wrap gap-2">
                  {(rules.blocked_categories as string[]).length === 0 ? (
                    <span className="text-sm text-stone-500">None</span>
                  ) : (
                    (rules.blocked_categories as string[]).map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700"
                      >
                        {cat}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-base text-stone-500">No spending rules configured.</p>
          )}
        </div>
      </div>
    </div>
  );
}
