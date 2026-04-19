import { adminClient } from "@/services/supabase/admin";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Pill,
  ShoppingCart,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import EventsFeed, { type EventRow } from "@/components/dashboard/EventsFeed";

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

  // Fetch system health
  const { data: systemHealth } = await adminClient
    .from("system_health")
    .select("cam_kind, last_heartbeat_at");

  const STALE_MS = 15 * 60 * 1000;
  const healthRows = (systemHealth ?? []).map((row) => ({
    camKind: row.cam_kind,
    lastHeartbeat: row.last_heartbeat_at,
    online: Date.now() - new Date(row.last_heartbeat_at).getTime() < STALE_MS,
  }));

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
        <EventsFeed
          initialEvents={eventRows}
          timezone={timezone}
          dateLabel={formatDate(now, timezone)}
        />

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

        {/* 4. System Status */}
        <div className="rounded-lg bg-white border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wifi size={20} strokeWidth={1.75} className="text-stone-500" />
            <p className="text-base font-medium text-stone-900">System Status</p>
          </div>
          {healthRows.length === 0 ? (
            <p className="text-base text-stone-500">No cameras have reported in yet.</p>
          ) : (
            <ul className="space-y-3">
              {healthRows.map((row) => (
                <li key={row.camKind} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {row.online ? (
                      <Wifi size={20} strokeWidth={1.75} className="text-green-700" />
                    ) : (
                      <WifiOff size={20} strokeWidth={1.75} className="text-red-700" />
                    )}
                    <span className="text-base text-stone-700 capitalize">
                      {row.camKind} cam
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-500">
                      {formatTime(row.lastHeartbeat, timezone)}
                    </span>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        row.online
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {row.online ? "Online" : "Offline"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 5. Active rules summary */}
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
