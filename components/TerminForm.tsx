"use client";

import { useEffect, useState } from "react";
import { useData } from "@/contexts/DataContext";
import { X, CalendarDays, Clock, MapPin, User, FileText, Phone } from "lucide-react";
import { getKundeLabel, getKundeName } from "@/lib/kunde-utils";
import { findKundeIdByName } from "@/lib/angebot-initial";
import { TerminInitialData } from "@/types";
import toast from "react-hot-toast";

interface TerminFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: TerminInitialData;
}

const NEW_KUNDE_VALUE = "__new__";

export default function TerminForm({ onClose, onSuccess, initialData }: TerminFormProps) {
  const { addTermin, addKunde, kunden } = useData();
  const [loading, setLoading] = useState(false);
  const [creatingKunde, setCreatingKunde] = useState(false);
  const [showNewKunde, setShowNewKunde] = useState(false);
  const [newKunde, setNewKunde] = useState({ name: "", telefon: "" });
  const [form, setForm] = useState({
    titel: "",
    beschreibung: "",
    datum: "",
    uhrzeit_von: "",
    uhrzeit_bis: "",
    kunde_id: "",
    ort: "",
  });

  useEffect(() => {
    if (!initialData) return;

    const kundeId = findKundeIdByName(kunden, initialData.kunde_name);
    if (kundeId) {
      setShowNewKunde(false);
      setForm((prev) => ({
        ...prev,
        kunde_id: kundeId,
        titel: initialData.titel || prev.titel,
        beschreibung: initialData.beschreibung || prev.beschreibung,
        datum: initialData.datum || prev.datum,
        uhrzeit_von: initialData.uhrzeit_von || prev.uhrzeit_von,
        uhrzeit_bis: initialData.uhrzeit_bis || prev.uhrzeit_bis,
        ort: initialData.ort || prev.ort,
      }));
    } else if (initialData.kunde_name) {
      setShowNewKunde(true);
      setNewKunde((prev) => ({ ...prev, name: initialData.kunde_name || prev.name }));
      setForm((prev) => ({
        ...prev,
        titel: initialData.titel || prev.titel,
        beschreibung: initialData.beschreibung || prev.beschreibung,
        datum: initialData.datum || prev.datum,
        uhrzeit_von: initialData.uhrzeit_von || prev.uhrzeit_von,
        uhrzeit_bis: initialData.uhrzeit_bis || prev.uhrzeit_bis,
        ort: initialData.ort || prev.ort,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        titel: initialData.titel || prev.titel,
        beschreibung: initialData.beschreibung || prev.beschreibung,
        datum: initialData.datum || prev.datum,
        uhrzeit_von: initialData.uhrzeit_von || prev.uhrzeit_von,
        uhrzeit_bis: initialData.uhrzeit_bis || prev.uhrzeit_bis,
        ort: initialData.ort || prev.ort,
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
    });
    setCreatingKunde(false);
    if (error || !data) {
      toast.error(error?.message || "Kunde konnte nicht angelegt werden");
      return;
    }
    toast.success(`Kunde ${getKundeName(data)} angelegt`);
    setShowNewKunde(false);
    setForm((prev) => ({ ...prev, kunde_id: data.id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let kundeId = form.kunde_id || null;
    if (showNewKunde && canCreateKunde && !kundeId) {
      const { data, error } = await addKunde({
        ansprechpartner: newKunde.name.trim(),
        telefon: newKunde.telefon.trim(),
      });
      if (error || !data) {
        toast.error(error?.message || "Kunde konnte nicht angelegt werden");
        setLoading(false);
        return;
      }
      kundeId = data.id;
    }

    const terminData = { ...form, kunde_id: kundeId, status: "geplant" };
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg relative max-h-[100dvh] md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-500 hover:text-white min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Schließen"
        >
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
              className="input min-h-[48px]"
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
              value={showNewKunde ? NEW_KUNDE_VALUE : form.kunde_id}
              onChange={(e) => handleKundeSelect(e.target.value)}
              className="input min-h-[48px]"
            >
              <option value="">Kein Kunde</option>
              {kunden.map((k) => (
                <option key={k.id} value={k.id}>
                  {getKundeLabel(k)}
                </option>
              ))}
              <option value={NEW_KUNDE_VALUE}>+ Neuer Kunde…</option>
            </select>
          </div>

          {showNewKunde && (
            <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-4 space-y-3">
              <p className="text-sm font-medium text-brand-300">Neuen Kunden anlegen</p>
              <input
                type="text"
                value={newKunde.name}
                onChange={(e) => setNewKunde({ ...newKunde, name: e.target.value })}
                className="input min-h-[48px]"
                placeholder="Name *"
              />
              <input
                type="tel"
                value={newKunde.telefon}
                onChange={(e) => setNewKunde({ ...newKunde, telefon: e.target.value })}
                className="input min-h-[48px]"
                placeholder="Telefon *"
              />
              <button
                type="button"
                onClick={handleCreateKunde}
                disabled={!canCreateKunde || creatingKunde}
                className="btn-secondary w-full min-h-[48px] justify-center"
              >
                <Phone className="w-4 h-4" />
                {creatingKunde ? "Wird angelegt…" : "Kunde speichern & auswählen"}
              </button>
            </div>
          )}

          <div>
            <label className="label flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Datum
            </label>
            <input
              type="date"
              value={form.datum}
              onChange={(e) => setForm({ ...form, datum: e.target.value })}
              className="input min-h-[48px]"
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
                className="input min-h-[48px]"
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
                className="input min-h-[48px]"
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
              className="input min-h-[48px]"
              placeholder="Musterstraße 123, 12345 Musterstadt"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center min-h-[48px]">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center min-h-[48px]">
              {loading ? "Speichern..." : "Termin speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
