"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import AngebotForm from "@/components/AngebotForm";
import SpracheZuAngebot from "@/components/SpracheZuAngebot";
import FotoZuAngebot from "@/components/FotoZuAngebot";
import PDFExport from "@/components/PDFExport";
import EmailSender from "@/components/EmailSender";
import StatusBadge from "@/components/StatusBadge";
import WhatsAppSender from "@/components/WhatsAppSender";
import { Plus, Search, FileText, Calendar, User, Send, CheckCircle, XCircle, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AngebotInitialData } from "@/types";
import toast from "react-hot-toast";

export default function AngebotePage() {
  const router = useRouter();
  const { angebote, loading, updateAngebotStatus } = useData();
  const [showForm, setShowForm] = useState(false);
  const [showSprache, setShowSprache] = useState(false);
  const [showFoto, setShowFoto] = useState(false);
  const [formInitialData, setFormInitialData] = useState<AngebotInitialData | undefined>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [updating, setUpdating] = useState<string | null>(null);

  const openManualForm = () => {
    setFormInitialData(undefined);
    setShowForm(true);
  };

  const openFormWithData = (data: AngebotInitialData) => {
    setFormInitialData(data);
    setShowForm(true);
  };

  const filtered = angebote.filter((a) => {
    const matchesSearch =
      a.betreff.toLowerCase().includes(search.toLowerCase()) ||
      a.kunde?.firma.toLowerCase().includes(search.toLowerCase()) ||
      a.nummer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "alle" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "alle", label: "Alle", count: angebote.length },
    { value: "entwurf", label: "Entwurf", count: angebote.filter((a) => a.status === "entwurf").length },
    { value: "versendet", label: "Versendet", count: angebote.filter((a) => a.status === "versendet").length },
    { value: "angenommen", label: "Angenommen", count: angebote.filter((a) => a.status === "angenommen").length },
    { value: "abgelehnt", label: "Abgelehnt", count: angebote.filter((a) => a.status === "abgelehnt").length },
  ];

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    const { error } = await updateAngebotStatus(id, newStatus);
    if (error) {
      toast.error("Fehler beim Aktualisieren");
    } else {
      toast.success(`Status auf "${newStatus}" geändert`);
    }
    setUpdating(null);
  };

  const totalNetto = filtered.reduce((sum, a) => sum + a.netto, 0);
  const totalBrutto = filtered.reduce((sum, a) => sum + a.brutto, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Angebote</h1>
          <p className="text-dark-500 mt-1">
            {angebote.length} Angebote • Gesamtwert: {formatCurrency(totalBrutto)}
          </p>
        </div>
        <button onClick={openManualForm} className="btn-primary min-h-[48px]">
          <Plus className="w-5 h-5" />
          Neues Angebot
        </button>
      </div>

      {/* KI-Erstellung */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          onClick={() => setShowSprache(true)}
          className="card text-left transition-all hover:border-brand-500/40 hover:bg-dark-800/80 min-h-[120px] flex flex-col justify-center gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600/20 text-2xl">
              🎙️
            </div>
            <div>
              <p className="font-semibold text-white">Per Sprache erstellen</p>
              <p className="text-sm text-dark-500">Sprich dein Angebot – Whisper + KI</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowFoto(true)}
          className="card text-left transition-all hover:border-brand-500/40 hover:bg-dark-800/80 min-h-[120px] flex flex-col justify-center gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-600/20 text-2xl">
              📷
            </div>
            <div>
              <p className="font-semibold text-white">Per Foto erstellen</p>
              <p className="text-sm text-dark-500">Baustellenfoto analysieren mit Vision-KI</p>
            </div>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusOptions.slice(1).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(statusFilter === opt.value ? "alle" : opt.value)}
            className={`card text-left transition-all ${
              statusFilter === opt.value ? "border-brand-500 ring-1 ring-brand-500/20" : ""
            }`}
          >
            <p className="text-xs text-dark-500 uppercase font-medium">{opt.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{opt.count}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nach Betreff, Kunde oder Nummer suchen..."
          className="input pl-10"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            <p className="text-dark-500 mt-3">Lade Angebote...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-dark-700 mx-auto mb-3" />
            <p className="text-dark-500">
              {search || statusFilter !== "alle"
                ? "Keine Angebote gefunden."
                : "Noch keine Angebote. Erstelle dein erstes Angebot!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-800">
                  <th className="text-left text-xs font-semibold text-dark-500 uppercase px-4 py-3">Nummer</th>
                  <th className="text-left text-xs font-semibold text-dark-500 uppercase px-4 py-3">Kunde</th>
                  <th className="text-left text-xs font-semibold text-dark-500 uppercase px-4 py-3">Betreff</th>
                  <th className="text-right text-xs font-semibold text-dark-500 uppercase px-4 py-3">Betrag</th>
                  <th className="text-left text-xs font-semibold text-dark-500 uppercase px-4 py-3">Gültig bis</th>
                  <th className="text-left text-xs font-semibold text-dark-500 uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-dark-500 uppercase px-4 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filtered.map((angebot) => (
                  <tr key={angebot.id} className="hover:bg-dark-800/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-400" />
                        <span className="text-sm font-medium text-white">{angebot.nummer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-dark-500" />
                        <span className="text-sm text-dark-300">
                          {angebot.kunde?.firma || "Unbekannt"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-dark-200 max-w-xs truncate">{angebot.betreff}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-medium text-white">{formatCurrency(angebot.brutto)}</p>
                      <p className="text-xs text-dark-500">{formatCurrency(angebot.netto)} netto</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-dark-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(angebot.gueltig_bis)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={angebot.status} />
                    </td>
                    <td className="px-4 py-4 table-actions-cell">
                      <div className="action-buttons-container">
                        {/* PDF Export */}
                        <PDFExport type="angebot" data={angebot} />

                        {/* E-Mail Senden */}
                        {angebot.kunde?.email && (
                          <EmailSender
                            to={angebot.kunde.email}
                            kundenName={angebot.kunde.ansprechpartner}
                            type="angebot"
                            nummer={angebot.nummer}
                            betreff={angebot.betreff}
                            beschreibung={angebot.beschreibung}
                            brutto={angebot.brutto}
                          />
                        )}

                        <div className="relative z-20">
                          <WhatsAppSender
                            kundenName={angebot.kunde?.ansprechpartner || ""}
                            nummer={angebot.nummer}
                            betreff={angebot.betreff}
                            beschreibung={angebot.beschreibung}
                            brutto={angebot.brutto}
                          />
                        </div>

                        {angebot.status === "entwurf" && (
                          <button
                            onClick={() => handleStatusChange(angebot.id, "versendet")}
                            disabled={updating === angebot.id}
                            className="p-2 text-dark-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                            title="Als versendet markieren"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {angebot.status === "versendet" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(angebot.id, "angenommen")}
                              disabled={updating === angebot.id}
                              className="p-2 text-dark-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                              title="Als angenommen markieren"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(angebot.id, "abgelehnt")}
                              disabled={updating === angebot.id}
                              className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Als abgelehnt markieren"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {angebot.status === "angenommen" && (
                          <button
                            onClick={() => router.push(`/rechnungen?angebot=${angebot.id}`)}
                            className="p-2 text-dark-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Rechnung erstellen"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <AngebotForm
          initialData={formInitialData}
          onClose={() => {
            setShowForm(false);
            setFormInitialData(undefined);
          }}
        />
      )}
      {showSprache && (
        <SpracheZuAngebot
          onClose={() => setShowSprache(false)}
          onAdopt={openFormWithData}
        />
      )}
      {showFoto && (
        <FotoZuAngebot onClose={() => setShowFoto(false)} onAdopt={openFormWithData} />
      )}
    </div>
  );
}
