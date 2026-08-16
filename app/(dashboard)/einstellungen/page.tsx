"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "@/contexts/DataContext";
import { FirmenprofilInput } from "@/contexts/DataContext";
import { Save, Building2, AlertCircle, ImagePlus, Loader2, Trash2, Receipt } from "lucide-react";
import { uploadFirmenLogo, removeFirmenLogo } from "@/lib/upload-logo";
import { formatRechnungsnummer } from "@/lib/rechnungsnummer";
import { SHOW } from "@/lib/feature-flags";
import toast from "react-hot-toast";

const DEFAULTS: FirmenprofilInput = {
  firmenname: "Mein Betrieb",
  logo_url: "",
  strasse: "",
  plz: "",
  ort: "",
  telefon: "",
  email: "",
  gewerke: [],
  stundenlohn: 45,
  anfahrtspauschale: 25,
  materialaufschlag_prozent: 15,
  umsatzsteuer_prozent: 19,
  zahlungsziel_tage: 14,
  standard_angebotstext:
    "Wir bedanken uns für Ihre Anfrage und unterbreiten Ihnen hiermit unser Angebot.",
  standard_mahnungstext: "Wir bitten höflich um Begleichung der offenen Forderung.",
  inhaber_name: "",
  steuernummer: "",
  ust_id: "",
  rechnungsnummer_prefix: "RE-",
  naechste_rechnungsnummer: 1,
  bankverbindung: "",
  rechnungshinweis: "Bitte überweisen Sie den Betrag innerhalb der Zahlungsfrist.",
};

type Tab = "firma" | "rechnung";

export default function EinstellungenPage() {
  const { firmenprofil, profilUnvollstaendig, loading, saveFirmenprofil } = useData();
  const [tab, setTab] = useState<Tab>("firma");
  const [form, setForm] = useState<FirmenprofilInput>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firmenprofil) {
      setForm({
        ...DEFAULTS,
        firmenname: firmenprofil.firmenname,
        logo_url: firmenprofil.logo_url || "",
        strasse: firmenprofil.strasse || "",
        plz: firmenprofil.plz || "",
        ort: firmenprofil.ort || "",
        telefon: firmenprofil.telefon || "",
        email: firmenprofil.email || "",
        gewerke: firmenprofil.gewerke || [],
        stundenlohn: Number(firmenprofil.stundenlohn),
        anfahrtspauschale: Number(firmenprofil.anfahrtspauschale),
        materialaufschlag_prozent: firmenprofil.materialaufschlag_prozent,
        umsatzsteuer_prozent: firmenprofil.umsatzsteuer_prozent,
        zahlungsziel_tage: firmenprofil.zahlungsziel_tage,
        standard_angebotstext: firmenprofil.standard_angebotstext,
        standard_mahnungstext: firmenprofil.standard_mahnungstext,
        inhaber_name: firmenprofil.inhaber_name || "",
        steuernummer: firmenprofil.steuernummer || "",
        ust_id: firmenprofil.ust_id || "",
        rechnungsnummer_prefix: firmenprofil.rechnungsnummer_prefix || "RE-",
        naechste_rechnungsnummer: firmenprofil.naechste_rechnungsnummer ?? 1,
        bankverbindung: firmenprofil.bankverbindung || "",
        rechnungshinweis:
          firmenprofil.rechnungshinweis ||
          "Bitte überweisen Sie den Betrag innerhalb der Zahlungsfrist.",
      });
    }
  }, [firmenprofil]);

  const updateField = <K extends keyof FirmenprofilInput>(key: K, value: FirmenprofilInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firmenname.trim() || form.firmenname.trim() === "Mein Betrieb") {
      toast.error("Bitte echten Firmennamen eingeben");
      return;
    }
    setSaving(true);
    const { error } = await saveFirmenprofil({
      ...form,
      firmenname: form.firmenname.trim(),
      naechste_rechnungsnummer: Math.max(1, Number(form.naechste_rechnungsnummer) || 1),
    });
    setSaving(false);
    if (error) {
      toast.error(
        error.message?.includes("column")
          ? "SQL fehlt: supabase/gobd-rechnung.sql in Supabase ausführen"
          : error.message || "Speichern fehlgeschlagen",
      );
      return;
    }
    toast.success("Gespeichert");
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const {
        data: { user },
      } = await (await import("@/lib/supabase")).supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");
      const { url, error } = await uploadFirmenLogo(file, user.id);
      if (error || !url) throw error || new Error("Upload fehlgeschlagen");
      updateField("logo_url", url);
      toast.success("Logo hochgeladen");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const previewNr = formatRechnungsnummer(
    form.rechnungsnummer_prefix,
    Number(form.naechste_rechnungsnummer) || 1,
  );

  return (
    <div className="mx-auto max-w-3xl section-gap page-enter">
      <div>
        <h1 className="text-2xl font-bold text-dark-50 md:text-3xl">Einstellungen</h1>
        <p className="mt-1 text-dark-400">Firmenprofil und GoBD-Rechnungsdaten</p>
      </div>

      {profilUnvollstaendig && (
        <div className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-amber-100">
            Bitte Firmennamen und Steuernummer ausfüllen – nötig für rechtssichere Rechnungen.
          </p>
        </div>
      )}

      <div className="flex gap-2 rounded-card border border-white/[0.06] bg-dark-900 p-1">
        <button
          type="button"
          onClick={() => setTab("firma")}
          className={`flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-btn text-sm font-medium ${
            tab === "firma" ? "bg-brand-500/10 text-brand-300" : "text-dark-400"
          }`}
        >
          <Building2 className="h-4 w-4" /> Firmenprofil
        </button>
        <button
          type="button"
          onClick={() => setTab("rechnung")}
          className={`flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-btn text-sm font-medium ${
            tab === "rechnung" ? "bg-brand-500/10 text-brand-300" : "text-dark-400"
          }`}
        >
          <Receipt className="h-4 w-4" /> Rechnung &amp; Steuer
        </button>
      </div>

      {/* Website-Builder ausgeblendet im Fokus-Modus */}
      {SHOW.websiteBuilder ? null : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {tab === "firma" && (
          <section className="card space-y-4">
            <div>
              <label className="label">Firmenname *</label>
              <input
                className="input"
                value={form.firmenname}
                onChange={(e) => updateField("firmenname", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Name (Inhaber / Ansprechpartner) *</label>
              <input
                className="input"
                value={form.inhaber_name || ""}
                onChange={(e) => updateField("inhaber_name", e.target.value)}
                placeholder="Max Mustermann"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Telefon *</label>
                <input
                  className="input"
                  value={form.telefon || ""}
                  onChange={(e) => updateField("telefon", e.target.value)}
                />
              </div>
              <div>
                <label className="label">E-Mail</label>
                <input
                  type="email"
                  className="input"
                  value={form.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Straße</label>
              <input
                className="input"
                value={form.strasse || ""}
                onChange={(e) => updateField("strasse", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">PLZ</label>
                <input
                  className="input"
                  value={form.plz || ""}
                  onChange={(e) => updateField("plz", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Ort</label>
                <input
                  className="input"
                  value={form.ort || ""}
                  onChange={(e) => updateField("ort", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Logo</label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoUpload(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="btn-secondary min-h-[48px]"
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Hochladen
                </button>
                {form.logo_url && (
                  <button
                    type="button"
                    className="btn-ghost min-h-[48px] text-danger"
                    onClick={async () => {
                      try {
                        const {
                          data: { user },
                        } = await (await import("@/lib/supabase")).supabase.auth.getUser();
                        if (user) await removeFirmenLogo(user.id);
                      } catch {
                        // ignore
                      }
                      updateField("logo_url", "");
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Entfernen
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {tab === "rechnung" && (
          <section className="card space-y-4">
            <p className="text-sm text-dark-400">
              Pflichtangaben für GoBD / § 14 UStG – erscheinen auf jeder Rechnungs-PDF.
            </p>
            <div>
              <label className="label">Steuernummer *</label>
              <input
                className="input"
                value={form.steuernummer || ""}
                onChange={(e) => updateField("steuernummer", e.target.value)}
                placeholder="12/345/67890"
              />
            </div>
            <div>
              <label className="label">USt-IdNr. (optional)</label>
              <input
                className="input"
                value={form.ust_id || ""}
                onChange={(e) => updateField("ust_id", e.target.value)}
                placeholder="DE123456789"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Rechnungsnummer-Präfix</label>
                <input
                  className="input"
                  value={form.rechnungsnummer_prefix || "RE-"}
                  onChange={(e) => updateField("rechnungsnummer_prefix", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Nächste Nummer</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={form.naechste_rechnungsnummer ?? 1}
                  onChange={(e) =>
                    updateField("naechste_rechnungsnummer", parseInt(e.target.value) || 1)
                  }
                />
              </div>
            </div>
            <p className="text-xs text-dark-500">
              Nächste Rechnung: <span className="kpi text-brand-300">{previewNr}</span>
            </p>
            <div>
              <label className="label">Zahlungsziel (Tage)</label>
              <input
                type="number"
                min={1}
                className="input"
                value={form.zahlungsziel_tage}
                onChange={(e) => updateField("zahlungsziel_tage", parseInt(e.target.value) || 14)}
              />
            </div>
            <div>
              <label className="label">Bankverbindung</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={form.bankverbindung || ""}
                onChange={(e) => updateField("bankverbindung", e.target.value)}
                placeholder="IBAN … BIC … Bankname"
              />
            </div>
            <div>
              <label className="label">Hinweis auf der Rechnung</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={form.rechnungshinweis || ""}
                onChange={(e) => updateField("rechnungshinweis", e.target.value)}
              />
            </div>
            <div>
              <label className="label">MwSt.-Satz Standard (%)</label>
              <select
                className="input"
                value={form.umsatzsteuer_prozent}
                onChange={(e) => updateField("umsatzsteuer_prozent", parseInt(e.target.value))}
              >
                <option value={19}>19%</option>
                <option value={7}>7%</option>
                <option value={0}>0%</option>
              </select>
            </div>
          </section>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full min-h-[52px] justify-center">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Speichern
        </button>
      </form>
    </div>
  );
}
