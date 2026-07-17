"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import RechnungForm from "@/components/RechnungForm";
import PDFExport from "@/components/PDFExport";
import EmailSender from "@/components/EmailSender";
import StatusBadge from "@/components/StatusBadge";
import WhatsAppSender from "@/components/WhatsAppSender";
import { Plus, Search, Receipt, Calendar, User, CheckCircle, AlertTriangle, Send, Mail, MessageCircle, Loader2 } from "lucide-react";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import { getKundeName } from "@/lib/kunde-utils";
import {
  buildMahnungMessage,
  buildMahnungSubject,
  isRechnungUeberfaellig,
  isUnpaidRechnung,
  needsMahnung,
} from "@/lib/mahnung";
import toast from "react-hot-toast";

export default function RechnungenPage() {
  const searchParams = useSearchParams();
  const angebotId = searchParams.get("angebot") || undefined;
  const { rechnungen, loading, updateRechnungStatus, markMahnungGesendet, firmenprofil } = useData();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [updating, setUpdating] = useState<string | null>(null);
  const [mahnungBusy, setMahnungBusy] = useState<string | null>(null);
  const today = todayISO();

  useEffect(() => {
    if (angebotId) setShowForm(true);
  }, [angebotId]);

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter === "unbezahlt") setStatusFilter("unbezahlt");
  }, [searchParams]);

  const filtered = rechnungen.filter((r) => {
    const matchesSearch =
      r.betreff.toLowerCase().includes(search.toLowerCase()) ||
      (r.kunde && getKundeName(r.kunde).toLowerCase().includes(search.toLowerCase())) ||
      r.nummer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "alle" ||
      (statusFilter === "unbezahlt"
        ? isUnpaidRechnung(r.status)
        : r.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "alle", label: "Alle", count: rechnungen.length },
    { value: "entwurf", label: "Entwurf", count: rechnungen.filter((r) => r.status === "entwurf").length },
    { value: "versendet", label: "Versendet", count: rechnungen.filter((r) => r.status === "versendet").length },
    { value: "gemahnt", label: "Gemahnt", count: rechnungen.filter((r) => r.status === "gemahnt").length },
    { value: "bezahlt", label: "Bezahlt", count: rechnungen.filter((r) => r.status === "bezahlt").length },
    { value: "ueberfaellig", label: "Überfällig", count: rechnungen.filter((r) => r.status === "ueberfaellig" || isRechnungUeberfaellig(r, today)).length },
  ];

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    const { error } = await updateRechnungStatus(id, newStatus);
    if (error) {
      toast.error("Fehler beim Aktualisieren");
    } else {
      toast.success(`Status auf "${newStatus}" geändert`);
    }
    setUpdating(null);
  };

  const mahnungstext =
    firmenprofil?.standard_mahnungstext ||
    "Wir bitten höflich um Begleichung der offenen Forderung.";

  const sendMahnungWhatsApp = async (r: (typeof rechnungen)[0]) => {
    setMahnungBusy(r.id);
    try {
      const name = r.kunde ? getKundeName(r.kunde) : "Herr/Frau Kunde";
      const text = encodeURIComponent(
        buildMahnungMessage({
          kundenName: name,
          nummer: r.nummer,
          brutto: r.brutto,
          faelligAm: r.faellig_am,
          mahnungstext,
          firmenname: firmenprofil?.firmenname,
        }),
      );
      const phone = r.kunde?.telefon?.replace(/\D/g, "") || "";
      window.open(phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`, "_blank");
      const { error } = await markMahnungGesendet(r.id);
      if (error) toast.error("Status nicht aktualisiert – SQL-Migration ausgeführt?");
      else toast.success("Mahnung via WhatsApp – als gemahnt markiert");
    } finally {
      setMahnungBusy(null);
    }
  };

  const sendMahnungEmail = async (r: (typeof rechnungen)[0]) => {
    if (!r.kunde?.email) {
      toast.error("Keine E-Mail hinterlegt");
      return;
    }
    setMahnungBusy(r.id);
    try {
      const name = r.kunde ? getKundeName(r.kunde) : "Herr/Frau Kunde";
      const text = buildMahnungMessage({
        kundenName: name,
        nummer: r.nummer,
        brutto: r.brutto,
        faelligAm: r.faellig_am,
        mahnungstext,
        firmenname: firmenprofil?.firmenname,
      });
      const subject = buildMahnungSubject(r.nummer);
      const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:#2563eb;color:#fff;padding:20px;text-align:center"><h1>${firmenprofil?.firmenname || "MeisterFlow"}</h1></div><div style="background:#f8fafc;padding:30px;margin:20px 0">${text.replace(/\n/g, "<br>")}</div></div></body></html>`;

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to: r.kunde.email, subject, html, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Versand fehlgeschlagen");

      const { error } = await markMahnungGesendet(r.id);
      if (error) toast.error("E-Mail gesendet, Status nicht aktualisiert");
      else toast.success("Mahnung per E-Mail gesendet");
    } catch (e: any) {
      toast.error(e.message || "E-Mail fehlgeschlagen");
    } finally {
      setMahnungBusy(null);
    }
  };

  const totalOffen = useMemo(
    () => rechnungen.filter((r) => isUnpaidRechnung(r.status)).reduce((sum, r) => sum + r.brutto, 0),
    [rechnungen],
  );

  const totalBezahlt = rechnungen
    .filter((r) => r.status === "bezahlt")
    .reduce((sum, r) => sum + r.brutto, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Rechnungen</h1>
          <p className="text-dark-500 mt-1">
            {rechnungen.length} Rechnungen • Offen: {formatCurrency(totalOffen)} • Bezahlt: {formatCurrency(totalBezahlt)}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary min-h-[48px]">
          <Plus className="w-5 h-5" />
          Neue Rechnung
        </button>
      </div>

      {statusFilter === "unbezahlt" && (
        <p className="text-sm text-brand-400">Filter aktiv: Unbezahlte Rechnungen</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            <p className="text-dark-500 mt-3">Lade Rechnungen...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-dark-700 mx-auto mb-3" />
            <p className="text-dark-500">
              {search || statusFilter !== "alle"
                ? "Keine Rechnungen gefunden."
                : "Noch keine Rechnungen. Erstelle deine erste Rechnung!"}
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
                  <th className="text-left text-xs font-semibold text-dark-500 uppercase px-4 py-3">Fällig am</th>
                  <th className="text-left text-xs font-semibold text-dark-500 uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-dark-500 uppercase px-4 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filtered.map((rechnung) => {
                  const overdue = isRechnungUeberfaellig(rechnung, today);
                  const canMahnen = needsMahnung(rechnung, today);
                  const busy = mahnungBusy === rechnung.id;

                  return (
                    <tr key={rechnung.id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-white">{rechnung.nummer}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-dark-500" />
                          <span className="text-sm text-dark-300">
                            {rechnung.kunde ? getKundeName(rechnung.kunde) : "Unbekannt"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-dark-200 max-w-xs truncate">{rechnung.betreff}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-medium text-white">{formatCurrency(rechnung.brutto)}</p>
                        <p className="text-xs text-dark-500">{formatCurrency(rechnung.netto)} netto</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className={`flex items-center gap-1.5 text-sm ${overdue ? "text-red-400" : "text-dark-400"}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(rechnung.faellig_am)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <StatusBadge status={rechnung.status} />
                          {overdue && rechnung.status !== "ueberfaellig" && (
                            <span className="block text-[11px] font-medium text-red-400">Überfällig</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 table-actions-cell">
                        <div className="action-buttons-container">
                          <PDFExport type="rechnung" data={rechnung} />

                          {rechnung.kunde?.email && (
                            <EmailSender
                              to={rechnung.kunde.email}
                              kundenName={rechnung.kunde ? getKundeName(rechnung.kunde) : ""}
                              type="rechnung"
                              nummer={rechnung.nummer}
                              betreff={rechnung.betreff}
                              beschreibung={rechnung.betreff}
                              brutto={rechnung.brutto}
                            />
                          )}

                          <div className="relative z-20">
                            <WhatsAppSender
                              kundenName={rechnung.kunde ? getKundeName(rechnung.kunde) : ""}
                              nummer={rechnung.nummer}
                              betreff={rechnung.betreff}
                              beschreibung={rechnung.betreff}
                              brutto={rechnung.brutto}
                            />
                          </div>

                          {canMahnen && (
                            <>
                              <button
                                onClick={() => sendMahnungWhatsApp(rechnung)}
                                disabled={busy}
                                className="p-2 text-dark-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                                title="Mahnung per WhatsApp"
                              >
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => sendMahnungEmail(rechnung)}
                                disabled={busy || !rechnung.kunde?.email}
                                className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                                title="Mahnung per E-Mail"
                              >
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                              </button>
                            </>
                          )}

                          {rechnung.status === "entwurf" && (
                            <button
                              onClick={() => handleStatusChange(rechnung.id, "versendet")}
                              disabled={updating === rechnung.id}
                              className="p-2 text-dark-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                              title="Als versendet markieren"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {isUnpaidRechnung(rechnung.status) && (
                            <button
                              onClick={() => handleStatusChange(rechnung.id, "bezahlt")}
                              disabled={updating === rechnung.id}
                              className="p-2 text-dark-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                              title="Als bezahlt markieren"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {(rechnung.status === "versendet" || rechnung.status === "gemahnt") && overdue && (
                            <button
                              onClick={() => handleStatusChange(rechnung.id, "ueberfaellig")}
                              disabled={updating === rechnung.id}
                              className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Als überfällig markieren"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <RechnungForm
          angebotId={angebotId}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
