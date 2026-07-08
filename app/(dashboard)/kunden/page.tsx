"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import KundenForm from "@/components/KundenForm";
import { Plus, Search, Trash2, Mail, Phone, MapPin, Building2, User } from "lucide-react";
import toast from "react-hot-toast";

export default function KundenPage() {
  const { kunden, loading, deleteKunde } = useData();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = kunden.filter(
    (k) =>
      k.firma.toLowerCase().includes(search.toLowerCase()) ||
      k.ansprechpartner.toLowerCase().includes(search.toLowerCase()) ||
      k.email.toLowerCase().includes(search.toLowerCase()) ||
      k.ort.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Kunde wirklich löschen?")) return;
    setDeleting(id);
    const { error } = await deleteKunde(id);
    if (error) {
      toast.error("Fehler beim Löschen");
    } else {
      toast.success("Kunde gelöscht");
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Kunden</h1>
          <p className="text-dark-500 mt-1">{kunden.length} Kunden gesamt</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          Neuer Kunde
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nach Firma, Kontakt, E-Mail oder Ort suchen..."
          className="input pl-10"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            <p className="text-dark-500 mt-3">Lade Kunden...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-dark-700 mx-auto mb-3" />
            <p className="text-dark-500">
              {search ? "Keine Kunden gefunden." : "Noch keine Kunden. Erstelle deinen ersten Kunden!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-800">
                  <th className="text-left text-xs font-semibold text-dark-500 uppercase px-4 py-3">Firma</th>
                  <th className="text-left text-xs font-semibold text-dark-500 uppercase px-4 py-3">Kontakt</th>
                  <th className="text-left text-xs font-semibold text-dark-500 uppercase px-4 py-3 hidden md:table-cell">Adresse</th>
                  <th className="text-right text-xs font-semibold text-dark-500 uppercase px-4 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filtered.map((kunde) => (
                  <tr key={kunde.id} className="hover:bg-dark-800/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-600/10 rounded-lg flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-brand-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{kunde.firma}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-dark-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-dark-500" />
                          {kunde.ansprechpartner}
                        </p>
                        <p className="text-xs text-dark-500 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {kunde.email}
                        </p>
                        {kunde.telefon && (
                          <p className="text-xs text-dark-500 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {kunde.telefon}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-dark-400 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          {kunde.strasse}
                          <br />
                          {kunde.plz} {kunde.ort}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDelete(kunde.id)}
                        disabled={deleting === kunde.id}
                        className="text-dark-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <KundenForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
