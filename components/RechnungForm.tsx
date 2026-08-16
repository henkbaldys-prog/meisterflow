"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { X, Receipt, Euro, Calendar, User } from "lucide-react";
import { formatCurrency, calculateBrutto } from "@/lib/utils";
import { nextRechnungsnummerFromProfil } from "@/lib/rechnungsnummer";
import { getKundeLabel } from "@/lib/kunde-utils";
import toast from "react-hot-toast";
import { addDays } from "date-fns";

interface RechnungFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  angebotId?: string;
}

export default function RechnungForm({ onClose, onSuccess, angebotId }: RechnungFormProps) {
  const { addRechnung, kunden, angebote, firmenprofil, saveFirmenprofil, loadFirmenprofil } =
    useData();
  const [loading, setLoading] = useState(false);

  const selectedAngebot = angebote.find((a) => a.id === angebotId);
  const tage = firmenprofil?.zahlungsziel_tage ?? 14;
  const defaultFaellig = addDays(new Date(), tage).toISOString().split("T")[0];
  const previewNummer = nextRechnungsnummerFromProfil(firmenprofil).nummer;

  const [form, setForm] = useState({
    kunde_id: selectedAngebot?.kunde_id || "",
    angebots_id: angebotId || (null as string | null),
    betreff: selectedAngebot ? `Rechnung: ${selectedAngebot.betreff}` : "",
    netto: selectedAngebot?.netto || 0,
    mwst_satz: selectedAngebot?.mwst_satz || firmenprofil?.umsatzsteuer_prozent || 19,
    faellig_am: defaultFaellig,
  });

  const brutto = calculateBrutto(form.netto, form.mwst_satz);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmenprofil?.steuernummer && !firmenprofil?.ust_id) {
      toast.error("Bitte Steuernummer oder USt-IdNr. in den Einstellungen hinterlegen");
      return;
    }
    setLoading(true);

    const { nummer, nextCounter } = nextRechnungsnummerFromProfil(firmenprofil);
    const { error } = await addRechnung({
      ...form,
      nummer,
      brutto,
      status: "entwurf",
    });

    if (error) {
      toast.error("Fehler beim Erstellen");
      setLoading(false);
      return;
    }

    // Zähler hochsetzen (GoBD: nie doppelt)
    if (firmenprofil) {
      await saveFirmenprofil({
        firmenname: firmenprofil.firmenname,
        logo_url: firmenprofil.logo_url || "",
        strasse: firmenprofil.strasse || "",
        plz: firmenprofil.plz || "",
        ort: firmenprofil.ort || "",
        telefon: firmenprofil.telefon || "",
        email: firmenprofil.email || "",
        gewerke: firmenprofil.gewerke || [],
        stundenlohn: Number(firmenprofil.stundenlohn),
        anfahrtspauschale: Number(firmenprofil.anfahrtspauschale),
        materialaufschlag_prozent: firmenprofil.materialaufschlag_prozent,
        umsatzsteuer_prozent: firmenprofil.umsatzsteuer_prozent,
        zahlungsziel_tage: firmenprofil.zahlungsziel_tage,
        standard_angebotstext: firmenprofil.standard_angebotstext,
        standard_mahnungstext: firmenprofil.standard_mahnungstext,
        inhaber_name: firmenprofil.inhaber_name || "",
        steuernummer: firmenprofil.steuernummer || "",
        ust_id: firmenprofil.ust_id || "",
        rechnungsnummer_prefix: firmenprofil.rechnungsnummer_prefix || "RE-",
        naechste_rechnungsnummer: nextCounter,
        bankverbindung: firmenprofil.bankverbindung || "",
        rechnungshinweis: firmenprofil.rechnungshinweis || "",
      });
      await loadFirmenprofil();
    }

    toast.success(`Rechnung ${nummer} erstellt – PDF herunterladen`);
    onSuccess?.();
    onClose();
    setLoading(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="modal-close" aria-label="Schließen">
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="icon-box !bg-success/10 !text-success">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-50">GoBD-Rechnung</h2>
            <p className="text-sm text-dark-500">
              Nummer: <span className="kpi text-brand-300">{previewNummer}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Kunde
            </label>
            <select
              value={form.kunde_id}
              onChange={(e) => setForm({ ...form, kunde_id: e.target.value })}
              className="input"
              required
              disabled={!!selectedAngebot}
            >
              <option value="">Kunde auswählen...</option>
              {kunden.map((k) => (
                <option key={k.id} value={k.id}>
                  {getKundeLabel(k)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Betreff / Leistungsbeschreibung</label>
            <input
              className="input"
              value={form.betreff}
              onChange={(e) => setForm({ ...form, betreff: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label flex items-center gap-1.5">
                <Euro className="w-3.5 h-3.5" />
                Netto (€)
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.netto || ""}
                onChange={(e) => setForm({ ...form, netto: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <label className="label">MwSt. (%)</label>
              <select
                className="input"
                value={form.mwst_satz}
                onChange={(e) => setForm({ ...form, mwst_satz: parseInt(e.target.value) })}
              >
                <option value={19}>19%</option>
                <option value={7}>7%</option>
                <option value={0}>0%</option>
              </select>
            </div>
            <div>
              <label className="label">Brutto</label>
              <div className="input flex items-center text-dark-300">{formatCurrency(brutto)}</div>
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Fällig am (Zahlungsziel {tage} Tage)
            </label>
            <input
              type="date"
              className="input"
              value={form.faellig_am}
              onChange={(e) => setForm({ ...form, faellig_am: e.target.value })}
              required
            />
          </div>

          <p className="text-xs text-dark-500">
            PDF enthält Pflichtangaben nach § 14 UStG / GoBD (Steuernummer, Adressen, Beträge,
            Zahlungsziel).
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 min-h-[48px] justify-center">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 min-h-[48px] justify-center">
              {loading ? "Erstelle…" : "Rechnung erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
