"use client";

import { useEffect, useState } from "react";
import { useData } from "@/contexts/DataContext";
import KIGenerator from "./KIGenerator";
import { X, Plus, FileText, Euro, Calendar, User, Phone } from "lucide-react";
import { formatCurrency, generateAngebotsNummer, calculateBrutto } from "@/lib/utils";
import { defaultGueltigBis, findKundeIdByName } from "@/lib/angebot-initial";
import { getKundeLabel, getKundeName } from "@/lib/kunde-utils";
import { AngebotInitialData } from "@/types";
import toast from "react-hot-toast";

interface AngebotFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: AngebotInitialData;
}

const NEW_KUNDE_VALUE = "__new__";

export default function AngebotForm({ onClose, onSuccess, initialData }: AngebotFormProps) {
  const { addAngebot, addKunde, kunden } = useData();
  const [loading, setLoading] = useState(false);
  const [creatingKunde, setCreatingKunde] = useState(false);
  const [showNewKunde, setShowNewKunde] = useState(false);
  const [newKunde, setNewKunde] = useState({ name: "", telefon: "" });
  const [showKI, setShowKI] = useState(false);
  const [form, setForm] = useState({
    kunde_id: "",
    betreff: "",
    beschreibung: "",
    netto: 0,
    mwst_satz: 19,
    gueltig_bis: defaultGueltigBis(),
  });

  useEffect(() => {
    if (!initialData) return;

    const kundeId = findKundeIdByName(kunden, initialData.kunde_name);
    if (kundeId) {
      setShowNewKunde(false);
      setForm((prev) => ({
        ...prev,
        kunde_id: kundeId,
        betreff: initialData.betreff || initialData.leistung || prev.betreff,
        beschreibung: initialData.beschreibung || prev.beschreibung,
      }));
    } else if (initialData.kunde_name) {
      setShowNewKunde(true);
      setNewKunde((prev) => ({
        ...prev,
        name: initialData.kunde_name || prev.name,
      }));
      setForm((prev) => ({
        ...prev,
        betreff: initialData.betreff || initialData.leistung || prev.betreff,
        beschreibung: initialData.beschreibung || prev.beschreibung,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        betreff: initialData.betreff || initialData.leistung || prev.betreff,
        beschreibung: initialData.beschreibung || prev.beschreibung,
      }));
    }
  }, [initialData, kunden]);

  const canCreateKunde =
    newKunde.name.trim().length > 0 && newKunde.telefon.trim().length > 0;

  const handleKundeSelect = (value: string) => {
    if (value === NEW_KUNDE_VALUE) {
      setShowNewKunde(true);
      setForm((prev) => ({ ...prev, kunde_id: "" }));
      return;
    }
    setShowNewKunde(false);
    setForm((prev) => ({ ...prev, kunde_id: value }));
  };

  const handleCreateKunde = async () => {
    if (!canCreateKunde) return;

    setCreatingKunde(true);
    const { data, error } = await addKunde({
      ansprechpartner: newKunde.name.trim(),
      telefon: newKunde.telefon.trim(),
      firma: null,
      email: null,
      strasse: null,
      plz: null,
      ort: null,
    });

    if (error) {
      toast.error(error.message || "Fehler beim Anlegen des Kunden");
    } else if (data) {
      toast.success("Kunde angelegt!");
      setShowNewKunde(false);
      setForm((prev) => ({ ...prev, kunde_id: data.id }));
      setNewKunde({ name: "", telefon: "" });
    }
    setCreatingKunde(false);
  };

  const selectedKunde = kunden.find((k) => k.id === form.kunde_id);
  const brutto = calculateBrutto(form.netto, form.mwst_satz);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const nummer = generateAngebotsNummer();
    const { error } = await addAngebot({
      ...form,
      nummer,
      brutto,
      status: "entwurf",
    });

    if (error) {
      toast.error("Fehler beim Erstellen");
    } else {
      toast.success("Angebot erfolgreich erstellt!");
      onSuccess?.();
      onClose();
    }
    setLoading(false);
  };

  const handleKIGenerated = (text: string) => {
    setForm((prev) => ({ ...prev, beschreibung: text }));
    setShowKI(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="card w-full max-w-2xl relative max-h-[100dvh] md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-500 hover:text-white min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Neues Angebot</h2>
            <p className="text-sm text-dark-500">
              {initialData ? "Vorausgefüllt aus KI – bitte prüfen" : "Erstelle ein professionelles Angebot"}
            </p>
          </div>
        </div>

        {initialData && (
          <div className="mb-4 rounded-lg border border-brand-500/20 bg-brand-500/5 px-4 py-3 text-sm text-brand-200">
            Felder wurden aus Sprache/Foto übernommen. Bitte Kunde und Preis ergänzen.
          </div>
        )}

        <button
          onClick={() => setShowKI(!showKI)}
          className="w-full mb-4 py-3 px-4 min-h-[48px] bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-lg text-brand-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          {showKI ? "KI-Generator schließen" : "Mit KI generieren"}
        </button>

        {showKI && (
          <div className="mb-6">
            <KIGenerator
              onGenerated={handleKIGenerated}
              kundenName={selectedKunde ? getKundeName(selectedKunde) : ""}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Kunde
            </label>
            <select
              value={showNewKunde ? NEW_KUNDE_VALUE : form.kunde_id}
              onChange={(e) => handleKundeSelect(e.target.value)}
              className="input min-h-[48px]"
            >
              <option value="">Kunde auswählen...</option>
              {kunden.map((k) => (
                <option key={k.id} value={k.id}>
                  {getKundeLabel(k)}
                </option>
              ))}
              <option value={NEW_KUNDE_VALUE}>+ Neuer Kunde...</option>
            </select>

            {showNewKunde && (
              <div className="mt-3 space-y-3 rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
                <p className="text-sm text-brand-200">Neuen Kunden direkt anlegen – ohne Seitenwechsel</p>
                <div>
                  <label className="label flex items-center gap-1.5 text-base">
                    <User className="w-4 h-4" />
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newKunde.name}
                    onChange={(e) => setNewKunde({ ...newKunde, name: e.target.value })}
                    className="input min-h-[52px] w-full text-lg"
                    placeholder="z.B. Max Müller"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-1.5 text-base">
                    <Phone className="w-4 h-4" />
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={newKunde.telefon}
                    onChange={(e) => setNewKunde({ ...newKunde, telefon: e.target.value })}
                    className="input min-h-[52px] w-full text-lg"
                    placeholder="0176 1234567"
                    inputMode="tel"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateKunde}
                  disabled={creatingKunde || !canCreateKunde}
                  className="btn-primary w-full justify-center min-h-[48px] disabled:opacity-40"
                >
                  {creatingKunde ? "Wird angelegt..." : "Kunde anlegen und übernehmen"}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="label">Betreff</label>
            <input
              type="text"
              value={form.betreff}
              onChange={(e) => setForm({ ...form, betreff: e.target.value })}
              className="input min-h-[48px]"
              placeholder="Angebot: Elektroinstallation EFH Musterstraße"
              required
            />
          </div>

          <div>
            <label className="label">Beschreibung</label>
            <textarea
              value={form.beschreibung}
              onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
              className="input min-h-[120px] resize-y"
              placeholder="Detaillierte Beschreibung der Leistungen..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label flex items-center gap-1.5">
                <Euro className="w-3.5 h-3.5" />
                Netto (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.netto || ""}
                onChange={(e) => setForm({ ...form, netto: parseFloat(e.target.value) || 0 })}
                className="input min-h-[48px]"
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <label className="label">MwSt. (%)</label>
              <select
                value={form.mwst_satz}
                onChange={(e) => setForm({ ...form, mwst_satz: parseInt(e.target.value) })}
                className="input min-h-[48px]"
              >
                <option value={19}>19%</option>
                <option value={7}>7%</option>
                <option value={0}>0%</option>
              </select>
            </div>
            <div>
              <label className="label">Brutto</label>
              <div className="input min-h-[48px] bg-dark-900 flex items-center text-dark-300">
                {formatCurrency(brutto)}
              </div>
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Gültig bis
            </label>
            <input
              type="date"
              value={form.gueltig_bis}
              onChange={(e) => setForm({ ...form, gueltig_bis: e.target.value })}
              className="input min-h-[48px]"
              required
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 justify-center min-h-[48px]"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center min-h-[48px]"
            >
              {loading ? "Erstellen..." : "Angebot erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
