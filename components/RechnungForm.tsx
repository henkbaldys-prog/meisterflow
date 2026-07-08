"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { X, Plus, Receipt, Euro, Calendar, User, FileText } from "lucide-react";
import { formatCurrency, generateRechnungsNummer, calculateBrutto, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { addDays } from "date-fns";

interface RechnungFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  angebotId?: string;
}

export default function RechnungForm({ onClose, onSuccess, angebotId }: RechnungFormProps) {
  const { addRechnung, kunden, angebote } = useData();
  const [loading, setLoading] = useState(false);

  const selectedAngebot = angebote.find((a) => a.id === angebotId);
  const defaultFaellig = addDays(new Date(), 14).toISOString().split("T")[0];

  const [form, setForm] = useState({
    kunde_id: selectedAngebot?.kunde_id || "",
    angebots_id: angebotId || null as string | null,
    betreff: selectedAngebot ? `Rechnung zu: ${selectedAngebot.betreff}` : "",
    netto: selectedAngebot?.netto || 0,
    mwst_satz: selectedAngebot?.mwst_satz || 19,
    faellig_am: defaultFaellig,
  });

  const selectedKunde = kunden.find((k) => k.id === form.kunde_id);
  const brutto = calculateBrutto(form.netto, form.mwst_satz);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const nummer = generateRechnungsNummer();
    const { error } = await addRechnung({
      ...form,
      nummer,
      brutto,
      status: "entwurf",
    });

    if (error) {
      toast.error("Fehler beim Erstellen");
    } else {
      toast.success("Rechnung erfolgreich erstellt!");
      onSuccess?.();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Neue Rechnung</h2>
            <p className="text-sm text-dark-500">
              {selectedAngebot ? "Basierend auf Angebot" : "Erstelle eine neue Rechnung"}
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
                  {k.firma} – {k.ansprechpartner}
                </option>
              ))}
            </select>
          </div>

          {!selectedAngebot && (
            <div>
              <label className="label flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Basierend auf Angebot (optional)
              </label>
              <select
                value={form.angebots_id || ""}
                onChange={(e) => {
                  const angebot = angebote.find((a) => a.id === e.target.value);
                  if (angebot) {
                    setForm({
                      ...form,
                      angebots_id: angebot.id,
                      kunde_id: angebot.kunde_id,
                      betreff: `Rechnung zu: ${angebot.betreff}`,
                      netto: angebot.netto,
                      mwst_satz: angebot.mwst_satz,
                    });
                  } else {
                    setForm({ ...form, angebots_id: null });
                  }
                }}
                className="input"
              >
                <option value="">Kein Angebot</option>
                {angebote
                  .filter((a) => a.status === "angenommen")
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nummer} – {a.betreff} ({formatCurrency(a.brutto)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Betreff</label>
            <input
              type="text"
              value={form.betreff}
              onChange={(e) => setForm({ ...form, betreff: e.target.value })}
              className="input"
              placeholder="Rechnung: Elektroinstallation EFH Musterstraße"
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
              Fällig am
            </label>
            <input
              type="date"
              value={form.faellig_am}
              onChange={(e) => setForm({ ...form, faellig_am: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? "Erstellen..." : "Rechnung erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
