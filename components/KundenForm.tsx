"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { X, Plus, User, Mail, Phone, MapPin, Building2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface KundenFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function KundenForm({ onClose, onSuccess }: KundenFormProps) {
  const { addKunde } = useData();
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [form, setForm] = useState({
    name: "",
    telefon: "",
    email: "",
    firma: "",
    strasse: "",
    plz: "",
    ort: "",
  });

  const canSave = form.name.trim().length > 0 && form.telefon.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setLoading(true);

    const { error } = await addKunde({
      ansprechpartner: form.name.trim(),
      telefon: form.telefon.trim(),
      firma: form.firma.trim() || null,
      email: form.email.trim() || null,
      strasse: form.strasse.trim() || null,
      plz: form.plz.trim() || null,
      ort: form.ort.trim() || null,
    });

    if (error) {
      toast.error("Fehler beim Speichern");
    } else {
      toast.success("Kunde gespeichert!");
      onSuccess?.();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="card w-full max-w-lg relative max-h-[100dvh] md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[48px] min-w-[48px] flex items-center justify-center text-dark-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Neuer Kunde</h2>
            <p className="text-sm text-dark-500">Nur Name und Telefon – Rest optional</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label flex items-center gap-1.5 text-base">
              <User className="w-4 h-4" />
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input min-h-[52px] text-lg"
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
              value={form.telefon}
              onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              className="input min-h-[52px] text-lg"
              placeholder="0176 1234567"
              inputMode="tel"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full min-h-[48px] items-center justify-between rounded-lg border border-dark-700 bg-dark-900 px-4 py-3 text-sm text-dark-300 hover:bg-dark-800"
          >
            <span>Weitere Details (optional)</span>
            <ChevronDown className={`h-5 w-5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
          </button>

          {showDetails && (
            <div className="space-y-4 rounded-lg border border-dark-700 bg-dark-900/50 p-4">
              <div>
                <label className="label flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  E-Mail
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input min-h-[48px]"
                  placeholder="max@beispiel.de"
                />
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Firma (Gewerbekunde)
                </label>
                <input
                  type="text"
                  value={form.firma}
                  onChange={(e) => setForm({ ...form, firma: e.target.value })}
                  className="input min-h-[48px]"
                  placeholder="z.B. Müller Bau GmbH"
                />
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Straße
                </label>
                <input
                  type="text"
                  value={form.strasse}
                  onChange={(e) => setForm({ ...form, strasse: e.target.value })}
                  className="input min-h-[48px]"
                  placeholder="Musterstraße 12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">PLZ</label>
                  <input
                    type="text"
                    value={form.plz}
                    onChange={(e) => setForm({ ...form, plz: e.target.value })}
                    className="input min-h-[48px]"
                    placeholder="12345"
                  />
                </div>
                <div>
                  <label className="label">Ort</label>
                  <input
                    type="text"
                    value={form.ort}
                    onChange={(e) => setForm({ ...form, ort: e.target.value })}
                    className="input min-h-[48px]"
                    placeholder="Berlin"
                  />
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || !canSave}
              className="btn-primary flex-1 justify-center min-h-[48px] disabled:opacity-40"
            >
              {loading ? "Speichern..." : "Kunde speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
