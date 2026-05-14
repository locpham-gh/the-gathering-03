import { useEffect, useRef, useState } from "react";

export type FacePresenceState = "present" | "absent" | "unknown";

const CHECK_INTERVAL_MS = 1000;
const DEFAULT_ABSENT_THRESHOLD_MS = 20000;
const PRESENT_THRESHOLD_MS = 1500;

function getAbsentThresholdMs() {
  const raw = import.meta.env.VITE_FACE_ABSENT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_ABSENT_THRESHOLD_MS;
  // Keep safe bounds so detection does not flap or feel unresponsive.
  return Math.min(30000, Math.max(3000, Math.floor(parsed)));
}

type FaceDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<unknown[]>;
};

declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorLike;
  }
}

export function useFacePresence() {
  const absentThresholdMsRef = useRef(getAbsentThresholdMs());
  const [presence, setPresence] = useState<FacePresenceState>("unknown");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectorRef = useRef<FaceDetectorLike | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const removeFallbackListenersRef = useRef<(() => void) | null>(null);
  const lastFaceAtRef = useRef<number | null>(null);
  const lastMissingAtRef = useRef<number | null>(null);
  const lastActivityAtRef = useRef<number>(Date.now());

  useEffect(() => {
    let isDisposed = false;

    const stopResources = () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (removeFallbackListenersRef.current) {
        removeFallbackListenersRef.current();
        removeFallbackListenersRef.current = null;
      }
    };

    const startFallbackPresence = () => {
      setPresence("present");
      const updateActivity = () => {
        lastActivityAtRef.current = Date.now();
        if (document.visibilityState === "visible") {
          setPresence("present");
        }
      };
      window.addEventListener("mousemove", updateActivity);
      window.addEventListener("keydown", updateActivity);
      window.addEventListener("pointerdown", updateActivity);
      window.addEventListener("visibilitychange", updateActivity);
      removeFallbackListenersRef.current = () => {
        window.removeEventListener("mousemove", updateActivity);
        window.removeEventListener("keydown", updateActivity);
        window.removeEventListener("pointerdown", updateActivity);
        window.removeEventListener("visibilitychange", updateActivity);
      };

      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const isHidden = document.visibilityState !== "visible";
        const idleFor = now - lastActivityAtRef.current;
        if (isHidden || idleFor >= absentThresholdMsRef.current) {
          setPresence("absent");
        }
      }, CHECK_INTERVAL_MS);
    };

    const init = async () => {
      try {
        if (typeof window === "undefined" || typeof window.FaceDetector !== "function") {
          // Fallback: activity + tab visibility based away detection.
          setPresence("present");
          setIsSupported(false);
          startFallbackPresence();
          return;
        }

        detectorRef.current = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
        setIsSupported(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
        if (isDisposed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        await video.play();
        videoRef.current = video;

        timerRef.current = window.setInterval(async () => {
          if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const now = Date.now();
            const faces = await detectorRef.current.detect(videoRef.current);
            const hasFace = Array.isArray(faces) && faces.length > 0;

            if (hasFace) {
              if (!lastFaceAtRef.current) lastFaceAtRef.current = now;
              if (now - lastFaceAtRef.current >= PRESENT_THRESHOLD_MS) {
                setPresence("present");
              }
              lastMissingAtRef.current = null;
              return;
            }

            lastFaceAtRef.current = null;
            if (!lastMissingAtRef.current) lastMissingAtRef.current = now;
            const awayFor = now - lastMissingAtRef.current;
            if (awayFor >= absentThresholdMsRef.current) {
              setPresence("absent");
            }
          } catch {
            setPresence("unknown");
          }
        }, CHECK_INTERVAL_MS);
      } catch (err: any) {
        setError(err?.message || "Failed to initialize face detection");
        setPresence("present");
        setIsSupported(false);
        startFallbackPresence();
      }
    };

    init();

    return () => {
      isDisposed = true;
      stopResources();
    };
  }, []);

  return { presence, isSupported, error };
}
