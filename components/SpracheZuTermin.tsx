"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Mic, Square, Loader2, RotateCcw, CalendarDays } from "lucide-react";
import { SpracheTerminData, TerminInitialData } from "@/types";
import { spracheToTerminInitialData } from "@/lib/termin-initial";

interface SpracheZuTerminProps {
  onClose: () => void;
  onAdopt: (data: TerminInitialData) => void;
}

type Step = "idle" | "recording" | "processing" | "result";

const MAX_SECONDS = 60;
const MIN_BYTES = 1000;
const MIN_RECORDING_SECONDS_UI = 3;

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function getMinRecordingMs(): number {
  return isIOS() ? 5000 : 3000;
}

function getMinRecordingSeconds(): number {
  return getMinRecordingMs() / 1000;
}

function getSupportedAudioMimeType(): string | null {
  const types = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
  const supported = types.find((type) => MediaRecorder.isTypeSupported(type)) || null;
  console.log("[SpracheTermin] MIME-Support:", supported, "iOS:", isIOS());
  return supported;
}

function extensionForMime(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

function sumChunkBytes(chunks: Blob[]): number {
  return chunks.reduce((sum, chunk) => sum + chunk.size, 0);
}

export default function SpracheZuTermin({ onClose, onAdopt }: SpracheZuTerminProps) {
  const [step, setStep] = useState<Step>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SpracheTerminData | null>(null);
  const [transcript, setTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const totalSizeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const minRecordingSeconds = getMinRecordingSeconds();

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    totalSizeRef.current = 0;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    if (seconds < minRecordingSeconds) {
      setError("Bitte mindestens 3 Sekunden sprechen");
      return;
    }

    const mimeType = recorder.mimeType || "audio/mp4";

    const waitForStop = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    recorder.stop();

    await waitForStop;
    await new Promise((r) => setTimeout(r, 500));

    const chunks = [...chunksRef.current];
    const totalSize = sumChunkBytes(chunks);
    console.log("[SpracheTermin] onstop – chunks:", chunks.length, "totalSize:", totalSize);

    cleanup();

    if (totalSize < MIN_BYTES) {
      setError(
        "Aufnahme zu kurz oder leer. 💡 Tipp: Auf iPhone mindestens 5 Sekunden sprechen.",
      );
      setStep("idle");
      return;
    }

    const blob = new Blob(chunks, { type: mimeType });
    setSuccessMessage(`✅ Aufnahme erfolgreich (${seconds} Sekunden)`);
    setStep("processing");

    try {
      const filename = `aufnahme.${extensionForMime(mimeType)}`;
      const formData = new FormData();
      formData.append("audio", new File([blob], filename, { type: mimeType || "audio/mp4" }));
      formData.append("ziel", "termin");

      const res = await fetch("/api/ki/sprache", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setSuccessMessage(null);
        if (res.status === 422) {
          setError("Sprache nicht erkannt – bitte deutlicher sprechen und nochmal versuchen.");
        } else if (res.status === 429) {
          setError("Limit erreicht (30/h). Bitte später erneut versuchen.");
        } else if (res.status === 400) {
          setError(json.error || "Audiodatei zu kurz oder leer. Mindestens 3 Sekunden aufnehmen.");
        } else {
          setError(json.error || "Verarbeitung fehlgeschlagen");
        }
        setStep("idle");
        return;
      }

      setTranscript(json.transcript || "");
      setResult(json.data);
      setSuccessMessage(null);
      setStep("result");
    } catch {
      setSuccessMessage(null);
      setError("Netzwerkfehler – Server nicht erreichbar");
      setStep("idle");
    }
  }, [cleanup, minRecordingSeconds, seconds]);

  const startRecording = async () => {
    setError(null);
    setSuccessMessage(null);
    setResult(null);
    setTranscript("");
    setSeconds(0);

    const mimeType = getSupportedAudioMimeType();
    if (!mimeType || typeof MediaRecorder === "undefined") {
      setError("Browser nicht unterstützt – bitte Chrome nutzen.");
      setStep("idle");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      totalSizeRef.current = 0;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          totalSizeRef.current += e.data.size;
        }
      };

      recorder.start(1000);
      setStep("recording");

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Mikrofon nicht verfügbar – bitte Zugriff in den Browser-Einstellungen erlauben.");
      setStep("idle");
      cleanup();
    }
  };

  const reset = () => {
    setStep("idle");
    setError(null);
    setSuccessMessage(null);
    setResult(null);
    setTranscript("");
    setSeconds(0);
    cleanup();
  };

  const handleAdopt = () => {
    if (!result) return;
    onAdopt(spracheToTerminInitialData(result));
    onClose();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const canStop = seconds >= minRecordingSeconds;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="card w-full max-w-lg max-h-[100dvh] md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-lg p-2 text-dark-500 hover:bg-dark-800 hover:text-white min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Schließen"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center pt-2 pb-4">
          <h2 className="text-xl font-bold text-white">🎙️ Termin per Sprache</h2>
          <p className="mt-1 text-sm text-dark-500">Sprich Datum, Uhrzeit, Kunde und Ort</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            {successMessage}
          </div>
        )}

        {(step === "idle" || step === "recording") && (
          <div className="flex flex-col items-center py-6">
            {step === "recording" && (
              <>
                <p className="mb-2 text-sm font-medium text-brand-300">
                  🎙️ Aufnahme läuft... (mindestens {MIN_RECORDING_SECONDS_UI} Sekunden)
                </p>
                <p className="mb-4 text-2xl font-mono font-bold text-brand-400">{formatTime(seconds)}</p>
              </>
            )}

            {step === "idle" ? (
              <button
                onClick={startRecording}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-transform hover:scale-105 active:scale-95 min-h-[80px] min-w-[80px]"
                aria-label="Aufnahme starten"
              >
                <Mic className="h-10 w-10" />
              </button>
            ) : (
              <button
                onClick={canStop ? stopRecording : undefined}
                disabled={!canStop}
                className={`flex h-20 w-20 items-center justify-center rounded-2xl text-white shadow-lg min-h-[80px] min-w-[80px] transition-transform ${
                  canStop
                    ? "bg-red-600 shadow-red-600/30 hover:scale-105 active:scale-95 cursor-pointer"
                    : "bg-dark-700 shadow-none opacity-50 cursor-not-allowed"
                }`}
                aria-label={canStop ? "Aufnahme stoppen" : "Noch nicht stoppen"}
              >
                <Square className={`h-8 w-8 fill-current ${canStop ? "" : "opacity-60"}`} />
              </button>
            )}

            <p className="mt-4 text-sm text-dark-500 text-center px-4 select-none">
              {step === "idle"
                ? `Tippe zum Starten (mind. ${MIN_RECORDING_SECONDS_UI} Sek.${isIOS() ? ", iPhone 5 Sek." : ""})`
                : canStop
                  ? "Tippe zum Stoppen und Verarbeiten"
                  : `Mindestens ${MIN_RECORDING_SECONDS_UI} Sekunden – noch ${minRecordingSeconds - seconds}s`}
            </p>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-brand-400" />
            <p className="mt-4 text-sm text-dark-400">Whisper transkribiert & KI analysiert...</p>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4 pb-4">
            <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
              <p className="text-sm font-medium text-brand-300">Zusammenfassung</p>
              <p className="mt-1 text-white">{result.zusammenfassung}</p>
              {transcript && (
                <p className="mt-2 text-xs text-dark-500 italic">Transkript: „{transcript}"</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Kunde", value: result.kunde_name || "–" },
                { label: "Titel", value: result.titel || "–" },
                { label: "Datum", value: result.datum || "–" },
                { label: "Von", value: result.uhrzeit_von || "–" },
                { label: "Bis", value: result.uhrzeit_bis || "–" },
                { label: "Ort", value: result.ort || "–" },
                { label: "Notizen", value: result.notizen || "–" },
              ].map((field) => (
                <div key={field.label} className="rounded-lg bg-dark-900 p-3">
                  <p className="text-xs text-dark-500">{field.label}</p>
                  <p className="mt-0.5 text-sm text-dark-200">{field.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button onClick={reset} className="btn-secondary min-h-[48px] flex-1 justify-center">
                <RotateCcw className="h-5 w-5" />
                Nochmal aufnehmen
              </button>
              <button onClick={handleAdopt} className="btn-primary min-h-[48px] flex-1 justify-center">
                <CalendarDays className="h-5 w-5" />
                Als Termin übernehmen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
