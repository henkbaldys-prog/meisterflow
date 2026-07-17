"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import AngebotGelesenStatus from "@/components/AngebotGelesenStatus";
import FollowUpDashboardCard from "@/components/FollowUpDashboardCard";
import MahnungDashboardCard from "@/components/MahnungDashboardCard";
import {
  Users,
  FileText,
  CalendarDays,
  Sparkles,
  AlertCircle,
  EyeOff,
} from "lucide-react";
import { formatCurrency, formatDate, isToday, isWithinLast30Days, daysSince, getTimeGreeting, todayISO } from "@/lib/utils";
import { getKundeName } from "@/lib/kunde-utils";
import { isUnpaidRechnung } from "@/lib/mahnung";
import Link from "next/link";

export default function DashboardPage() {
  const { kunden, angebote, rechnungen, termine, firmenprofil, profilUnvollstaendig, loading, followUps } = useData();
  const [kiHinweis, setKiHinweis] = useState<string | null>(null);
  const [kiLoading, setKiLoading] = useState(false);

  const ungeöffneteAngebote = useMemo(
    () => angebote.filter((a) => a.status === "versendet" && !a.gelesen_am),
    [angebote],
  );

  const stats = useMemo(() => {
    const offeneAngebote = angebote.filter((a) => a.status === "entwurf").length;
    const unbezahlteRechnungen = rechnungen.filter((r) => isUnpaidRechnung(r.status)).length;
    const heutigeTermine = termine.filter((t) => isToday(t.datum)).length;
    const neueKunden = kunden.filter((k) => isWithinLast30Days(k.created_at)).length;

    return {
      offeneAngebote,
      unbezahlteRechnungen,
      heutigeTermine,
      neueKunden,
      ungeöffneteAngebote: ungeöffneteAngebote.length,
    };
  }, [angebote, rechnungen, termine, kunden, ungeöffneteAngebote]);

  const aeltesteOffeneAngebote = useMemo(
    () =>
      angebote
        .filter((a) => a.status === "entwurf")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(0, 3)
        .map((a) => ({
          nummer: a.nummer,
          betreff: a.betreff,
          kunde: a.kunde ? getKundeName(a.kunde) : "Unbekannt",
          tage_offen: daysSince(a.created_at),
          brutto: a.brutto,
        })),
    [angebote],
  );

  const ungeöffneteFuerKi = useMemo(
    () =>
      ungeöffneteAngebote.slice(0, 5).map((a) => ({
        nummer: a.nummer,
        betreff: a.betreff,
        kunde: a.kunde ? getKundeName(a.kunde) : "Unbekannt",
        tage_offen: daysSince(a.created_at),
        brutto: a.brutto,
      })),
    [ungeöffneteAngebote],
  );

  const ueberfaelligeRechnungen = useMemo(() => {
    const today = todayISO();
    return rechnungen
      .filter(
        (r) =>
          isUnpaidRechnung(r.status) &&
          (r.status === "ueberfaellig" || r.faellig_am < today),
      )
      .slice(0, 5)
      .map((r) => ({
        nummer: r.nummer,
        betreff: r.betreff,
        kunde: r.kunde ? getKundeName(r.kunde) : "Unbekannt",
        brutto: r.brutto,
        faellig_am: r.faellig_am,
        tage_ueberfaellig: daysSince(r.faellig_am),
      }));
  }, [rechnungen]);

  const recentAngebote = useMemo(() => angebote.slice(0, 5), [angebote]);
  const recentRechnungen = useMemo(() => rechnungen.slice(0, 5), [rechnungen]);
  const upcomingTermine = useMemo(() => {
    const today = todayISO();
    return termine.filter((t) => t.datum >= today).slice(0, 5);
  }, [termine]);

  const nachfassenTipp = useMemo(() => {
    if (ungeöffneteAngebote.length === 0) return null;
    const first = ungeöffneteAngebote[0];
    const name = first.kunde ? getKundeName(first.kunde) : "dem Kunden";
    return `Bei ${name} nachfassen?`;
  }, [ungeöffneteAngebote]);

  useEffect(() => {
    if (loading) return;

    const fetchKiHinweis = async () => {
      setKiLoading(true);
      try {
        const res = await fetch("/api/ki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "tagesuebersicht",
            zahlen: stats,
            aeltesteOffeneAngebote,
            ueberfaelligeRechnungen,
            ungeöffneteAngebote: ungeöffneteFuerKi,
          }),
        });
        const data = await res.json();
        if (res.ok && data.text) {
          setKiHinweis(data.text);
        } else if (data.error?.includes("Rate limit")) {
          setKiHinweis("KI-Limit erreicht – morgen gibt es wieder einen Tipp.");
        } else {
          setKiHinweis(null);
        }
      } catch {
        setKiHinweis(null);
      } finally {
        setKiLoading(false);
      }
    };

    fetchKiHinweis();
  }, [loading, stats, aeltesteOffeneAngebote, ueberfaelligeRechnungen, ungeöffneteFuerKi]);

  const greeting = getTimeGreeting();
  const displayName = firmenprofil?.firmenname && !profilUnvollstaendig ? firmenprofil.firmenname : null;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          {displayName ? `${greeting}, ${displayName}!` : `${greeting}!`}
        </h1>
        <p className="mt-1 text-dark-500">Übersicht deines Handwerksbetriebs</p>
        {profilUnvollstaendig && (
          <p className="mt-3 text-sm text-amber-300">
            Bitte{" "}
            <Link href="/einstellungen" className="font-medium underline hover:text-amber-200">
              Firmenprofil vervollständigen
            </Link>
            , damit Angebote und Rechnungen mit deinen Daten erscheinen.
          </p>
        )}
      </div>

      {/* Mahnungen zuerst – must-have, mobil prominent */}
      <MahnungDashboardCard />

      {ungeöffneteAngebote.length > 0 && (
        <Link
          href="/angebote?filter=versendet"
          className="card block border-amber-500/30 bg-amber-500/5 transition-colors hover:border-amber-500/50 min-h-[48px] touch-manipulation"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
              <EyeOff className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-200">
                {ungeöffneteAngebote.length === 1
                  ? "1 Angebot noch nicht geöffnet"
                  : `${ungeöffneteAngebote.length} Angebote noch nicht geöffnet`}
              </p>
              {nachfassenTipp && (
                <p className="mt-1 text-sm text-dark-300">KI-Tipp: {nachfassenTipp}</p>
              )}
              <ul className="mt-2 space-y-1">
                {ungeöffneteAngebote.slice(0, 3).map((a) => (
                  <li key={a.id} className="truncate text-xs text-dark-400">
                    {a.kunde ? getKundeName(a.kunde) : "Unbekannt"} · {a.nummer} ·{" "}
                    {formatCurrency(a.brutto)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Link>
      )}

      <FollowUpDashboardCard followUps={followUps} />

      <div className="card border-brand-500/20 bg-brand-500/5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
            <Sparkles className="h-5 w-5 text-brand-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-brand-300">KI-Tipp für heute</p>
            {kiLoading ? (
              <p className="mt-1 text-sm text-dark-400">Analysiere deine Zahlen...</p>
            ) : kiHinweis ? (
              <p className="mt-1 text-sm text-dark-200">{kiHinweis}</p>
            ) : nachfassenTipp ? (
              <p className="mt-1 text-sm text-dark-200">
                {ungeöffneteAngebote.length} Angebot
                {ungeöffneteAngebote.length === 1 ? "" : "e"} noch nicht geöffnet – {nachfassenTipp}
              </p>
            ) : (
              <p className="mt-1 text-sm text-dark-500">
                Alles im grünen Bereich – oder KI gerade nicht erreichbar.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/angebote?filter=offen"
          className="block min-h-[48px] select-none touch-manipulation rounded-xl transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <StatCard
            title="Offene Angebote"
            value={stats.offeneAngebote.toString()}
            subtitle="Status: Entwurf"
            icon={FileText}
            color="brand"
          />
        </Link>
        <Link
          href="/rechnungen?filter=unbezahlt"
          className="block min-h-[48px] select-none touch-manipulation rounded-xl transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <StatCard
            title="Unbezahlte Rechnungen"
            value={stats.unbezahlteRechnungen.toString()}
            subtitle="Versendet oder überfällig"
            icon={AlertCircle}
            color="red"
          />
        </Link>
        <Link
          href="/termine?filter=heute"
          className="block min-h-[48px] select-none touch-manipulation rounded-xl transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <StatCard
            title="Heutige Termine"
            value={stats.heutigeTermine.toString()}
            subtitle="Für heute geplant"
            icon={CalendarDays}
            color="blue"
          />
        </Link>
        <Link
          href="/kunden?filter=neu"
          className="block min-h-[48px] select-none touch-manipulation rounded-xl transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <StatCard
            title="Neue Kunden"
            value={stats.neueKunden.toString()}
            subtitle="Letzte 30 Tage"
            icon={Users}
            color="green"
          />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Neueste Angebote</h3>
            <Link href="/angebote" className="text-sm text-brand-400 hover:text-brand-300">
              Alle anzeigen →
            </Link>
          </div>
          <div className="space-y-3">
            {recentAngebote.length === 0 ? (
              <p className="text-sm text-dark-500">Noch keine Angebote erstellt.</p>
            ) : (
              recentAngebote.map((angebot) => (
                <div
                  key={angebot.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-dark-900 p-3 transition-colors hover:bg-dark-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{angebot.betreff}</p>
                    <p className="text-xs text-dark-500">
                      {angebot.kunde ? getKundeName(angebot.kunde) : "Unbekannt"} •{" "}
                      {formatDate(angebot.created_at)}
                    </p>
                    {angebot.status !== "entwurf" && (
                      <div className="mt-1">
                        <AngebotGelesenStatus gelesenAm={angebot.gelesen_am} compact />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium text-white">
                      {formatCurrency(angebot.brutto)}
                    </span>
                    <StatusBadge status={angebot.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Neueste Rechnungen</h3>
            <Link href="/rechnungen" className="text-sm text-brand-400 hover:text-brand-300">
              Alle anzeigen →
            </Link>
          </div>
          <div className="space-y-3">
            {recentRechnungen.length === 0 ? (
              <p className="text-sm text-dark-500">Noch keine Rechnungen erstellt.</p>
            ) : (
              recentRechnungen.map((rechnung) => (
                <div
                  key={rechnung.id}
                  className="flex items-center justify-between rounded-lg bg-dark-900 p-3 transition-colors hover:bg-dark-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{rechnung.betreff}</p>
                    <p className="text-xs text-dark-500">
                      {rechnung.kunde ? getKundeName(rechnung.kunde) : "Unbekannt"} • Fällig:{" "}
                      {formatDate(rechnung.faellig_am)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium text-white">
                      {formatCurrency(rechnung.brutto)}
                    </span>
                    <StatusBadge status={rechnung.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Kommende Termine</h3>
          <Link href="/termine" className="text-sm text-brand-400 hover:text-brand-300">
            Alle anzeigen →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingTermine.length === 0 ? (
            <p className="col-span-full text-sm text-dark-500">Keine anstehenden Termine.</p>
          ) : (
            upcomingTermine.map((termin) => (
              <div key={termin.id} className="rounded-lg border border-dark-700 bg-dark-900 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{termin.titel}</p>
                    <p className="mt-1 text-xs text-dark-500">
                      {formatDate(termin.datum)} • {termin.uhrzeit_von} – {termin.uhrzeit_bis}
                    </p>
                    {termin.kunde && (
                      <p className="mt-1 text-xs text-brand-400">{getKundeName(termin.kunde)}</p>
                    )}
                    {termin.ort && <p className="mt-1 text-xs text-dark-500">{termin.ort}</p>}
                  </div>
                  <StatusBadge status={termin.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
