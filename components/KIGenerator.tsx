"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, Wand2 } from "lucide-react";
import toast from "react-hot-toast";

interface KIGeneratorProps {
  onGenerated: (text: string) => void;
  kundenName?: string;
  context?: string;
}

export default function KIGenerator({ onGenerated, kundenName = "", context = "" }: KIGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) {
      toast.error("Bitte gib eine Beschreibung ein");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "angebot",
          beschreibung: prompt,
          kundenName,
          context,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setResult(data.text);
      toast.success("Angebot generiert!");
    } catch (error: any) {
      toast.error(error.message || "Fehler bei der Generierung");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Kopiert!");
  };

  const handleUse = () => {
    onGenerated(result);
    toast.success("In das Formular übernommen!");
  };

  const quickPrompts = [
    "Neue Elektroinstallation Einfamilienhaus, ca. 200m²",
    "Wasserhahn austauschen in Küche, inkl. Material",
    "Dachreparatur nach Sturmschaden, ca. 5m²",
    "Gartenpflege Rasen mähen, Hecken schneiden, ca. 500m²",
    "Malern Wohnzimmer 40m², 2 Anstriche, inkl. Material",
  ];

  return (
    <div className="card border-brand-500/20 bg-brand-950/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">KI-Angebotsgenerator</h3>
          <p className="text-xs text-dark-500">Beschreibe den Auftrag – die KI macht den Rest</p>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => setPrompt(qp)}
            className="text-xs bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-dark-200 px-3 py-1.5 rounded-full transition-colors"
          >
            {qp.length > 35 ? qp.slice(0, 35) + "..." : qp}
          </button>
        ))}
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="z.B.: Neue Elektroinstallation für ein Einfamilienhaus mit 200m² Wohnfläche, 3 Zimmer, Küche, Bad. Komplette Neuverkabelung inkl. Sicherungskasten..."
        className="input min-h-[100px] resize-none mb-3"
      />

      <button
        onClick={generate}
        disabled={loading}
        className="btn-primary w-full justify-center mb-4"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generiere Angebot...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Angebot mit KI erstellen
          </>
        )}
      </button>

      {result && (
        <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-brand-400 font-medium">Generiertes Angebot</span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="text-xs text-dark-500 hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Kopiert" : "Kopieren"}
              </button>
            </div>
          </div>
          <div className="text-sm text-dark-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {result}
          </div>
          <button
            onClick={handleUse}
            className="btn-primary w-full justify-center mt-3 text-sm"
          >
            <Wand2 className="w-4 h-4" />
            In Angebot übernehmen
          </button>
        </div>
      )}
    </div>
  );
}
