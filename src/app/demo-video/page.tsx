"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Pill,
  ShoppingCart,
  ShoppingBasket,
  AlertTriangle,
  CheckCircle,
  Wifi,
  User,
  Clock,
  ChevronRight,
  Check,
  Camera,
  MessageCircle,
  Shield,
  Eye,
  Scissors,
  Video,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Scene {
  id: string;
  label: string;
  duration: number; // ms
  component: React.FC<{ progress: number }>;
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function useTick(interval = 50) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

function FadeIn({
  show,
  delay = 0,
  children,
  className = "",
}: {
  show: boolean;
  delay?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [show, delay]);

  return (
    <div
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Splice marker — a full-screen card telling you to cut in real footage */
function SpliceMarker({
  icon,
  title,
  subtitle,
  instructions,
  duration,
  progress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  instructions: string[];
  duration: string;
  progress: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <FadeIn show={progress > 0.02}>
        <div className="bg-white rounded-2xl border-2 border-dashed border-stone-300 shadow-lg p-10 max-w-lg w-full text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scissors size={16} className="text-stone-400" />
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Splice in real footage
            </span>
            <Scissors size={16} className="text-stone-400 scale-x-[-1]" />
          </div>

          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mt-6 mb-4">
            {icon}
          </div>
          <h2 className="text-3xl font-bold text-stone-900 mb-1">{title}</h2>
          <p className="text-base text-stone-500 mb-6">{subtitle}</p>

          <div className="text-left bg-stone-50 rounded-lg p-4 space-y-2">
            {instructions.map((inst, i) => (
              <FadeIn key={i} show={progress > 0.1 + i * 0.15} delay={0}>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-stone-400 mt-0.5 shrink-0 w-5">
                    {i + 1}.
                  </span>
                  <p className="text-sm text-stone-600">{inst}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <p className="mt-4 text-xs text-stone-400">
            Target duration: <span className="font-medium">{duration}</span>
          </p>
        </div>
      </FadeIn>

      {/* Countdown bar at bottom */}
      <div className="mt-6 w-64">
        <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-400 rounded-full transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-xs text-stone-400 text-center mt-1">
          {Math.ceil((1 - progress) * 5)}s until next scene
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene 1: Title + Problem  (0:00 — 0:15)                           */
/* ------------------------------------------------------------------ */

const TitleScene: Scene["component"] = ({ progress }) => {
  const showTitle = progress > 0.05;
  const showStats = progress > 0.3;
  const showProblem = progress > 0.55;
  const showSolution = progress > 0.8;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <FadeIn show={showTitle}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center">
            <Eye size={28} className="text-white" />
          </div>
          <h1 className="text-6xl font-bold text-stone-900 tracking-tight">NannyCam</h1>
        </div>
        <p className="text-xl text-stone-500 mt-2">AI-Powered Remote Eldercare</p>
      </FadeIn>

      <FadeIn show={showStats} delay={0} className="mt-10">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-4xl font-bold text-stone-900">53M+</p>
            <p className="text-sm text-stone-500 mt-1">Unpaid caregivers in the US</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-stone-900">6.9M</p>
            <p className="text-sm text-stone-500 mt-1">Americans with Alzheimer&apos;s</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-red-700">50%</p>
            <p className="text-sm text-stone-500 mt-1">Miss medications daily</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn show={showProblem} delay={0} className="mt-10 max-w-xl">
        <p className="text-lg text-stone-700 leading-relaxed">
          Adult children can&apos;t be there 24/7. They worry: <em>Did mom take her meds?
          Is the pantry empty? Is someone scamming dad?</em>
        </p>
      </FadeIn>

      <FadeIn show={showSolution} delay={0} className="mt-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-5 py-2.5">
          <CheckCircle size={20} className="text-green-700" />
          <span className="text-base font-medium text-green-700">
            NannyCam watches, acts, and communicates — through iMessage.
          </span>
        </div>
      </FadeIn>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 2: Onboarding (animated)  (0:15 — 0:40)                    */
/* ------------------------------------------------------------------ */

/** Simulates typing into an input field */
function TypeInto({
  value,
  show,
  speed = 40,
  className = "",
}: {
  value: string;
  show: boolean;
  speed?: number;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!show) { setDisplayed(""); return; }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(value.slice(0, i));
      if (i >= value.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [value, speed, show]);

  return (
    <span className={className}>
      {displayed}
      {displayed.length < value.length && displayed.length > 0 && (
        <span className="inline-block w-0.5 h-4 bg-stone-900 ml-0.5 animate-pulse align-text-bottom" />
      )}
    </span>
  );
}

const OnboardingScene: Scene["component"] = ({ progress }) => {
  // 5 phases: step 1-4 + done
  const phase =
    progress < 0.15 ? 1
    : progress < 0.35 ? 2
    : progress < 0.55 ? 3
    : progress < 0.75 ? 4
    : 5;

  // Within each phase, local progress 0-1
  const phaseStarts = [0, 0.15, 0.35, 0.55, 0.75];
  const phaseDurations = [0.15, 0.2, 0.2, 0.2, 0.25];
  const localP = Math.min(1, (progress - phaseStarts[phase - 1]!) / phaseDurations[phase - 1]!);

  const steps = [
    { title: "Power of Attorney", icon: <Shield size={18} className="text-stone-500" /> },
    { title: "Patient Info", icon: <User size={18} className="text-stone-500" /> },
    { title: "Medication Schedule", icon: <Pill size={18} className="text-blue-600" /> },
    { title: "Spending Rules", icon: <Shield size={18} className="text-red-600" /> },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <FadeIn show={progress > 0.01}>
        <h2 className="text-3xl font-bold text-stone-900 text-center mb-1">Setup in 30 Seconds</h2>
        <p className="text-sm text-stone-500 text-center mb-8">4-step onboarding wizard</p>
      </FadeIn>

      <div className="bg-white rounded-xl border border-stone-200 shadow-lg p-8 max-w-lg w-full">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ${
                  i + 1 < phase
                    ? "bg-green-700 text-white"
                    : i + 1 === phase && phase <= 4
                    ? "bg-stone-900 text-white scale-110"
                    : i + 1 <= 4 && phase === 5
                    ? "bg-green-700 text-white"
                    : "bg-stone-100 text-stone-400"
                }`}
              >
                {(i + 1 < phase) || phase === 5 ? <Check size={16} /> : i + 1}
              </div>
              {i < 3 && (
                <div className={`h-px w-8 transition-colors duration-500 ${
                  i + 1 < phase || phase === 5 ? "bg-green-700" : "bg-stone-200"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — POA */}
        {phase === 1 && (
          <FadeIn show>
            <h3 className="text-xl font-semibold text-stone-900 mb-1">Power of Attorney</h3>
            <p className="text-sm text-stone-500 mb-5">Legal confirmation required</p>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
              <p className="text-sm text-amber-700">
                This system monitors another person&apos;s medication, finances, and home.
                Only proceed if you have legal authority.
              </p>
            </div>
            <label className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                localP > 0.4 ? "border-green-700 bg-green-700" : "border-stone-300 bg-white"
              }`}>
                {localP > 0.4 && <Check size={14} className="text-white" />}
              </div>
              <span className="text-sm text-stone-700">
                I confirm I hold Power of Attorney (or equivalent legal authority)
              </span>
            </label>
            {localP > 0.7 && (
              <FadeIn show delay={0}>
                <div className="mt-6 flex justify-end">
                  <div className="flex items-center gap-1.5 rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium animate-pulse">
                    Continue <ChevronRight size={16} />
                  </div>
                </div>
              </FadeIn>
            )}
          </FadeIn>
        )}

        {/* Step 2 — Patient Info */}
        {phase === 2 && (
          <FadeIn show>
            <h3 className="text-xl font-semibold text-stone-900 mb-1">Patient Info</h3>
            <p className="text-sm text-stone-500 mb-5">Basic details about the person you&apos;re caring for</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Patient name</label>
                <div className="rounded-md border border-stone-200 px-3 py-2.5 min-h-[42px]">
                  <TypeInto value="Margaret Johnson" show={localP > 0.05} speed={50} className="text-stone-900" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Timezone</label>
                <div className={`rounded-md border px-3 py-2.5 transition-colors duration-300 ${
                  localP > 0.4 ? "border-stone-200 bg-white" : "border-stone-200"
                }`}>
                  <FadeIn show={localP > 0.4} delay={0}>
                    <span className="text-stone-900">America/New York</span>
                  </FadeIn>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Your phone number (caretaker)</label>
                <div className="rounded-md border border-stone-200 px-3 py-2.5 min-h-[42px]">
                  <TypeInto value="+1 609 555 0123" show={localP > 0.5} speed={45} className="text-stone-900" />
                </div>
                <p className="text-xs text-stone-400">This is where NannyCam will send iMessage alerts.</p>
              </div>
            </div>
            {localP > 0.85 && (
              <FadeIn show delay={0}>
                <div className="mt-6 flex justify-end">
                  <div className="flex items-center gap-1.5 rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium animate-pulse">
                    Continue <ChevronRight size={16} />
                  </div>
                </div>
              </FadeIn>
            )}
          </FadeIn>
        )}

        {/* Step 3 — Medication */}
        {phase === 3 && (
          <FadeIn show>
            <h3 className="text-xl font-semibold text-stone-900 mb-1">Medication Schedule</h3>
            <p className="text-sm text-stone-500 mb-5">Primary prescription to monitor</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Prescription name</label>
                <div className="rounded-md border border-stone-200 px-3 py-2.5 min-h-[42px]">
                  <TypeInto value="Aricept 10mg" show={localP > 0.05} speed={55} className="text-stone-900" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Dose times</label>
                <div className="flex gap-3">
                  <FadeIn show={localP > 0.35} delay={0} className="flex-1">
                    <div className="rounded-md border border-stone-200 px-3 py-2.5 text-center">
                      <span className="text-stone-900 font-medium">08:00</span>
                      <span className="text-stone-400 text-sm ml-1">AM</span>
                    </div>
                  </FadeIn>
                  <FadeIn show={localP > 0.55} delay={0} className="flex-1">
                    <div className="rounded-md border border-stone-200 px-3 py-2.5 text-center">
                      <span className="text-stone-900 font-medium">08:00</span>
                      <span className="text-stone-400 text-sm ml-1">PM</span>
                    </div>
                  </FadeIn>
                </div>
                <FadeIn show={localP > 0.55} delay={200}>
                  <button className="text-xs text-stone-500 underline underline-offset-2 mt-1">
                    + Add another time
                  </button>
                </FadeIn>
              </div>
            </div>
            {localP > 0.8 && (
              <FadeIn show delay={0}>
                <div className="mt-6 flex justify-end">
                  <div className="flex items-center gap-1.5 rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium animate-pulse">
                    Continue <ChevronRight size={16} />
                  </div>
                </div>
              </FadeIn>
            )}
          </FadeIn>
        )}

        {/* Step 4 — Spending Rules */}
        {phase === 4 && (
          <FadeIn show>
            <h3 className="text-xl font-semibold text-stone-900 mb-1">Spending Rules</h3>
            <p className="text-sm text-stone-500 mb-5">
              Transactions above these limits will require your approval
            </p>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Max single transaction ($)</label>
                <div className="rounded-md border border-stone-200 px-3 py-2.5 min-h-[42px]">
                  <TypeInto value="100" show={localP > 0.1} speed={120} className="text-stone-900" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Daily spending limit ($)</label>
                <div className="rounded-md border border-stone-200 px-3 py-2.5 min-h-[42px]">
                  <TypeInto value="300" show={localP > 0.4} speed={120} className="text-stone-900" />
                </div>
              </div>
            </div>
            {localP > 0.75 && (
              <FadeIn show delay={0}>
                <div className="mt-6 flex justify-end">
                  <div className="flex items-center gap-1.5 rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium animate-pulse">
                    Finish setup <ChevronRight size={16} />
                  </div>
                </div>
              </FadeIn>
            )}
          </FadeIn>
        )}

        {/* Done */}
        {phase === 5 && (
          <FadeIn show>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-700" />
              </div>
              <h3 className="text-2xl font-semibold text-stone-900">All set!</h3>
              <p className="text-base text-stone-500 mt-2">
                NannyCam is now monitoring <span className="font-medium text-stone-700">Margaret Johnson</span>.
              </p>
              <FadeIn show={localP > 0.3} delay={0} className="mt-6">
                <div className="inline-flex rounded-md bg-stone-900 text-white px-5 py-2.5 text-sm font-medium">
                  Go to Dashboard
                </div>
              </FadeIn>
              <FadeIn show={localP > 0.5} delay={0} className="mt-4">
                <p className="text-sm text-stone-500 mb-2">Then open a camera to start monitoring:</p>
                <div className="flex gap-3 justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700">
                    <Pill size={14} /> Pill Cam
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700">
                    <ShoppingBasket size={14} /> Pantry Cam
                  </span>
                </div>
              </FadeIn>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 3: Splice — Pill Cam  (0:40 — 1:00)                        */
/* ------------------------------------------------------------------ */

const PillCamSplice: Scene["component"] = ({ progress }) => (
  <SpliceMarker
    icon={<Pill size={32} className="text-blue-600" />}
    title="Pill Cam Demo"
    subtitle="Screen-record laptop + iPhone screen recording"
    instructions={[
      "From success screen or dashboard, click \"Pill Cam\"",
      "Point laptop webcam at real pill organizer on table",
      "Hit \"Capture & Analyze\" — wait 3-4s for Gemini",
      "Show green result on screen",
      "CUT TO phone: iMessage arrives with medication confirmation",
      "CUT TO dashboard: event appears in feed real-time",
    ]}
    duration="~20s"
    progress={progress}
  />
);

/* ------------------------------------------------------------------ */
/*  Scene 4: Splice — Pantry Cam  (1:00 — 1:20)                      */
/* ------------------------------------------------------------------ */

const PantryCamSplice: Scene["component"] = ({ progress }) => (
  <SpliceMarker
    icon={<ShoppingBasket size={32} className="text-amber-600" />}
    title="Pantry Cam Demo"
    subtitle="Screen-record laptop + iPhone screen recording"
    instructions={[
      "Open /cam/pantry from dashboard",
      "Point webcam at shelf with a few items (one empty spot)",
      "Hit \"Capture & Analyze\" — Gemini detects low/empty items",
      "CUT TO phone: iMessage — \"Pantry check: rice low, cereal empty\"",
      "CUT TO dashboard: reorder event appears in feed",
    ]}
    duration="~20s"
    progress={progress}
  />
);

/* ------------------------------------------------------------------ */
/*  Scene 5: Splice — Bill Protector  (1:20 — 1:45)                  */
/* ------------------------------------------------------------------ */

const BillProtectorScene: Scene["component"] = ({ progress }) => {
  // Phase 1: Transaction comes in (0–0.2)
  // Phase 2: Flagged alert + iMessage (0.2–0.45)
  // Phase 3: User replies "block" (0.45–0.6)
  // Phase 4: Dashboard updates (0.6–0.8)
  // Phase 5: Summary (0.8–1.0)

  const showTitle = progress > 0.01;
  const showTxn = progress > 0.08;
  const showClassify = progress > 0.15;
  const showFlagged = progress > 0.22;
  const showIMsg1 = progress > 0.28;
  const showIMsg2 = progress > 0.48;
  const showBlocked = progress > 0.58;
  const showIMsg3 = progress > 0.65;
  const showDashboard = progress > 0.75;

  return (
    <div className="flex flex-col items-center justify-start h-full px-8 pt-6 overflow-hidden">
      <FadeIn show={showTitle}>
        <h2 className="text-3xl font-bold text-stone-900 text-center mb-1">Bill Protector</h2>
        <p className="text-sm text-stone-500 text-center mb-6">
          Powered by Knot TransactionLink — flags suspicious charges in real-time
        </p>
      </FadeIn>

      <div className="flex gap-6 max-w-4xl w-full">
        {/* Left: Transaction + Dashboard card */}
        <div className="flex-1 space-y-4">
          {/* Incoming transaction */}
          <FadeIn show={showTxn}>
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-3">
                Incoming Transaction
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ShoppingCart size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Best Buy</p>
                    <p className="text-xs text-stone-500">Electronics — Credit Card</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-stone-900">$450.00</p>
              </div>

              {/* Classification animation */}
              {showClassify && (
                <FadeIn show delay={0}>
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${showFlagged ? "bg-red-500" : "bg-amber-400 animate-pulse"}`} />
                      <span className="text-xs font-medium text-stone-500">
                        {showFlagged ? "Classification complete" : "Analyzing against spending rules..."}
                      </span>
                    </div>
                    {showFlagged && (
                      <FadeIn show delay={0}>
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-600 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-700">FLAGGED</p>
                              <p className="text-xs text-red-600">
                                $450.00 exceeds max single transaction limit of $100.00
                              </p>
                            </div>
                          </div>
                        </div>
                      </FadeIn>
                    )}
                  </div>
                </FadeIn>
              )}
            </div>
          </FadeIn>

          {/* Dashboard event feed */}
          {showDashboard && (
            <FadeIn show delay={0}>
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-3">
                  Dashboard — Events Feed
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 py-2 border-b border-stone-100">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                      <Pill size={14} className="text-blue-700" />
                    </div>
                    <p className="text-sm text-stone-600 flex-1">8:00 AM medication taken</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      Completed
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-2 border-b border-stone-100">
                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center">
                      <ShoppingBasket size={14} className="text-amber-700" />
                    </div>
                    <p className="text-sm text-stone-600 flex-1">Pantry reorder — $18.50</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      Ordered
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                      <AlertTriangle size={14} className="text-red-700" />
                    </div>
                    <p className="text-sm text-stone-600 flex-1">$450.00 at Best Buy</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-700 ${
                      showBlocked
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {showBlocked ? "Blocked" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </FadeIn>
          )}
        </div>

        {/* Right: iMessage thread */}
        <div className="w-72 shrink-0">
          <FadeIn show={showIMsg1}>
            <div className="bg-stone-100 rounded-2xl border border-stone-300 shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-stone-200 px-4 py-2.5 flex items-center gap-2.5 border-b border-stone-300">
                <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center">
                  <MessageCircle size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-900">NannyCam</p>
                  <p className="text-[10px] text-stone-500">iMessage</p>
                </div>
              </div>

              {/* Messages */}
              <div className="p-3 space-y-2.5 min-h-[280px]">
                {/* Alert message */}
                <FadeIn show={showIMsg1} delay={0}>
                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-white border border-stone-200 px-3 py-2 text-xs leading-relaxed text-stone-800">
                      <p className="font-semibold text-red-600 mb-1">⚠️ Flagged Transaction</p>
                      <p>Best Buy — $450.00</p>
                      <p className="text-stone-500 mt-1">Exceeds $100 single transaction limit</p>
                      <p className="text-stone-500 mt-2">
                        Reply <span className="font-mono bg-stone-100 px-1 rounded">&quot;approve 42&quot;</span> or{" "}
                        <span className="font-mono bg-stone-100 px-1 rounded">&quot;block 42&quot;</span>
                      </p>
                    </div>
                  </div>
                </FadeIn>

                {/* User replies "block 42" */}
                {showIMsg2 && (
                  <FadeIn show delay={0}>
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-br-md bg-blue-500 text-white px-3 py-2 text-xs font-medium">
                        block 42
                      </div>
                    </div>
                  </FadeIn>
                )}

                {/* Bot confirms */}
                {showIMsg3 && (
                  <FadeIn show delay={0}>
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-white border border-stone-200 px-3 py-2 text-xs leading-relaxed text-stone-800">
                        <p>Transaction #42 <span className="font-semibold text-red-600">blocked</span>.</p>
                        <p className="text-stone-500 mt-1">Best Buy charge of $450.00 has been rejected.</p>
                      </div>
                    </div>
                  </FadeIn>
                )}

                {/* Typing indicator */}
                {showIMsg2 && !showIMsg3 && (
                  <FadeIn show delay={200}>
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md bg-white border border-stone-200 px-4 py-2.5">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 6: Architecture  (1:45 — 1:55)                              */
/* ------------------------------------------------------------------ */

const ArchScene: Scene["component"] = ({ progress }) => {
  const showTitle = progress > 0.02;
  const showStack = progress > 0.15;
  const showFlow = progress > 0.45;

  const stack = [
    { name: "Gemini 2.0 Flash", role: "Vision AI", color: "bg-blue-50 border-blue-200 text-blue-700" },
    { name: "Knot API", role: "Transactions + Shopping", color: "bg-amber-50 border-amber-200 text-amber-700" },
    { name: "Photon Spectrum", role: "iMessage Agent", color: "bg-purple-50 border-purple-200 text-purple-700" },
    { name: "Supabase", role: "Real-time DB + Storage", color: "bg-green-50 border-green-200 text-green-700" },
    { name: "Next.js 16", role: "App Framework", color: "bg-stone-50 border-stone-300 text-stone-700" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <FadeIn show={showTitle}>
        <h2 className="text-4xl font-bold text-stone-900 text-center mb-2">Under the Hood</h2>
        <p className="text-base text-stone-500 text-center mb-10">Built in 36 hours at HackPrinceton</p>
      </FadeIn>

      <FadeIn show={showStack} className="mb-8">
        <div className="flex flex-wrap justify-center gap-3">
          {stack.map((s, i) => (
            <FadeIn key={i} show={showStack} delay={i * 120}>
              <div className={`rounded-xl border ${s.color} px-5 py-3 text-center`}>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs opacity-70 mt-0.5">{s.role}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </FadeIn>

      <FadeIn show={showFlow} className="max-w-2xl w-full">
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center justify-between text-sm text-stone-600">
            <div className="text-center flex-1">
              <Camera size={24} className="mx-auto text-stone-400 mb-2" />
              <p className="font-medium">Webcam</p>
              <p className="text-xs text-stone-400">captures frame</p>
            </div>
            <ChevronRight size={20} className="text-stone-300 shrink-0" />
            <div className="text-center flex-1">
              <Eye size={24} className="mx-auto text-blue-500 mb-2" />
              <p className="font-medium">Gemini Vision</p>
              <p className="text-xs text-stone-400">analyzes image</p>
            </div>
            <ChevronRight size={20} className="text-stone-300 shrink-0" />
            <div className="text-center flex-1">
              <div className="w-6 h-6 mx-auto rounded bg-green-100 flex items-center justify-center mb-2">
                <span className="text-green-700 text-xs font-bold">DB</span>
              </div>
              <p className="font-medium">Supabase</p>
              <p className="text-xs text-stone-400">stores event</p>
            </div>
            <ChevronRight size={20} className="text-stone-300 shrink-0" />
            <div className="text-center flex-1">
              <MessageCircle size={24} className="mx-auto text-purple-500 mb-2" />
              <p className="font-medium">iMessage</p>
              <p className="text-xs text-stone-400">alerts caretaker</p>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 7: Closing  (1:55 — 2:00)                                   */
/* ------------------------------------------------------------------ */

const ClosingScene: Scene["component"] = ({ progress }) => {
  const showMain = progress > 0.05;
  const showTagline = progress > 0.3;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <FadeIn show={showMain}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center">
            <Eye size={28} className="text-white" />
          </div>
          <h1 className="text-6xl font-bold text-stone-900 tracking-tight">NannyCam</h1>
        </div>
      </FadeIn>

      <FadeIn show={showTagline} className="max-w-lg">
        <p className="text-2xl text-stone-600 leading-relaxed">
          Because caring for your parents<br />shouldn&apos;t require being in the same room.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-stone-100 text-stone-600">
            <Pill size={14} /> Medication
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-stone-100 text-stone-600">
            <ShoppingBasket size={14} /> Pantry
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-stone-100 text-stone-600">
            <Shield size={14} /> Finances
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-stone-100 text-stone-600">
            <MessageCircle size={14} /> iMessage
          </span>
        </div>
        <p className="mt-8 text-sm text-stone-400">Healthcare Track — HackPrinceton Spring 2026</p>
      </FadeIn>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene list — matches the video script timings                      */
/* ------------------------------------------------------------------ */

const SCENES: Scene[] = [
  { id: "title",       label: "Title + Problem",   duration: 15000, component: TitleScene },
  { id: "onboarding",  label: "Onboarding",        duration: 20000, component: OnboardingScene },
  { id: "pill-cam",    label: "Pill Cam",           duration: 5000,  component: PillCamSplice },
  { id: "pantry-cam",  label: "Pantry Cam",         duration: 5000,  component: PantryCamSplice },
  { id: "bill",        label: "Bill Protector",     duration: 20000, component: BillProtectorScene },
  { id: "arch",        label: "Architecture",       duration: 10000, component: ArchScene },
  { id: "closing",     label: "Closing",            duration: 6000,  component: ClosingScene },
];

/* ------------------------------------------------------------------ */
/*  Main orchestrator                                                  */
/* ------------------------------------------------------------------ */

export default function DemoVideoPage() {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [pauseOffset, setPauseOffset] = useState(0);
  const now = useTick(50);

  const totalDuration = SCENES.reduce((sum, s) => sum + s.duration, 0);

  const start = useCallback(() => {
    setStartTime(Date.now());
    setPaused(false);
    setPauseOffset(0);
  }, []);

  const togglePause = useCallback(() => {
    if (!startTime) return;
    if (paused) {
      setPauseOffset((prev) => prev + (Date.now() - (startTime + pauseOffset)));
      setStartTime(Date.now());
      setPaused(false);
    } else {
      setPaused(true);
    }
  }, [startTime, paused, pauseOffset]);

  const elapsed = startTime
    ? paused
      ? pauseOffset
      : now - startTime + pauseOffset
    : 0;

  // Find current scene
  let accum = 0;
  let currentSceneIdx = 0;
  let sceneProgress = 0;

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i]!;
    if (elapsed < accum + scene.duration) {
      currentSceneIdx = i;
      sceneProgress = (elapsed - accum) / scene.duration;
      break;
    }
    accum += scene.duration;
    if (i === SCENES.length - 1) {
      currentSceneIdx = i;
      sceneProgress = 1;
    }
  }

  const CurrentComponent = SCENES[currentSceneIdx]!.component;
  const currentLabel = SCENES[currentSceneIdx]!.label;
  const overallProgress = Math.min(1, elapsed / totalDuration);
  const isFinished = elapsed >= totalDuration;

  // Jump to scene
  const jumpTo = useCallback((sceneIdx: number) => {
    let offset = 0;
    for (let i = 0; i < sceneIdx; i++) {
      offset += SCENES[i]!.duration;
    }
    setStartTime(Date.now());
    setPauseOffset(offset);
    setPaused(false);
  }, []);

  return (
    <div className="h-screen w-screen bg-stone-50 flex flex-col overflow-hidden select-none">
      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        {!startTime ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center">
                <Eye size={24} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold text-stone-900">NannyCam Demo</h1>
            </div>
            <p className="text-stone-500 max-w-md text-center">
              Animated intro/outro + splice markers for real footage.
              <br />
              Record this, then cut in real app clips at the marked scenes.
            </p>

            <button
              onClick={start}
              className="rounded-full bg-stone-900 text-white px-8 py-3 text-lg font-medium hover:bg-stone-800 transition-colors"
            >
              Play Demo
            </button>

            {/* Scene list for quick jump */}
            <div className="mt-4 space-y-1 text-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">Scenes</p>
              {SCENES.map((s, i) => {
                const isSplice = s.id.includes("splice") || ["onboarding", "pill-cam", "pantry-cam", "bill"].includes(s.id);
                return (
                  <div key={s.id} className="flex items-center gap-3 text-stone-600">
                    <span className="w-5 text-right text-stone-400">{i + 1}.</span>
                    <span className={isSplice ? "text-stone-400" : "font-medium"}>
                      {s.label}
                    </span>
                    {isSplice && (
                      <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                        splice
                      </span>
                    )}
                    <span className="text-xs text-stone-400">{(s.duration / 1000)}s</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-3 text-stone-600 pt-1 border-t border-stone-200 mt-2">
                <span className="w-5" />
                <span className="font-medium">Total</span>
                <span className="text-xs text-stone-400">{Math.round(totalDuration / 1000)}s</span>
              </div>
            </div>
          </div>
        ) : isFinished ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <CheckCircle size={48} className="text-green-700" />
            <h2 className="text-3xl font-bold text-stone-900">Demo Complete</h2>
            <button
              onClick={start}
              className="rounded-full bg-stone-900 text-white px-8 py-3 text-base font-medium hover:bg-stone-800"
            >
              Replay
            </button>
          </div>
        ) : (
          <CurrentComponent progress={sceneProgress} />
        )}
      </div>

      {/* Bottom control bar */}
      {startTime && !isFinished && (
        <div className="border-t border-stone-200 bg-white px-6 py-3 flex items-center gap-4">
          <button
            onClick={togglePause}
            className="text-sm font-medium text-stone-700 hover:text-stone-900 w-16"
          >
            {paused ? "Resume" : "Pause"}
          </button>

          {/* Scene jump buttons */}
          <div className="flex gap-1">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => jumpTo(i)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  i === currentSceneIdx
                    ? "bg-stone-900 text-white"
                    : i < currentSceneIdx
                    ? "bg-stone-200 text-stone-600 hover:bg-stone-300"
                    : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-900 rounded-full transition-all duration-100"
              style={{ width: `${overallProgress * 100}%` }}
            />
          </div>

          <span className="text-xs text-stone-500 font-medium shrink-0">
            {currentLabel}
          </span>

          <span className="text-xs text-stone-400 w-20 text-right font-mono shrink-0">
            {Math.floor(elapsed / 60000)}:{String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0")} / {Math.floor(totalDuration / 60000)}:{String(Math.floor((totalDuration % 60000) / 1000)).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}
