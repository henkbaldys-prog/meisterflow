"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { X, Plus, Building2, User, Mail, Phone, MapPin } from "lucide-react";
import toast from "react-hot-toast";

interface KundenFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function KundenForm({ onClose, onSuccess }: KundenFormProps) {
  const { addKunde } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firma: "",
    ansprechpartner: "",
    email: "",
    telefon: "",
    strasse: "",
    plz: "",
    ort: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await addKunde(form);
    if (error) {
      toast.error("Fehler beim Speichern");
    } else {
      toast.success("Kunde erfolgreich erstellt!");
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
          <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Neuer Kunde</h2>
            <p className="text-sm text-dark-500">Füge einen neuen Kunden hinzu</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Firma
              </label>
              <input
                type="text"
                value={form.firma}
                onChange={(e) => setForm({ ...form, firma: e.target.value })}
                className="input"
                placeholder="Muster GmbH"
                required
              />
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Ansprechpartner
              </label>
              <input
                type="text"
                value={form.ansprechpartner}
                onChange={(e) => setForm({ ...form, ansprechpartner: e.target.value })}
                className="input"
                placeholder="Max Mustermann"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                E-Mail
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="max@beispiel.de"
                required
              />
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Telefon
              </label>
              <input
                type="tel"
                value={form.telefon}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                className="input"
                placeholder="+49 123 456789"
              />
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Straße & Hausnummer
            </label>
            <input
              type="text"
              value={form.strasse}
              onChange={(e) => setForm({ ...form, strasse: e.target.value })}
              className="input"
              placeholder="Musterstraße 123"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">PLZ</label>
              <input
                type="text"
                value={form.plz}
                onChange={(e) => setForm({ ...form, plz: e.target.value })}
                className="input"
                placeholder="12345"
                required
              />
            </div>
            <div>
              <label className="label">Ort</label>
              <input
                type="text"
                value={form.ort}
                onChange={(e) => setForm({ ...form, ort: e.target.value })}
                className="input"
                placeholder="Musterstadt"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? "Speichern..." : "Kunde speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
