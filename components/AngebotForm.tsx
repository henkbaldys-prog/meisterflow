"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import KIGenerator from "./KIGenerator";
import { X, Plus, FileText, Euro, Calendar, User } from "lucide-react";
import { formatCurrency, generateAngebotsNummer, calculateBrutto } from "@/lib/utils";
import toast from "react-hot-toast";

interface AngebotFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AngebotForm({ onClose, onSuccess }: AngebotFormProps) {
  const { addAngebot, kunden } = useData();
  const [loading, setLoading] = useState(false);
  const [showKI, setShowKI] = useState(false);
  const [form, setForm] = useState({
    kunde_id: "",
    betreff: "",
    beschreibung: "",
    netto: 0,
    mwst_satz: 19,
    gueltig_bis: "",
  });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Neues Angebot</h2>
            <p className="text-sm text-dark-500">Erstelle ein professionelles Angebot</p>
          </div>
        </div>

        {/* KI Generator Toggle */}
        <button
          onClick={() => setShowKI(!showKI)}
          className="w-full mb-4 py-2 px-4 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-lg text-brand-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          {showKI ? "KI-Generator schließen" : "Mit KI generieren"}
        </button>

        {showKI && (
          <div className="mb-6">
            <KIGenerator
              onGenerated={handleKIGenerated}
              kundenName={selectedKunde?.ansprechpartner || ""}
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
              value={form.kunde_id}
              onChange={(e) => setForm({ ...form, kunde_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Kunde auswählen...</option>
              {kunden.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.firma} – {k.ansprechpartner}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Betreff</label>
            <input
              type="text"
              value={form.betreff}
              onChange={(e) => setForm({ ...form, betreff: e.target.value })}
              className="input"
              placeholder="Angebot: Elektroinstallation EFH Musterstraße"
              required
            />
          </div>

          <div>
            <label className="label">Beschreibung</label>
            <textarea
              value={form.beschreibung}
              onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
              className="input min-h-[120px] resize-none"
              placeholder="Detaillierte Beschreibung der Leistungen..."
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
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
                className="input"
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <label className="label">MwSt. (%)</label>
              <select
                value={form.mwst_satz}
                onChange={(e) => setForm({ ...form, mwst_satz: parseInt(e.target.value) })}
                className="input"
              >
                <option value={19}>19%</option>
                <option value={7}>7%</option>
                <option value={0}>0%</option>
              </select>
            </div>
            <div>
              <label className="label">Brutto</label>
              <div className="input bg-dark-900 flex items-center text-dark-300">
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
              className="input"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? "Erstellen..." : "Angebot erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
