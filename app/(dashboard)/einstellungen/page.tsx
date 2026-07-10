"use client";

import { useEffect, useState } from "react";
import { useData } from "@/contexts/DataContext";
import { FirmenprofilInput } from "@/contexts/DataContext";
import { Save, Building2, AlertCircle } from "lucide-react";
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
};

function parseGewerke(value: string): string[] {
  return value
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

function formatGewerke(gewerke?: string[]): string {
  return gewerke?.join(", ") || "";
}

export default function EinstellungenPage() {
  const { firmenprofil, profilUnvollstaendig, loading, saveFirmenprofil } = useData();
  const [form, setForm] = useState<FirmenprofilInput>(DEFAULTS);
  const [gewerkeText, setGewerkeText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (firmenprofil) {
      setForm({
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
      });
      setGewerkeText(formatGewerke(firmenprofil.gewerke));
    }
  }, [firmenprofil]);

  const updateField = <K extends keyof FirmenprofilInput>(key: K, value: FirmenprofilInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firmenname.trim()) {
      toast.error("Bitte einen Firmennamen eingeben");
      return;
    }

    setSaving(true);
    const { error } = await saveFirmenprofil({
      ...form,
      firmenname: form.firmenname.trim(),
      logo_url: form.logo_url?.trim() || undefined,
      strasse: form.strasse?.trim() || undefined,
      plz: form.plz?.trim() || undefined,
      ort: form.ort?.trim() || undefined,
      telefon: form.telefon?.trim() || undefined,
      email: form.email?.trim() || undefined,
      gewerke: parseGewerke(gewerkeText),
    });

    if (error) {
      toast.error(
        error.message?.includes("firmenprofile")
          ? "Tabelle noch nicht angelegt – bitte SQL in Supabase ausführen (supabase/firmenprofile.sql)"
          : "Fehler beim Speichern",
      );
    } else {
      toast.success("Firmenprofil gespeichert");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">Einstellungen</h1>
        <p className="mt-1 text-dark-500">Dein Firmenprofil für Angebote, Rechnungen und KI</p>
      </div>

      {profilUnvollstaendig && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-200">
            Bitte vervollständigen Sie Ihr Firmenprofil – mindestens einen echten Firmennamen eintragen
            (nicht „Mein Betrieb“).
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Firmendaten */}
        <section className="card space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-white">Firmendaten</h2>
          </div>

          <div>
            <label className="label">Firmenname *</label>
            <input
              type="text"
              value={form.firmenname}
              onChange={(e) => updateField("firmenname", e.target.value)}
              className="input min-h-[48px]"
              required
            />
          </div>

          <div>
            <label className="label">Logo-URL</label>
            <input
              type="url"
              value={form.logo_url || ""}
              onChange={(e) => updateField("logo_url", e.target.value)}
              placeholder="https://..."
              className="input min-h-[48px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Straße</label>
              <input
                type="text"
                value={form.strasse || ""}
                onChange={(e) => updateField("strasse", e.target.value)}
                className="input min-h-[48px]"
              />
            </div>
            <div>
              <label className="label">PLZ</label>
              <input
                type="text"
                value={form.plz || ""}
                onChange={(e) => updateField("plz", e.target.value)}
                className="input min-h-[48px]"
              />
            </div>
            <div>
              <label className="label">Ort</label>
              <input
                type="text"
                value={form.ort || ""}
                onChange={(e) => updateField("ort", e.target.value)}
                className="input min-h-[48px]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Telefon</label>
              <input
                type="tel"
                value={form.telefon || ""}
                onChange={(e) => updateField("telefon", e.target.value)}
                className="input min-h-[48px]"
              />
            </div>
            <div>
              <label className="label">E-Mail</label>
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                className="input min-h-[48px]"
              />
            </div>
          </div>

          <div>
            <label className="label">Gewerke (kommagetrennt)</label>
            <input
              type="text"
              value={gewerkeText}
              onChange={(e) => setGewerkeText(e.target.value)}
              placeholder="z.B. Fliesenleger, Maler, Elektriker"
              className="input min-h-[48px]"
            />
          </div>
        </section>

        {/* Preise */}
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">Preise & Konditionen</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Stundenlohn (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.stundenlohn}
                onChange={(e) => updateField("stundenlohn", parseFloat(e.target.value) || 0)}
                className="input min-h-[48px]"
              />
            </div>
            <div>
              <label className="label">Anfahrtspauschale (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.anfahrtspauschale}
                onChange={(e) => updateField("anfahrtspauschale", parseFloat(e.target.value) || 0)}
                className="input min-h-[48px]"
              />
            </div>
            <div>
              <label className="label">Materialaufschlag (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.materialaufschlag_prozent}
                onChange={(e) => updateField("materialaufschlag_prozent", parseInt(e.target.value) || 0)}
                className="input min-h-[48px]"
              />
            </div>
            <div>
              <label className="label">Umsatzsteuer (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.umsatzsteuer_prozent}
                onChange={(e) => updateField("umsatzsteuer_prozent", parseInt(e.target.value) || 0)}
                className="input min-h-[48px]"
              />
            </div>
            <div>
              <label className="label">Zahlungsziel (Tage)</label>
              <input
                type="number"
                min="1"
                value={form.zahlungsziel_tage}
                onChange={(e) => updateField("zahlungsziel_tage", parseInt(e.target.value) || 14)}
                className="input min-h-[48px]"
              />
            </div>
          </div>
        </section>

        {/* Texte */}
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">Standardtexte</h2>

          <div>
            <label className="label">Standard-Angebotstext</label>
            <textarea
              value={form.standard_angebotstext}
              onChange={(e) => updateField("standard_angebotstext", e.target.value)}
              rows={3}
              className="input min-h-[96px] resize-y"
            />
          </div>

          <div>
            <label className="label">Standard-Mahnungstext</label>
            <textarea
              value={form.standard_mahnungstext}
              onChange={(e) => updateField("standard_mahnungstext", e.target.value)}
              rows={3}
              className="input min-h-[96px] resize-y"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary min-h-[48px] w-full justify-center sm:w-auto"
        >
          <Save className="h-5 w-5" />
          {saving ? "Speichern..." : "Profil speichern"}
        </button>
      </form>
    </div>
  );
}
