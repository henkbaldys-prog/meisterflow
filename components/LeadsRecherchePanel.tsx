"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Loader2,
  Copy,
  Check,
  Plus,
  X,
  AlertTriangle,
  Upload,
  Eye,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import type { ResearchLead } from "@/types/research";

const GEWERKE = [
  "Elektriker",
  "Fliesenleger",
  "Maler",
  "Sanitär",
  "Trockenbauer",
  "Dachdecker",
  "Schreiner",
  "Sonstige",
];

export function LeadsRecherchePanel() {
  const [gewerk, setGewerk] = useState("Elektriker");
  const [stadt, setStadt] = useState("Berlin");
  const [anzahl, setAnzahl] = useState(10);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<ResearchLead[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/ki/research/leads");
      const data = await res.json();
      if (data.needsMigration) setNeedsMigration(true);
      setLeads(data.leads || []);
    } catch {
      setLeads([]);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const research = async () => {
    if (!stadt.trim()) {
      toast.error("Stadt eingeben");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ki/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gewerk, stadt: stadt.trim(), anzahl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Recherche fehlgeschlagen");
      if (data.saveError) {
        setNeedsMigration(true);
        toast.error("SQL-Migration nötig – Ergebnisse trotzdem unten (nicht gespeichert)");
        setLeads((prev) => [...(data.leads || []), ...prev]);
      } else {
        toast.success(`${data.leads?.length || 0} Leads gefunden – bitte prüfen`);
        await loadLeads();
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setLoading(false);
    }
  };

  const markKontaktiert = async (id: string, checked: boolean) => {
    const status = checked ? "kontaktiert" : "nicht_kontaktiert";
    const res = await fetch("/api/ki/research/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      // Fallback: localStorage wenn DB fehlt
      try {
        const key = "marketing_leads_contacted";
        const map = JSON.parse(localStorage.getItem(key) || "{}") as Record<string, boolean>;
        map[id] = checked;
        localStorage.setItem(key, JSON.stringify(map));
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: status as ResearchLead["status"] } : l)),
        );
        toast.success(checked ? "Als kontaktiert markiert (lokal)" : "Status zurückgesetzt");
      } catch {
        toast.error(data.error || "Fehler");
      }
      return;
    }
    toast.success(checked ? "Als kontaktiert markiert" : "Status zurückgesetzt");
    await loadLeads();
  };

  const removeLead = async (id: string) => {
    const res = await fetch(`/api/ki/research/leads?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Entfernen fehlgeschlagen");
      return;
    }
    toast.success("Entfernt");
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const copyText = async (lead: ResearchLead, which: "kurz" | "mittel" | "lang") => {
    const text =
      which === "kurz" ? lead.text_kurz : which === "mittel" ? lead.text_mittel : lead.text_lang;
    if (!text) {
      toast.error("Kein Text vorhanden");
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(`${lead.id}-${which}`);
    toast.success("Text kopiert – manuell absenden");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="card border-amber-500/30 bg-amber-500/5">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-100/90">
            Nur Research – öffentliche Daten, Texte kopieren, manuell senden. Kein Auto-Versand.
          </p>
        </div>
      </div>

      {needsMigration && (
        <div className="card border-red-500/30 bg-red-500/5 text-sm text-red-200">
          Bitte in Supabase ausführen: <code className="text-xs">supabase/research-leads.sql</code>
        </div>
      )}

      <div className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Gewerk</label>
            <select
              className="input w-full min-h-[48px] text-base"
              value={gewerk}
              onChange={(e) => setGewerk(e.target.value)}
            >
              {GEWERKE.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Stadt</label>
            <input
              className="input w-full min-h-[48px] text-base"
              style={{ fontSize: "16px" }}
              value={stadt}
              onChange={(e) => setStadt(e.target.value)}
              placeholder="Berlin"
            />
          </div>
          <div>
            <label className="label">Anzahl: {anzahl}</label>
            <input
              type="range"
              min={1}
              max={20}
              value={anzahl}
              onChange={(e) => setAnzahl(Number(e.target.value))}
              className="mt-3 w-full accent-brand-500"
            />
            <div className="mt-1 flex justify-between text-[11px] text-dark-500">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={research}
            disabled={loading}
            className="btn-primary min-h-[52px] justify-center px-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Recherchiere…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Leads recherchieren
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-lg bg-dark-800 px-4 text-sm text-dark-200"
          >
            <Plus className="h-4 w-4" /> Manuell
          </button>
          <button
            type="button"
            onClick={() => setShowCsv(true)}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-lg bg-dark-800 px-4 text-sm text-dark-200"
          >
            <Upload className="h-4 w-4" /> CSV
          </button>
        </div>
        <p className="text-xs text-dark-500">Max. 10 Recherchen / Stunde. Kein Auto-Send.</p>
      </div>

      <div className="card overflow-hidden p-0">
        {leads.length === 0 ? (
          <p className="p-8 text-center text-sm text-dark-500">
            Noch keine Leads. Starte eine Recherche.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-dark-800 bg-dark-900">
                  {["Name", "Gewerk", "Stadt", "Webseite", "E-Mail", "Telefon", "Aktionen"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left text-xs font-semibold uppercase text-dark-500"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-dark-800/30">
                    <td className="px-3 py-3 text-sm font-medium text-white">{lead.firma}</td>
                    <td className="px-3 py-3 text-sm text-dark-300">{lead.gewerk}</td>
                    <td className="px-3 py-3 text-sm text-dark-300">{lead.stadt}</td>
                    <td className="px-3 py-3 text-sm">
                      {lead.webseite ? (
                        <a
                          href={lead.webseite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand-400 hover:underline"
                        >
                          Öffnen <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-dark-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-dark-300">
                      {lead.email || <span className="text-dark-600">nicht öffentlich</span>}
                    </td>
                    <td className="px-3 py-3 text-sm text-dark-300">{lead.telefon || "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex min-h-[44px] items-center gap-2 text-xs text-dark-300">
                          <input
                            type="checkbox"
                            checked={lead.status === "kontaktiert"}
                            onChange={(e) => markKontaktiert(lead.id, e.target.checked)}
                            className="h-5 w-5 rounded border-dark-600"
                          />
                          Kontaktiert
                        </label>
                        <button
                          type="button"
                          onClick={() => setPreviewId(previewId === lead.id ? null : lead.id)}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-dark-800 px-2 text-xs text-brand-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Text
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(lead, "kurz")}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-green-600/15 text-green-300"
                          title="Text kopieren"
                        >
                          {copied === `${lead.id}-kurz` ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLead(lead.id)}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-red-500/10 text-red-400"
                          title="Nicht interessant"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewId && (
        <TextPreview
          lead={leads.find((l) => l.id === previewId)!}
          onClose={() => setPreviewId(null)}
          onCopy={copyText}
        />
      )}

      {showManual && (
        <ManualModal
          defaultGewerk={gewerk}
          defaultStadt={stadt}
          onClose={() => setShowManual(false)}
          onSaved={async () => {
            setShowManual(false);
            await loadLeads();
          }}
        />
      )}

      {showCsv && (
        <CsvModal
          onClose={() => setShowCsv(false)}
          onSaved={async () => {
            setShowCsv(false);
            await loadLeads();
          }}
        />
      )}
    </div>
  );
}

function TextPreview({
  lead,
  onClose,
  onCopy,
}: {
  lead: ResearchLead;
  onClose: () => void;
  onCopy: (l: ResearchLead, w: "kurz" | "mittel" | "lang") => void;
}) {
  if (!lead) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">{lead.firma} – Text-Vorschläge</h3>
          <button type="button" onClick={onClose} className="text-dark-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {(
          [
            ["kurz", "WhatsApp (kurz)", lead.text_kurz],
            ["mittel", "E-Mail (mittel)", lead.text_mittel],
            ["lang", "E-Mail (lang)", lead.text_lang],
          ] as const
        ).map(([key, label, text]) => (
          <div key={key} className="mb-4 rounded-lg bg-dark-900 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase text-dark-500">{label}</p>
              <button
                type="button"
                onClick={() => onCopy(lead, key)}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-brand-600/20 px-3 text-xs text-brand-200"
              >
                <Copy className="h-3.5 w-3.5" /> Kopieren
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-dark-200">{text || "—"}</p>
          </div>
        ))}
        <p className="text-xs text-dark-500">Nur Vorschläge – du sendest manuell.</p>
      </div>
    </div>
  );
}

function ManualModal({
  defaultGewerk,
  defaultStadt,
  onClose,
  onSaved,
}: {
  defaultGewerk: string;
  defaultStadt: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firma, setFirma] = useState("");
  const [gewerk, setGewerk] = useState(defaultGewerk);
  const [stadt, setStadt] = useState(defaultStadt);
  const [webseite, setWebseite] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/ki/research/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firma, gewerk, stadt, webseite, email, telefon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      toast.success("Lead hinzugefügt");
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-md space-y-3">
        <h3 className="font-semibold text-white">Manuell hinzufügen</h3>
        <input
          className="input w-full min-h-[48px] text-base"
          style={{ fontSize: "16px" }}
          placeholder="Firma"
          value={firma}
          onChange={(e) => setFirma(e.target.value)}
        />
        <input
          className="input w-full min-h-[48px] text-base"
          style={{ fontSize: "16px" }}
          placeholder="Gewerk"
          value={gewerk}
          onChange={(e) => setGewerk(e.target.value)}
        />
        <input
          className="input w-full min-h-[48px] text-base"
          style={{ fontSize: "16px" }}
          placeholder="Stadt"
          value={stadt}
          onChange={(e) => setStadt(e.target.value)}
        />
        <input
          className="input w-full min-h-[48px] text-base"
          style={{ fontSize: "16px" }}
          placeholder="Webseite"
          value={webseite}
          onChange={(e) => setWebseite(e.target.value)}
        />
        <input
          className="input w-full min-h-[48px] text-base"
          style={{ fontSize: "16px" }}
          placeholder="Öff. E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input w-full min-h-[48px] text-base"
          style={{ fontSize: "16px" }}
          placeholder="Telefon"
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-dark-800 py-3 text-sm text-dark-300 min-h-[48px]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary flex-1 justify-center min-h-[48px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CsvModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [csv, setCsv] = useState("Firma;Gewerk;Stadt;Webseite;Email;Telefon\n");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/ki/research/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      toast.success(`${data.leads?.length || 0} Leads importiert`);
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-lg space-y-3">
        <h3 className="font-semibold text-white">CSV-Upload</h3>
        <p className="text-xs text-dark-500">Format: Firma;Gewerk;Stadt;Webseite;Email;Telefon</p>
        <textarea
          className="input min-h-[160px] w-full resize-y font-mono text-sm"
          style={{ fontSize: "16px" }}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-dark-800 py-3 text-sm min-h-[48px]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary flex-1 justify-center min-h-[48px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importieren"}
          </button>
        </div>
      </div>
    </div>
  );
}
