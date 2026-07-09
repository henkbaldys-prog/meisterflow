"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { X, Plus, CalendarDays, Clock, MapPin, User, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface TerminFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TerminForm({ onClose, onSuccess }: TerminFormProps) {
  const { addTermin, kunden } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titel: "",
    beschreibung: "",
    datum: "",
    uhrzeit_von: "",
    uhrzeit_bis: "",
    kunde_id: "",
    ort: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const terminData = { ...form, kunde_id: form.kunde_id || null, status: "geplant" };
    const { error } = await addTermin(terminData);

    if (error) {
      toast.error("Fehler beim Erstellen");
    } else {
      toast.success("Termin erfolgreich erstellt!");
      onSuccess?.();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Neuer Termin</h2>
            <p className="text-sm text-dark-500">Plane einen neuen Termin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Titel</label>
            <input
              type="text"
              value={form.titel}
              onChange={(e) => setForm({ ...form, titel: e.target.value })}
              className="input"
              placeholder="z.B. Elektroinstallation vor Ort"
              required
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Beschreibung
            </label>
            <textarea
              value={form.beschreibung}
              onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
              className="input min-h-[80px] resize-none"
              placeholder="Details zum Termin..."
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Kunde (optional)
            </label>
            <select
              value={form.kunde_id}
              onChange={(e) => setForm({ ...form, kunde_id: e.target.value })}
              className="input"
            >
              <option value="">Kein Kunde</option>
              {kunden.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.firma} – {k.ansprechpartner}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Datum
            </label>
            <input
              type="date"
              value={form.datum}
              onChange={(e) => setForm({ ...form, datum: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Von
              </label>
              <input
                type="time"
                value={form.uhrzeit_von}
                onChange={(e) => setForm({ ...form, uhrzeit_von: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Bis
              </label>
              <input
                type="time"
                value={form.uhrzeit_bis}
                onChange={(e) => setForm({ ...form, uhrzeit_bis: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Ort
            </label>
            <input
              type="text"
              value={form.ort}
              onChange={(e) => setForm({ ...form, ort: e.target.value })}
              className="input"
              placeholder="Musterstraße 123, 12345 Musterstadt"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? "Speichern..." : "Termin speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
