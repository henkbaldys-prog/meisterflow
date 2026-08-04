"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { computePreisvorschlag } from "@/lib/enterprise-analytics";
import { formatCurrency } from "@/lib/utils";

type Props = {
  betreff: string;
  beschreibung: string;
  netto: number;
  onApply: (netto: number) => void;
};

export default function PreisvorschlagHint({ betreff, beschreibung, netto, onApply }: Props) {
  const { angebote } = useData();
  const vorschlag = useMemo(
    () => computePreisvorschlag(angebote, betreff, beschreibung, netto),
    [angebote, betreff, beschreibung, netto],
  );

  if (!vorschlag) return null;

  return (
    <div className="rounded-btn border border-brand-500/25 bg-brand-500/5 p-3 sm:p-4">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-300">Preisvorschlag-KI</p>
          <p className="mt-1 text-sm text-dark-300">{vorschlag.hinweis}</p>
          <p className="mt-2 text-sm text-dark-200">
            Empfehlung:{" "}
            <span className="kpi text-dark-50">
              {formatCurrency(vorschlag.empfehlungMin)} – {formatCurrency(vorschlag.empfehlungMax)}
            </span>{" "}
            <span className="text-dark-500">({vorschlag.aehnlichCount} ähnlich)</span>
          </p>
          <button
            type="button"
            onClick={() => onApply(vorschlag.empfehlung)}
            className="btn-primary mt-3 min-h-[44px] text-xs"
          >
            Empfohlenen Preis übernehmen ({formatCurrency(vorschlag.empfehlung)})
          </button>
        </div>
      </div>
    </div>
  );
}
