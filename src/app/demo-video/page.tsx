"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Pill,
  ShoppingCart,
  ShoppingBasket,
  AlertTriangle,
  CheckCircle,
  Video,
  Wifi,
  User,
  Clock,
  ChevronRight,
  Check,
  Camera,
  MessageCircle,
  Shield,
  Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Scene {
  id: string;
  duration: number; // ms
  component: React.FC<{ progress: number }>; // 0-1
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

/** Fade-in wrapper */
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

/** Typing text effect */
function TypeText({ text, speed = 30, show }: { text: string; speed?: number; show: boolean }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!show) {
      setDisplayed("");
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, show]);
  return <>{displayed}</>;
}

/* ------------------------------------------------------------------ */
/*  Scene 1: Title / Problem                                          */
/* ------------------------------------------------------------------ */

const TitleScene: Scene["component"] = ({ progress }) => {
  const showTitle = progress > 0.05;
  const showStats = progress > 0.25;
  const showProblem = progress > 0.45;
  const showSolution = progress > 0.7;

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
/*  Scene 2: Three Pillars                                            */
/* ------------------------------------------------------------------ */

const PillarsScene: Scene["component"] = ({ progress }) => {
  const showTitle = progress > 0.02;
  const showPill = progress > 0.15;
  const showPantry = progress > 0.4;
  const showBill = progress > 0.65;

  const pillars = [
    {
      show: showPill,
      icon: <Pill size={32} className="text-blue-700" />,
      bg: "bg-blue-50 border-blue-200",
      title: "Medication Monitor",
      desc: "Webcam watches pill organizer. Gemini Vision verifies the correct compartment was emptied. Alerts sent instantly via iMessage.",
      tag: "Gemini 2.0 Flash",
    },
    {
      show: showPantry,
      icon: <ShoppingBasket size={32} className="text-amber-700" />,
      bg: "bg-amber-50 border-amber-200",
      title: "Autonomous Pantry Restocking",
      desc: "Detects low/empty items via webcam. Auto-orders from Walmart through Knot API's AgenticShopping — no human needed.",
      tag: "Knot AgenticShopping",
    },
    {
      show: showBill,
      icon: <Shield size={32} className="text-red-700" />,
      bg: "bg-red-50 border-red-200",
      title: "Bill Protector",
      desc: "Monitors every transaction via Knot TransactionLink. AI classifies against caretaker rules. Suspicious charges are flagged for approval.",
      tag: "Knot TransactionLink",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <FadeIn show={showTitle}>
        <h2 className="text-4xl font-bold text-stone-900 text-center mb-10">Three Pillars of Care</h2>
      </FadeIn>
      <div className="grid grid-cols-3 gap-6 max-w-4xl w-full">
        {pillars.map((p, i) => (
          <FadeIn key={i} show={p.show} className="h-full">
            <div className={`rounded-xl border ${p.bg} p-6 h-full flex flex-col`}>
              <div className="mb-4">{p.icon}</div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">{p.title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed flex-1">{p.desc}</p>
              <div className="mt-4">
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 text-stone-600 border border-stone-200">
                  {p.tag}
                </span>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 3: Onboarding walkthrough                                   */
/* ------------------------------------------------------------------ */

const OnboardingScene: Scene["component"] = ({ progress }) => {
  const currentStep =
    progress < 0.2 ? 1 : progress < 0.4 ? 2 : progress < 0.6 ? 3 : progress < 0.8 ? 4 : 5;

  const steps = [
    { num: 1, title: "Power of Attorney", desc: "Legal confirmation" },
    { num: 2, title: "Patient Info", desc: "Margaret Johnson, EST" },
    { num: 3, title: "Medication", desc: "Aricept 10mg — 8am, 8pm" },
    { num: 4, title: "Spending Rules", desc: "$100 max / $300 daily" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <FadeIn show={progress > 0.02}>
        <h2 className="text-4xl font-bold text-stone-900 text-center mb-2">Setup in 30 Seconds</h2>
        <p className="text-base text-stone-500 text-center mb-10">4-step onboarding wizard</p>
      </FadeIn>

      <div className="bg-white rounded-xl border border-stone-200 shadow-lg p-8 max-w-lg w-full">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ${
                  s.num < currentStep
                    ? "bg-green-700 text-white scale-100"
                    : s.num === currentStep
                    ? "bg-stone-900 text-white scale-110"
                    : "bg-stone-100 text-stone-400"
                }`}
              >
                {s.num < currentStep ? <Check size={16} /> : s.num}
              </div>
              {i < 3 && (
                <div
                  className={`h-px w-8 transition-colors duration-500 ${
                    s.num < currentStep ? "bg-green-700" : "bg-stone-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Active step content */}
        {currentStep <= 4 && (
          <FadeIn show key={currentStep}>
            <h3 className="text-2xl font-semibold text-stone-900 mb-1">
              {steps[currentStep - 1]!.title}
            </h3>
            <p className="text-base text-stone-500 mb-6">{steps[currentStep - 1]!.desc}</p>

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm text-amber-700">Legal authority required to proceed.</p>
                </div>
                <label className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border-2 border-green-700 bg-green-700 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                  <span className="text-sm text-stone-700">I hold Power of Attorney</span>
                </label>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3">
                <div className="rounded-md border border-stone-200 px-3 py-2.5">
                  <span className="text-stone-900">Margaret Johnson</span>
                </div>
                <div className="rounded-md border border-stone-200 px-3 py-2.5">
                  <span className="text-stone-900">America/New York</span>
                </div>
                <div className="rounded-md border border-stone-200 px-3 py-2.5">
                  <span className="text-stone-900">+1 609 555 0123</span>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-3">
                <div className="rounded-md border border-stone-200 px-3 py-2.5">
                  <span className="text-stone-900">Aricept 10mg</span>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-md border border-stone-200 px-3 py-2.5 flex-1">
                    <span className="text-stone-900">08:00 AM</span>
                  </div>
                  <div className="rounded-md border border-stone-200 px-3 py-2.5 flex-1">
                    <span className="text-stone-900">08:00 PM</span>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-sm w-32">Max transaction</span>
                  <div className="rounded-md border border-stone-200 px-3 py-2.5 flex-1">
                    <span className="text-stone-900">$100.00</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-sm w-32">Daily limit</span>
                  <div className="rounded-md border border-stone-200 px-3 py-2.5 flex-1">
                    <span className="text-stone-900">$300.00</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <div className="flex items-center gap-1.5 rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium">
                {currentStep < 4 ? "Continue" : "Finish setup"}
                <ChevronRight size={16} />
              </div>
            </div>
          </FadeIn>
        )}

        {/* Done state */}
        {currentStep === 5 && (
          <FadeIn show>
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-green-700" />
              </div>
              <h3 className="text-2xl font-semibold text-stone-900">All set!</h3>
              <p className="text-base text-stone-500 mt-2">NannyCam is monitoring Margaret.</p>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 4: Dashboard showcase                                       */
/* ------------------------------------------------------------------ */

const DashboardScene: Scene["component"] = ({ progress }) => {
  const showHeader = progress > 0.02;
  const showEvents = progress > 0.15;
  const eventCount = Math.min(
    5,
    Math.floor((progress - 0.15) / 0.12)
  );
  const showStats = progress > 0.7;
  const showHealth = progress > 0.85;

  const events = [
    {
      icon: <Pill size={16} className="text-blue-700" />,
      bg: "bg-blue-50",
      text: "8:00 AM medication taken — Wednesday AM compartment emptied",
      status: "Completed",
      statusColor: "bg-green-50 text-green-700",
      time: "8:02 AM",
    },
    {
      icon: <ShoppingBasket size={16} className="text-amber-700" />,
      bg: "bg-amber-50",
      text: "Pantry scan: rice low, cereal empty",
      status: "Detected",
      statusColor: "bg-amber-50 text-amber-700",
      time: "9:15 AM",
    },
    {
      icon: <ShoppingCart size={16} className="text-green-700" />,
      bg: "bg-green-50",
      text: "Walmart reorder placed — rice, cereal ($18.50)",
      status: "Ordered",
      statusColor: "bg-green-50 text-green-700",
      time: "9:16 AM",
    },
    {
      icon: <AlertTriangle size={16} className="text-red-700" />,
      bg: "bg-red-50",
      text: "$450.00 charge at Best Buy flagged",
      status: "Pending",
      statusColor: "bg-amber-50 text-amber-700",
      time: "11:30 AM",
    },
    {
      icon: <Pill size={16} className="text-blue-700" />,
      bg: "bg-blue-50",
      text: "8:00 PM medication taken — Wednesday PM compartment emptied",
      status: "Completed",
      statusColor: "bg-green-50 text-green-700",
      time: "8:01 PM",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-start h-full px-8 pt-8 overflow-hidden">
      <FadeIn show={showHeader}>
        <h2 className="text-4xl font-bold text-stone-900 text-center mb-6">Live Dashboard</h2>
      </FadeIn>

      <div className="bg-stone-50 rounded-xl border border-stone-200 shadow-lg max-w-3xl w-full p-6 space-y-4 overflow-hidden">
        {/* Patient header */}
        <FadeIn show={showHeader}>
          <div className="bg-white rounded-lg border border-stone-200 p-4 flex items-center gap-3">
            <User size={18} className="text-stone-500" />
            <div>
              <p className="font-medium text-stone-900">Margaret Johnson</p>
              <p className="text-sm text-stone-500 flex items-center gap-1">
                <Clock size={12} /> America/New York — Last seen: Saturday, April 19 at 8:01 PM
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Events feed */}
        <FadeIn show={showEvents}>
          <div className="bg-white rounded-lg border border-stone-200 p-4">
            <p className="font-medium text-stone-900 mb-3 flex items-center gap-2">
              <Video size={16} className="text-stone-500" />
              Today&apos;s Events
            </p>
            <div className="space-y-2">
              {events.slice(0, Math.max(0, eventCount)).map((ev, i) => (
                <FadeIn key={i} show delay={0}>
                  <div className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0">
                    <div className={`w-8 h-8 rounded-full ${ev.bg} flex items-center justify-center shrink-0`}>
                      {ev.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 truncate">{ev.text}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ev.statusColor} shrink-0`}>
                      {ev.status}
                    </span>
                    <span className="text-xs text-stone-400 shrink-0 w-16 text-right">{ev.time}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Stats + Health row */}
        <div className="grid grid-cols-2 gap-4">
          <FadeIn show={showStats}>
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <p className="font-medium text-stone-900 mb-3 text-sm">Today at a Glance</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center gap-1 text-stone-500 mb-1">
                    <Pill size={14} />
                    <span className="text-xs">Meds</span>
                  </div>
                  <p className="text-2xl font-bold text-stone-900">2</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-stone-500 mb-1">
                    <ShoppingCart size={14} />
                    <span className="text-xs">Pantry</span>
                  </div>
                  <p className="text-2xl font-bold text-stone-900">1</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-stone-500 mb-1">
                    <AlertTriangle size={14} />
                    <span className="text-xs">Flagged</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">1</p>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn show={showHealth}>
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <p className="font-medium text-stone-900 mb-3 text-sm flex items-center gap-1">
                <Wifi size={14} className="text-stone-500" /> System Status
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-700">Pill Cam</span>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-700">Pantry Cam</span>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 5: iMessage Agent                                           */
/* ------------------------------------------------------------------ */

const IMessageScene: Scene["component"] = ({ progress }) => {
  const showTitle = progress > 0.02;

  const messages = [
    { from: "bot", text: "Mom took her 8:00 AM Aricept. Wednesday AM compartment emptied.", at: 0.1 },
    { from: "bot", text: "Pantry scan complete. Rice is low, cereal is empty. Auto-reorder placed at Walmart ($18.50).", at: 0.22 },
    { from: "bot", text: "ALERT: $450.00 charge at Best Buy flagged. Exceeds $100 limit.\nReply \"approve 42\" or \"block 42\"", at: 0.38 },
    { from: "user", text: "block 42", at: 0.55 },
    { from: "bot", text: "Transaction #42 blocked. Best Buy charge of $450.00 has been rejected.", at: 0.65 },
    { from: "user", text: "status", at: 0.78 },
    { from: "bot", text: "Today for Margaret:\n  2 med checks (all taken)\n  1 pantry reorder ($18.50)\n  1 flagged txn (blocked)\nAll systems online.", at: 0.85 },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <FadeIn show={showTitle}>
        <h2 className="text-4xl font-bold text-stone-900 text-center mb-2">
          The iMessage Agent
        </h2>
        <p className="text-base text-stone-500 text-center mb-8">
          Powered by Photon Spectrum — no app install needed
        </p>
      </FadeIn>

      <div className="bg-stone-100 rounded-2xl border border-stone-300 shadow-xl max-w-md w-full overflow-hidden">
        {/* iMessage header */}
        <div className="bg-stone-200 px-4 py-3 flex items-center gap-3 border-b border-stone-300">
          <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center">
            <MessageCircle size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">NannyCam</p>
            <p className="text-xs text-stone-500">iMessage</p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 min-h-[380px]">
          {messages.map((msg, i) =>
            progress > msg.at ? (
              <FadeIn key={i} show delay={0}>
                <div className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.from === "user"
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-white text-stone-800 border border-stone-200 rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </FadeIn>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 6: Architecture                                             */
/* ------------------------------------------------------------------ */

const ArchScene: Scene["component"] = ({ progress }) => {
  const showTitle = progress > 0.02;
  const showStack = progress > 0.2;
  const showFlow = progress > 0.5;

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
            <FadeIn key={i} show={showStack} delay={i * 150}>
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
/*  Scene 7: Closing                                                  */
/* ------------------------------------------------------------------ */

const ClosingScene: Scene["component"] = ({ progress }) => {
  const showMain = progress > 0.05;
  const showTagline = progress > 0.4;

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
/*  Main orchestrator                                                  */
/* ------------------------------------------------------------------ */

const SCENES: Scene[] = [
  { id: "title", duration: 8000, component: TitleScene },
  { id: "pillars", duration: 8000, component: PillarsScene },
  { id: "onboarding", duration: 10000, component: OnboardingScene },
  { id: "dashboard", duration: 12000, component: DashboardScene },
  { id: "imessage", duration: 14000, component: IMessageScene },
  { id: "arch", duration: 8000, component: ArchScene },
  { id: "closing", duration: 6000, component: ClosingScene },
];

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
      ? startTime - (startTime - pauseOffset) + (pauseOffset)
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
  const overallProgress = Math.min(1, elapsed / totalDuration);
  const isFinished = elapsed >= totalDuration;

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
            <p className="text-stone-500">2-minute animated walkthrough — press play to begin</p>
            <button
              onClick={start}
              className="rounded-full bg-stone-900 text-white px-8 py-3 text-lg font-medium hover:bg-stone-800 transition-colors"
            >
              Play Demo
            </button>
            <p className="text-sm text-stone-400 mt-2">
              Tip: Use OBS or QuickTime to screen-record this page
            </p>
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

          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-900 rounded-full transition-all duration-100"
              style={{ width: `${overallProgress * 100}%` }}
            />
          </div>

          {/* Scene indicator */}
          <div className="flex gap-1.5">
            {SCENES.map((s, i) => (
              <div
                key={s.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentSceneIdx
                    ? "bg-stone-900"
                    : i < currentSceneIdx
                    ? "bg-stone-400"
                    : "bg-stone-200"
                }`}
              />
            ))}
          </div>

          <span className="text-xs text-stone-400 w-20 text-right font-mono">
            {Math.floor(elapsed / 60000)}:{String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0")} / {Math.floor(totalDuration / 60000)}:{String(Math.floor((totalDuration % 60000) / 1000)).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}
