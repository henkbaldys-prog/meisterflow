"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Mic, Square, Loader2, RotateCcw, FileText } from "lucide-react";
import { SpracheAngebotData } from "@/types";
import { spracheToInitialData } from "@/lib/angebot-initial";
import { AngebotInitialData } from "@/types";

interface SpracheZuAngebotProps {
  onClose: () => void;
  onAdopt: (data: AngebotInitialData) => void;
}

type Step = "idle" | "recording" | "processing" | "result";

const MAX_SECONDS = 60;

export default function SpracheZuAngebot({ onClose, onAdopt }: SpracheZuAngebotProps) {
  const [step, setStep] = useState<Step>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpracheAngebotData | null>(null);
  const [transcript, setTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    recorder.onstop = async () => {
      cleanup();
      setStep("processing");

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });

      try {
        const formData = new FormData();
        formData.append("audio", blob, "aufnahme.webm");

        const res = await fetch("/api/ki/sprache", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          if (res.status === 422) {
            setError("Sprache nicht erkannt – bitte deutlicher sprechen und nochmal versuchen.");
          } else if (res.status === 429) {
            setError("Limit erreicht (30/h). Bitte später erneut versuchen.");
          } else if (!navigator.onLine) {
            setError("Netzwerkfehler – bitte Internetverbindung prüfen.");
          } else {
            setError(json.error || "Verarbeitung fehlgeschlagen");
          }
          setStep("idle");
          return;
        }

        setTranscript(json.transcript || "");
        setResult(json.data);
        setStep("result");
      } catch {
        setError(
          navigator.onLine
            ? "Netzwerkfehler – Server nicht erreichbar"
            : "Netzwerkfehler – bitte Internetverbindung prüfen",
        );
        setStep("idle");
      }
    };

    recorder.stop();
  }, [cleanup]);

  const startRecording = async () => {
    setError(null);
    setResult(null);
    setTranscript("");
    setSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
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
    setResult(null);
    setTranscript("");
    setSeconds(0);
    cleanup();
  };

  const handleAdopt = () => {
    if (!result) return;
    onAdopt(spracheToInitialData(result));
    onClose();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

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
          <h2 className="text-xl font-bold text-white">🎙️ Per Sprache erstellen</h2>
          <p className="mt-1 text-sm text-dark-500">Sprich dein Angebot – KI extrahiert die Details</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {(step === "idle" || step === "recording") && (
          <div className="flex flex-col items-center py-6">
            {step === "recording" && (
              <p className="mb-4 text-2xl font-mono font-bold text-brand-400">{formatTime(seconds)}</p>
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
                onClick={stopRecording}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/30 transition-transform hover:scale-105 active:scale-95 min-h-[80px] min-w-[80px]"
                aria-label="Aufnahme stoppen"
              >
                <Square className="h-8 w-8 fill-current" />
              </button>
            )}

            <p className="mt-4 text-sm text-dark-500">
              {step === "idle"
                ? "Tippe zum Starten (max. 60 Sekunden)"
                : "Tippe zum Stoppen und Verarbeiten"}
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
                { label: "Leistung", value: result.leistung },
                { label: "Material", value: result.material },
                { label: "Menge", value: result.menge },
                { label: "Besonderheiten", value: result.besonderheiten || "–" },
                {
                  label: "Dauer (Std.)",
                  value: result.geschätzte_dauer_stunden?.toString() || "–",
                },
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
                <FileText className="h-5 w-5" />
                Als Angebot übernehmen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
