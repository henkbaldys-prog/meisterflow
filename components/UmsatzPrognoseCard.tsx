"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { computeUmsatzPrognose } from "@/lib/enterprise-analytics";
import { formatCurrency } from "@/lib/utils";

export default function UmsatzPrognoseCard() {
  const { angebote } = useData();
  const p = useMemo(() => computeUmsatzPrognose(angebote), [angebote]);

  if (p.offeneAnzahl === 0) {
    return (
      <div className="card">
        <p className="text-[12px] font-medium uppercase tracking-wide text-dark-400">
          Umsatz-Prognose
        </p>
        <p className="mt-2 text-sm text-dark-500">
          Keine offenen Angebote – erstelle eines, um die Prognose zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="card border-brand-500/20">
      <div className="flex items-start gap-3">
        <div className="icon-box">
          <TrendingUp className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium uppercase tracking-wide text-dark-400">
            Umsatz-Prognose
          </p>
          <p className="mt-2 text-sm text-dark-300">
            Basierend auf {p.offeneAnzahl} offenen Angebot{p.offeneAnzahl === 1 ? "" : "en"}:
          </p>
          <p className="kpi mt-2 text-2xl text-dark-50 sm:text-3xl">
            {formatCurrency(p.potenzial)}
          </p>
          <p className="text-sm text-dark-500">potenzieller Umsatz</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-btn border border-white/[0.06] bg-dark-950/40 p-3">
          <p className="text-[11px] uppercase tracking-wide text-dark-500">Wahrscheinlichkeit</p>
          <p className="kpi mt-1 text-xl text-brand-300">{p.wahrscheinlichkeit}%</p>
          <p className="mt-1 text-sm text-dark-400">
            = {formatCurrency(p.realistisch)} realistisch
          </p>
        </div>
        <div className="rounded-btn border border-success/20 bg-success/5 p-3">
          <p className="text-[11px] uppercase tracking-wide text-dark-500">Mit besserem Follow-up</p>
          <p className="kpi mt-1 text-xl text-success">+{formatCurrency(p.plusDurchFollowUp)}</p>
          <p className="mt-1 text-sm text-dark-400">
            Ziel: {formatCurrency(p.mitFollowUp)}
          </p>
        </div>
      </div>
    </div>
  );
}
