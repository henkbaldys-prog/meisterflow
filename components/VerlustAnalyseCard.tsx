"use client";

import { useMemo } from "react";
import { TrendingDown, Lightbulb } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { computeVerlustAnalyse } from "@/lib/enterprise-analytics";
import { formatCurrency } from "@/lib/utils";

export default function VerlustAnalyseCard() {
  const { angebote, followUps } = useData();
  const analyse = useMemo(
    () => computeVerlustAnalyse(angebote, followUps),
    [angebote, followUps],
  );

  const maxBar = Math.max(
    1,
    ...analyse.chart.flatMap((c) => [c.gewonnen, c.verloren]),
  );

  return (
    <div className="card border-danger/20 bg-gradient-to-br from-danger/10 via-dark-900 to-dark-900">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-danger/15 text-danger">
          <TrendingDown className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium uppercase tracking-wide text-dark-400">
            Verlust-Analyse
          </p>
          <p className="kpi mt-1 text-3xl text-danger sm:text-4xl">
            {formatCurrency(analyse.verlorenMonat)}
          </p>
          <p className="mt-1 text-sm text-dark-300">Diesen Monat verloren / gefährdet</p>
          <p className="mt-2 text-sm font-medium text-dark-200">{analyse.grund}</p>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-wide text-dark-500">
          Gewonnen vs. Verloren (6 Monate)
        </p>
        <div className="flex h-36 items-end gap-2 sm:gap-3">
          {analyse.chart.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-28 w-full items-end justify-center gap-0.5">
                <div
                  className="w-[45%] rounded-t-sm bg-success/70 min-h-[2px]"
                  style={{ height: `${(m.gewonnen / maxBar) * 100}%` }}
                  title={`Gewonnen: ${formatCurrency(m.gewonnen)}`}
                />
                <div
                  className="w-[45%] rounded-t-sm bg-danger/70 min-h-[2px]"
                  style={{ height: `${(m.verloren / maxBar) * 100}%` }}
                  title={`Verloren: ${formatCurrency(m.verloren)}`}
                />
              </div>
              <span className="text-[10px] text-dark-500">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-[11px] text-dark-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-success/70" /> Gewonnen
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-danger/70" /> Verloren
          </span>
        </div>
      </div>

      <div className="mt-5 flex gap-2 rounded-btn border border-brand-500/20 bg-brand-500/5 p-3">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
        <p className="text-sm text-dark-200">
          <span className="font-medium text-brand-300">KI-Tipp: </span>
          {analyse.kiTipp}
        </p>
      </div>
    </div>
  );
}
