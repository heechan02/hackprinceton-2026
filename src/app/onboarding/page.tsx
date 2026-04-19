"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

interface DoseTime {
  id: number;
  value: string;
}

interface FormData {
  poaConfirmed: boolean;
  name: string;
  timezone: string;
  caretakerPhone: string;
  prescriptionName: string;
  doseTimes: DoseTime[];
  maxSingleTxn: string;
  dailyLimit: string;
}

const TOTAL_STEPS = 4;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i + 1 < current
                ? "bg-green-700 text-white"
                : i + 1 === current
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            {i + 1 < current ? <Check size={16} strokeWidth={2} /> : i + 1}
          </div>
          {i < TOTAL_STEPS - 1 && (
            <div
              className={`h-px w-8 ${i + 1 < current ? "bg-green-700" : "bg-stone-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    poaConfirmed: false,
    name: "",
    timezone: "America/New_York",
    caretakerPhone: "",
    prescriptionName: "",
    doseTimes: [{ id: 1, value: "08:00" }],
    maxSingleTxn: "100",
    dailyLimit: "300",
  });

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addDoseTime() {
    const nextId = Math.max(...form.doseTimes.map((d) => d.id)) + 1;
    setField("doseTimes", [...form.doseTimes, { id: nextId, value: "12:00" }]);
  }

  function removeDoseTime(id: number) {
    if (form.doseTimes.length <= 1) return;
    setField(
      "doseTimes",
      form.doseTimes.filter((d) => d.id !== id)
    );
  }

  function updateDoseTime(id: number, value: string) {
    setField(
      "doseTimes",
      form.doseTimes.map((d) => (d.id === id ? { ...d, value } : d))
    );
  }

  function canAdvance(): boolean {
    if (step === 1) return form.poaConfirmed;
    if (step === 2)
      return (
        form.name.trim().length > 0 && form.caretakerPhone.trim().length > 0
      );
    if (step === 3)
      return (
        form.prescriptionName.trim().length > 0 &&
        form.doseTimes.every((d) => d.value.length > 0)
      );
    if (step === 4)
      return (
        parseFloat(form.maxSingleTxn) > 0 && parseFloat(form.dailyLimit) > 0
      );
    return false;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          timezone: form.timezone,
          caretakerPhone: form.caretakerPhone.trim(),
          prescriptionName: form.prescriptionName.trim(),
          doseTimes: form.doseTimes.map((d) => d.value),
          maxSingleTxn: parseFloat(form.maxSingleTxn),
          dailyLimit: parseFloat(form.dailyLimit),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="rounded-lg bg-white border border-stone-200 p-8 shadow-sm max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <Check size={24} strokeWidth={2} className="text-green-700" />
          </div>
          <h1 className="text-3xl font-semibold text-stone-900">All set!</h1>
          <p className="text-base text-stone-700 leading-relaxed">
            NannyCam is configured and ready. Head to the dashboard to see
            live events.
          </p>
          <a
            href="/dashboard"
            className="inline-block rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-stone-800"
          >
            Go to Dashboard
          </a>
          <p className="text-sm text-stone-500 mt-2">Then open a camera to start monitoring:</p>
          <div className="flex gap-3 justify-center">
            <a
              href="/cam/pill"
              className="inline-block rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Pill Cam
            </a>
            <a
              href="/cam/pantry"
              className="inline-block rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Pantry Cam
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="rounded-lg bg-white border border-stone-200 p-8 shadow-sm max-w-lg w-full">
        <StepIndicator current={step} />

        {/* Step 1 — POA confirmation */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold text-stone-900">
                Power of Attorney
              </h1>
              <p className="text-base text-stone-700 leading-relaxed mt-2">
                NannyCam is designed for adult children who hold legal authority
                to manage a parent&apos;s care. Please confirm your role before
                continuing.
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-base text-amber-700 leading-relaxed">
                This system monitors another person&apos;s medication, finances,
                and home. Only proceed if you have legal authority to do so.
              </p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.poaConfirmed}
                onChange={(e) => setField("poaConfirmed", e.target.checked)}
                className="mt-1 w-4 h-4 accent-stone-900"
              />
              <span className="text-base text-stone-700 leading-relaxed">
                I confirm I hold Power of Attorney (or equivalent legal
                authority) for the patient I am configuring this system to
                monitor.
              </span>
            </label>
          </div>
        )}

        {/* Step 2 — Patient info */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold text-stone-900">
                Patient Info
              </h1>
              <p className="text-base text-stone-700 leading-relaxed mt-2">
                Basic details about the person you&apos;re caring for.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-base font-medium text-stone-900">
                  Patient name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. Margaret Johnson"
                  className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-base font-medium text-stone-900">
                  Timezone
                </label>
                <select
                  value={form.timezone}
                  onChange={(e) => setField("timezone", e.target.value)}
                  className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-base font-medium text-stone-900">
                  Your phone number (caretaker)
                </label>
                <input
                  type="tel"
                  value={form.caretakerPhone}
                  onChange={(e) => setField("caretakerPhone", e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
                <p className="text-sm text-stone-500">
                  This is where NannyCam will send iMessage alerts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Medication schedule */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold text-stone-900">
                Medication Schedule
              </h1>
              <p className="text-base text-stone-700 leading-relaxed mt-2">
                Add the primary prescription to monitor. More can be added later.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-base font-medium text-stone-900">
                  Prescription name
                </label>
                <input
                  type="text"
                  value={form.prescriptionName}
                  onChange={(e) => setField("prescriptionName", e.target.value)}
                  placeholder="e.g. Aricept 10mg"
                  className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-base font-medium text-stone-900">
                  Dose times
                </label>
                {form.doseTimes.map((dt) => (
                  <div key={dt.id} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={dt.value}
                      onChange={(e) => updateDoseTime(dt.id, e.target.value)}
                      className="rounded-md border border-stone-200 px-3 py-2.5 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => removeDoseTime(dt.id)}
                      disabled={form.doseTimes.length <= 1}
                      className="text-sm text-stone-500 hover:text-red-700 disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDoseTime}
                  className="text-sm text-stone-700 hover:text-stone-900 underline underline-offset-2"
                >
                  + Add another time
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Spending rules */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold text-stone-900">
                Spending Rules
              </h1>
              <p className="text-base text-stone-700 leading-relaxed mt-2">
                Set thresholds for Bill Protector. Transactions above these
                limits will require your approval.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-base font-medium text-stone-900">
                  Max single transaction ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.maxSingleTxn}
                  onChange={(e) => setField("maxSingleTxn", e.target.value)}
                  className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-base font-medium text-stone-900">
                  Daily spending limit ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.dailyLimit}
                  onChange={(e) => setField("dailyLimit", e.target.value)}
                  className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        {error && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-1.5 text-base text-stone-700 hover:text-stone-900 disabled:opacity-30"
          >
            <ChevronLeft size={20} strokeWidth={1.75} />
            Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-1.5 rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-40"
            >
              Continue
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canAdvance() || submitting}
              className="rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-40"
            >
              {submitting ? "Saving…" : "Finish setup"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
