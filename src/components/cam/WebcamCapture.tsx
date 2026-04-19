"use client";

import { useEffect, useRef, useState } from "react";

interface WebcamCaptureProps {
  kind: "pill" | "pantry";
  auto?: boolean;
  motionThreshold?: number;
}

type Status =
  | { type: "idle" }
  | { type: "analyzing" }
  | { type: "ok"; summary: string }
  | { type: "error"; message: string };

export default function WebcamCapture({ kind, auto = false, motionThreshold = 0.02 }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const lastMotionRef = useRef<number>(0);
  const lastScheduledCaptureRef = useRef<string | null>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [cameraReady, setCameraReady] = useState(false);

  // Heartbeat: POST /api/health/heartbeat every 60s when camera is active
  useEffect(() => {
    if (!cameraReady) return;
    function sendHeartbeat() {
      fetch("/api/health/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ camKind: kind }),
      }).catch(() => {});
    }
    sendHeartbeat();
    const id = setInterval(sendHeartbeat, 60_000);
    return () => clearInterval(id);
  }, [cameraReady, kind]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        setStatus({ type: "error", message: `Camera error: ${(err as Error).message}` });
      }
    }

    startCamera();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);

    setStatus({ type: "analyzing" });

    try {
      const res = await fetch(`/api/vision/capture?kind=${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus({ type: "ok", summary: json.summary });
      } else {
        setStatus({ type: "error", message: json.error ?? "Unknown error" });
      }
    } catch (err) {
      setStatus({ type: "error", message: (err as Error).message });
    }
  }

  useEffect(() => {
    if (!auto || !cameraReady) return;

    function getFrameData(): ImageData | null {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return null;
      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);
      return ctx.getImageData(0, 0, w, h);
    }

    function hasMotion(a: ImageData, b: ImageData): boolean {
      const total = a.data.length / 4;
      let changed = 0;
      for (let i = 0; i < a.data.length; i += 4) {
        const ba = (a.data[i]! + a.data[i + 1]! + a.data[i + 2]!) / 3;
        const bb = (b.data[i]! + b.data[i + 1]! + b.data[i + 2]!) / 3;
        if (Math.abs(ba - bb) > 30) changed++;
      }
      return changed / total > motionThreshold;
    }

    const id = setInterval(() => {
      const frame = getFrameData();
      if (!frame) return;
      const prev = prevFrameRef.current;
      prevFrameRef.current = frame;
      if (!prev) return;
      if (hasMotion(prev, frame)) {
        const now = Date.now();
        if (now - lastMotionRef.current > 60_000) {
          lastMotionRef.current = now;
          capture();
        }
      }
    }, 2_000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, cameraReady, motionThreshold]);

  // Schedule-triggered capture — pill cam only, ±10 min around each dose_time
  useEffect(() => {
    if (!auto || kind !== "pill" || !cameraReady) return;

    async function fetchAndCheck() {
      let doseTimes: string[] = [];
      try {
        const res = await fetch("/api/patient/schedule");
        const json = await res.json();
        if (json.ok) doseTimes = json.doseTimes as string[];
      } catch {
        return;
      }

      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      for (const t of doseTimes) {
        const [hStr, mStr] = t.split(":");
        const doseMinutes = parseInt(hStr!, 10) * 60 + parseInt(mStr!, 10);
        if (Math.abs(nowMinutes - doseMinutes) <= 10) {
          // deduplicate: one capture per dose window (keyed as "HH:MM")
          if (lastScheduledCaptureRef.current !== t) {
            lastScheduledCaptureRef.current = t;
            capture();
          }
          break;
        }
      }
    }

    const id = setInterval(fetchAndCheck, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, kind, cameraReady]);

  return (
    <div className="space-y-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg border border-stone-200 bg-stone-100"
      />
      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={capture}
        disabled={!cameraReady || status.type === "analyzing"}
        className="rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status.type === "analyzing" ? "Analyzing…" : "Capture & analyze"}
      </button>

      {status.type === "ok" && (
        <p className="text-sm text-green-700">✓ {status.summary}</p>
      )}
      {status.type === "error" && (
        <p className="text-sm text-red-700">✗ Error: {status.message}</p>
      )}
    </div>
  );
}
