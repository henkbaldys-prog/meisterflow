"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { DashboardSkeleton } from "@/components/Skeleton";
import { Mic, Camera, FileText, Receipt, ArrowRight } from "lucide-react";
import { formatCurrency, formatDate, getTimeGreeting } from "@/lib/utils";
import { getKundeName } from "@/lib/kunde-utils";
import AngebotForm from "@/components/AngebotForm";
import SpracheZuAngebot from "@/components/SpracheZuAngebot";
import FotoZuAngebot from "@/components/FotoZuAngebot";
import { AngebotInitialData } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { angebote, rechnungen, firmenprofil, profilUnvollstaendig, loading } = useData();
  const [showSprache, setShowSprache] = useState(false);
  const [showFoto, setShowFoto] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formInitial, setFormInitial] = useState<AngebotInitialData | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);

  const greeting = getTimeGreeting();
  const displayName =
    firmenprofil?.firmenname && !profilUnvollstaendig ? firmenprofil.firmenname : null;

  const letzteAngebote = useMemo(
    () =>
      [...angebote]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [angebote],
  );

  const rechnungFaellig = useMemo(() => {
    const already = new Set(
      rechnungen.map((r) => r.angebots_id).filter(Boolean) as string[],
    );
    return angebote
      .filter((a) => a.status === "angenommen" && !already.has(a.id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [angebote, rechnungen]);

  const openSprache = () => {
    setPickerOpen(false);
    setShowSprache(true);
  };
  const openFoto = () => {
    setPickerOpen(false);
    setShowFoto(true);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="section-gap page-enter pb-28 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-50 md:text-3xl">
          {displayName ? `${greeting}, ${displayName}!` : `${greeting}!`}
        </h1>
        <p className="mt-1 text-dark-400">Angebot per Sprache oder Foto – Rechnung in einem Klick.</p>
      </div>

      {/* Großer CTA */}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="btn-primary flex w-full min-h-[80px] flex-col items-center justify-center gap-1 rounded-card text-lg shadow-glow sm:text-xl"
      >
        <span className="flex items-center gap-3 text-2xl">🎙️ Neues Angebot</span>
        <span className="text-sm font-medium text-white/80">Per Sprache oder Foto · unter 2 Minuten</span>
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={openSprache}
          className="card-interactive flex min-h-[72px] items-center gap-4 text-left"
        >
          <div className="icon-box">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-dark-50">Per Sprache</p>
            <p className="text-sm text-dark-400">Diktieren → fertiges Angebot</p>
          </div>
        </button>
        <button
          type="button"
          onClick={openFoto}
          className="card-interactive flex min-h-[72px] items-center gap-4 text-left"
        >
          <div className="icon-box">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-dark-50">Per Foto</p>
            <p className="text-sm text-dark-400">Baustelle fotografieren</p>
          </div>
        </button>
      </div>

      {/* Letzte Angebote */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-50">Letzte Angebote</h2>
          <Link href="/angebote" className="text-sm text-brand-400 hover:text-brand-300">
            Alle →
          </Link>
        </div>
        {letzteAngebote.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Noch keine Angebote"
            description="Erstelle dein erstes Angebot per Sprache – in unter 2 Minuten."
            actionLabel="Erstes Angebot per Sprache"
            onAction={openSprache}
          />
        ) : (
          <ul className="space-y-2">
            {letzteAngebote.map((a) => (
              <li key={a.id}>
                <Link
                  href="/angebote"
                  className="flex min-h-[52px] items-center justify-between gap-3 rounded-btn bg-dark-950/50 px-3 py-2 transition-colors hover:bg-dark-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-dark-50">{a.betreff}</p>
                    <p className="text-xs text-dark-500">
                      {a.kunde ? getKundeName(a.kunde) : "—"} · {formatDate(a.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="kpi text-sm">{formatCurrency(a.brutto)}</span>
                    <StatusBadge status={a.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Rechnungen erstellen */}
      <div className="card border-success/20">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-success" />
          <h2 className="text-lg font-semibold text-dark-50">Rechnungen erstellen</h2>
        </div>
        <p className="mb-4 text-sm text-dark-400">
          Angenommene Angebote ohne Rechnung – GoBD-rechtssicher in einem Klick.
        </p>
        {rechnungFaellig.length === 0 ? (
          <p className="text-sm text-dark-500">
            Keine offenen Rechnungen. Markiere ein Angebot als „Angenommen“, dann erscheint es hier.
          </p>
        ) : (
          <ul className="space-y-2">
            {rechnungFaellig.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/rechnungen?angebot=${a.id}`)}
                  className="flex w-full min-h-[52px] items-center justify-between gap-3 rounded-btn border border-success/20 bg-success/5 px-3 py-2 text-left transition-colors hover:bg-success/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-dark-50">{a.betreff}</p>
                    <p className="text-xs text-dark-500">
                      {a.kunde ? getKundeName(a.kunde) : "—"} · {formatCurrency(a.brutto)}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-success">
                    Rechnung <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Picker Modal */}
      {pickerOpen && (
        <div className="modal-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="modal-panel max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-dark-50">Neues Angebot</h3>
            <button type="button" onClick={openSprache} className="btn-primary w-full min-h-[56px] justify-center">
              <Mic className="h-5 w-5" /> Per Sprache
            </button>
            <button type="button" onClick={openFoto} className="btn-secondary w-full min-h-[56px] justify-center">
              <Camera className="h-5 w-5" /> Per Foto
            </button>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="btn-ghost w-full min-h-[44px] justify-center"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {showSprache && (
        <SpracheZuAngebot
          onClose={() => setShowSprache(false)}
          onAdopt={(data) => {
            setShowSprache(false);
            setFormInitial(data);
            setShowForm(true);
          }}
        />
      )}
      {showFoto && (
        <FotoZuAngebot
          onClose={() => setShowFoto(false)}
          onAdopt={(data) => {
            setShowFoto(false);
            setFormInitial(data);
            setShowForm(true);
          }}
        />
      )}
      {showForm && (
        <AngebotForm
          onClose={() => {
            setShowForm(false);
            setFormInitial(undefined);
          }}
          initialData={formInitial}
          onSuccess={() => {
            setShowForm(false);
            setFormInitial(undefined);
          }}
        />
      )}
    </div>
  );
}
