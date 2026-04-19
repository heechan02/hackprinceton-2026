"use client";

import { useEffect, useRef, useState } from "react";

interface WebcamCaptureProps {
  kind: "pill" | "pantry";
  auto?: boolean;
}

type Status =
  | { type: "idle" }
  | { type: "analyzing" }
  | { type: "ok"; summary: string }
  | { type: "error"; message: string };

export default function WebcamCapture({ kind, auto = false }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [cameraReady, setCameraReady] = useState(false);

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
    const id = setInterval(capture, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, cameraReady]);

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
