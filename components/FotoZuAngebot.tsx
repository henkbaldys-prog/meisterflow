"use client";

import { useRef, useState } from "react";
import { X, Camera, ImagePlus, Loader2, AlertTriangle, RotateCcw, FileText } from "lucide-react";
import { FotoAngebotData } from "@/types";
import { AngebotInitialData } from "@/types";
import { fotoToInitialData } from "@/lib/angebot-initial";

interface FotoZuAngebotProps {
  onClose: () => void;
  onAdopt: (data: AngebotInitialData) => void;
}

type Step = "select" | "processing" | "result";

const MAX_BYTES = 5 * 1024 * 1024;

export default function FotoZuAngebot({ onClose, onAdopt }: FotoZuAngebotProps) {
  const [step, setStep] = useState<Step>("select");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [result, setResult] = useState<FotoAngebotData | null>(null);
  const [angebotsvorschlag, setAngebotsvorschlag] = useState("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Bitte ein Bild auswählen (JPG, PNG, WebP).");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("Bild zu groß – maximal 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setMimeType(file.type);
      setStep("processing");

      const base64 = dataUrl.split(",")[1];

      try {
        const res = await fetch("/api/ki/foto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        });

        const json = await res.json();

        if (!res.ok) {
          if (res.status === 429) {
            setError("Limit erreicht (20/h). Bitte später erneut versuchen.");
          } else {
            setError(json.error || "Bildanalyse fehlgeschlagen");
          }
          setStep("select");
          return;
        }

        setResult(json.data);
        setAngebotsvorschlag(json.data.angebotsvorschlag || "");
        setStep("result");
      } catch {
        setError(
          navigator.onLine
            ? "Netzwerkfehler – Server nicht erreichbar"
            : "Netzwerkfehler – bitte Internetverbindung prüfen",
        );
        setStep("select");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const reset = () => {
    setStep("select");
    setError(null);
    setPreview(null);
    setResult(null);
    setAngebotsvorschlag("");
  };

  const handleAdopt = () => {
    if (!result) return;
    onAdopt(fotoToInitialData(result, angebotsvorschlag));
    onClose();
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
          <h2 className="text-xl font-bold text-white">📷 Per Foto erstellen</h2>
          <p className="mt-1 text-sm text-dark-500">Baustellenfoto analysieren – KI schlägt ein Angebot vor</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {step === "select" && (
          <div className="space-y-4 pb-4">
            {preview && (
              <img
                src={preview}
                alt="Vorschau"
                className="mx-auto h-32 w-32 rounded-lg object-cover border border-dark-700"
              />
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="btn-primary min-h-[48px] flex-1 justify-center"
              >
                <Camera className="h-5 w-5" />
                Foto aufnehmen
              </button>
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="btn-secondary min-h-[48px] flex-1 justify-center"
              >
                <ImagePlus className="h-5 w-5" />
                Foto hochladen
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <p className="text-center text-xs text-dark-500">Max. 5 MB • JPG, PNG, WebP</p>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center py-12">
            {preview && (
              <img
                src={preview}
                alt="Analyse"
                className="mb-4 h-24 w-24 rounded-lg object-cover opacity-60"
              />
            )}
            <Loader2 className="h-12 w-12 animate-spin text-brand-400" />
            <p className="mt-4 text-sm text-dark-400">KI analysiert das Baustellenfoto...</p>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4 pb-4">
            {preview && (
              <img
                src={preview}
                alt="Baustelle"
                className="h-20 w-20 rounded-lg object-cover border border-dark-700"
              />
            )}

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <p className="text-sm text-amber-200">
                <strong>KI-Schätzung – bitte vor Ort prüfen!</strong>
                <br />
                {result.hinweis}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-brand-300">Beschreibung</p>
              <p className="mt-1 text-sm text-dark-200">{result.beschreibung}</p>
            </div>

            {result.arbeiten?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-dark-400">Arbeiten</p>
                <ul className="mt-1 list-inside list-disc text-sm text-dark-300">
                  {result.arbeiten.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.materialien?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-dark-400">Materialien</p>
                <ul className="mt-1 list-inside list-disc text-sm text-dark-300">
                  {result.materialien.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg bg-dark-900 p-3">
              <p className="text-xs text-dark-500">Geschätzter Aufwand</p>
              <p className="text-sm text-dark-200">{result.geschätzter_aufwand}</p>
            </div>

            <div>
              <label className="label">Angebotsvorschlag (bearbeitbar)</label>
              <textarea
                value={angebotsvorschlag}
                onChange={(e) => setAngebotsvorschlag(e.target.value)}
                className="input min-h-[120px] resize-y"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button onClick={reset} className="btn-secondary min-h-[48px] flex-1 justify-center">
                <RotateCcw className="h-5 w-5" />
                Neues Foto
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
