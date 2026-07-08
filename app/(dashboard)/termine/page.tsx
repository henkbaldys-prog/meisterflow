"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import TerminForm from "@/components/TerminForm";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Search, CalendarDays, Clock, MapPin, User, CheckCircle, XCircle, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function TerminePage() {
  const { termine, loading, updateTerminStatus } = useData();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = termine.filter((t) => {
    const matchesSearch =
      t.titel.toLowerCase().includes(search.toLowerCase()) ||
      t.kunde?.firma.toLowerCase().includes(search.toLowerCase()) ||
      t.ort.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "alle" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "alle", label: "Alle", count: termine.length },
    { value: "geplant", label: "Geplant", count: termine.filter((t) => t.status === "geplant").length },
    { value: "bestaetigt", label: "Bestätigt", count: termine.filter((t) => t.status === "bestaetigt").length },
    { value: "abgeschlossen", label: "Abgeschlossen", count: termine.filter((t) => t.status === "abgeschlossen").length },
    { value: "abgesagt", label: "Abgesagt", count: termine.filter((t) => t.status === "abgesagt").length },
  ];

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    const { error } = await updateTerminStatus(id, newStatus);
    if (error) {
      toast.error("Fehler beim Aktualisieren");
    } else {
      toast.success(`Status auf "${newStatus}" geändert`);
    }
    setUpdating(null);
  };

  // Gruppiere nach Datum
  const grouped = filtered.reduce((acc: any, termin) => {
    const date = termin.datum;
    if (!acc[date]) acc[date] = [];
    acc[date].push(termin);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Termine</h1>
          <p className="text-dark-500 mt-1">{termine.length} Termine insgesamt</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          Neuer Termin
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nach Titel, Kunde oder Ort suchen..."
          className="input pl-10"
        />
      </div>

      {/* Termine List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            <p className="text-dark-500 mt-3">Lade Termine...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <CalendarDays className="w-12 h-12 text-dark-700 mx-auto mb-3" />
            <p className="text-dark-500">
              {search || statusFilter !== "alle"
                ? "Keine Termine gefunden."
                : "Noch keine Termine. Plane deinen ersten Termin!"}
            </p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date} className="card">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dark-800">
                <CalendarDays className="w-5 h-5 text-brand-400" />
                <h3 className="font-semibold text-white">{formatDate(date)}</h3>
                <span className="text-xs text-dark-500">
                  {grouped[date].length} Termin{grouped[date].length > 1 ? "e" : ""}
                </span>
              </div>
              <div className="space-y-3">
                {grouped[date].map((termin: any) => (
                  <div
                    key={termin.id}
                    className="flex items-start justify-between p-3 bg-dark-900 rounded-lg hover:bg-dark-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{termin.titel}</h4>
                        <StatusBadge status={termin.status} />
                      </div>
                      {termin.beschreibung && (
                        <p className="text-sm text-dark-500 mb-2">{termin.beschreibung}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-dark-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {termin.uhrzeit_von} – {termin.uhrzeit_bis}
                        </span>
                        {termin.ort && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {termin.ort}
                          </span>
                        )}
                        {termin.kunde && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {termin.kunde.firma}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4 shrink-0">
                      {termin.status === "geplant" && (
                        <button
                          onClick={() => handleStatusChange(termin.id, "bestaetigt")}
                          disabled={updating === termin.id}
                          className="p-2 text-dark-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Bestätigen"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {(termin.status === "geplant" || termin.status === "bestaetigt") && (
                        <button
                          onClick={() => handleStatusChange(termin.id, "abgeschlossen")}
                          disabled={updating === termin.id}
                          className="p-2 text-dark-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Abschließen"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {(termin.status === "geplant" || termin.status === "bestaetigt") && (
                        <button
                          onClick={() => handleStatusChange(termin.id, "abgesagt")}
                          disabled={updating === termin.id}
                          className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Absagen"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && <TerminForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
