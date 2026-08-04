"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Plus, Loader2, Trash2, AlertTriangle, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import type { Mitarbeiter } from "@/types/team";

export default function TeamPage() {
  const [list, setList] = useState<Mitarbeiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    rolle: "Geselle",
    telefon: "",
    baustelle: "",
    heutige_stunden: "8",
    offene_auftraege: "1",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.needsMigration) setNeedsMigration(true);
      setList(data.mitarbeiter || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tip = useMemo(() => {
    const busy = list
      .filter((m) => {
        const sites = (m.baustelle || "")
          .split(/[,;/|]/)
          .map((s) => s.trim())
          .filter(Boolean);
        return sites.length >= 2 || Number(m.offene_auftraege) >= 3;
      })
      .sort((a, b) => Number(b.offene_auftraege) - Number(a.offene_auftraege))[0];

    if (!busy) return null;
    const sites = (busy.baustelle || "")
      .split(/[,;/|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const count = Math.max(sites.length, Number(busy.offene_auftraege) || 0);
    const fahrzeit = Math.max(0.5, Math.round(count * 0.5 * 10) / 10);
    return `${busy.name} ist heute auf ${count} Baustelle${count === 1 ? "" : "n"} unterwegs. Fahrzeit: ca. ${fahrzeit}h.`;
  }, [list]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          rolle: form.rolle,
          telefon: form.telefon || null,
          baustelle: form.baustelle || null,
          heutige_stunden: Number(form.heutige_stunden) || 0,
          offene_auftraege: Number(form.offene_auftraege) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      toast.success("Mitarbeiter hinzugefügt");
      setShowForm(false);
      setForm({
        name: "",
        rolle: "Geselle",
        telefon: "",
        baustelle: "",
        heutige_stunden: "8",
        offene_auftraege: "1",
      });
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setSaving(false);
    }
  };

  const updateField = async (id: string, patch: Partial<Mitarbeiter>) => {
    const res = await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) {
      toast.error("Speichern fehlgeschlagen");
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/team?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Entfernen fehlgeschlagen");
      return;
    }
    toast.success("Entfernt");
    setList((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="section-gap page-enter">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-50">Team</h1>
          <p className="mt-1 text-dark-400">
            Mitarbeiter, Baustellen und heutige Auslastung – für Betriebe ab 3 Personen.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-primary min-h-[48px]"
        >
          <Plus className="h-4 w-4" /> Mitarbeiter
        </button>
      </div>

      {needsMigration && (
        <div className="card border-danger/30 bg-danger/5 text-sm text-red-200">
          Bitte in Supabase ausführen: <code className="text-xs">supabase/mitarbeiter.sql</code>
        </div>
      )}

      {tip && (
        <div className="card flex gap-3 border-warning/25 bg-warning/5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-dark-200">{tip}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner" />
        </div>
      ) : list.length === 0 ? (
        <div className="card py-12 text-center">
          <Users className="mx-auto h-10 w-10 text-dark-600" />
          <p className="mt-3 font-medium text-dark-200">Noch keine Mitarbeiter</p>
          <p className="mt-1 text-sm text-dark-500">
            Füge dein Team hinzu, um Baustellen und Stunden im Blick zu behalten.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary mx-auto mt-6 min-h-[48px]"
          >
            Ersten Mitarbeiter anlegen
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th>Mitarbeiter</th>
                  <th>Baustelle</th>
                  <th>Heutige Stunden</th>
                  <th>Offene Aufträge</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <p className="font-medium text-dark-50">{m.name}</p>
                      <p className="text-xs text-dark-500">{m.rolle}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-dark-500" />
                        <input
                          className="input !min-h-[40px] !py-2 text-sm"
                          style={{ fontSize: "16px" }}
                          value={m.baustelle || ""}
                          onChange={(e) =>
                            setList((prev) =>
                              prev.map((x) =>
                                x.id === m.id ? { ...x, baustelle: e.target.value } : x,
                              ),
                            )
                          }
                          onBlur={(e) => updateField(m.id, { baustelle: e.target.value })}
                          placeholder="Adresse / Baustelle"
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        className="input !min-h-[40px] !w-24 !py-2 kpi"
                        style={{ fontSize: "16px" }}
                        value={m.heutige_stunden}
                        onChange={(e) =>
                          setList((prev) =>
                            prev.map((x) =>
                              x.id === m.id
                                ? { ...x, heutige_stunden: Number(e.target.value) || 0 }
                                : x,
                            ),
                          )
                        }
                        onBlur={(e) =>
                          updateField(m.id, { heutige_stunden: Number(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className="input !min-h-[40px] !w-20 !py-2 kpi"
                        style={{ fontSize: "16px" }}
                        value={m.offene_auftraege}
                        onChange={(e) =>
                          setList((prev) =>
                            prev.map((x) =>
                              x.id === m.id
                                ? { ...x, offene_auftraege: Number(e.target.value) || 0 }
                                : x,
                            ),
                          )
                        }
                        onBlur={(e) =>
                          updateField(m.id, { offene_auftraege: Number(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        className="btn-ghost min-h-[44px] text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <form
            className="modal-panel max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
            onSubmit={add}
          >
            <h3 className="text-lg font-semibold text-dark-50">Mitarbeiter hinzufügen</h3>
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Rolle</label>
              <select
                className="input"
                value={form.rolle}
                onChange={(e) => setForm({ ...form, rolle: e.target.value })}
              >
                <option>Geselle</option>
                <option>Meister</option>
                <option>Azubi</option>
                <option>Helfer</option>
                <option>Büro</option>
              </select>
            </div>
            <div>
              <label className="label">Baustelle heute</label>
              <input
                className="input"
                value={form.baustelle}
                onChange={(e) => setForm({ ...form, baustelle: e.target.value })}
                placeholder="z.B. Müller Bau, Schmidt Sanitär"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Stunden</label>
                <input
                  type="number"
                  className="input"
                  value={form.heutige_stunden}
                  onChange={(e) => setForm({ ...form, heutige_stunden: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Offene Aufträge</label>
                <input
                  type="number"
                  className="input"
                  value={form.offene_auftraege}
                  onChange={(e) => setForm({ ...form, offene_auftraege: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary flex-1 min-h-[48px] justify-center"
              >
                Abbrechen
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 min-h-[48px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
