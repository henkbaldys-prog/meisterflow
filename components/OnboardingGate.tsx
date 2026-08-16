"use client";

import { useEffect, useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Erste Anmeldung: Firmenprofil minimal ausfüllen, dann Angebot.
 */
export default function OnboardingGate() {
  const { firmenprofil, profilUnvollstaendig, loading, saveFirmenprofil } = useData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firmenname: "",
    inhaber_name: "",
    telefon: "",
    steuernummer: "",
  });

  useEffect(() => {
    if (loading) return;
    if (profilUnvollstaendig) {
      setOpen(true);
      setForm({
        firmenname:
          firmenprofil?.firmenname && firmenprofil.firmenname !== "Mein Betrieb"
            ? firmenprofil.firmenname
            : "",
        inhaber_name: firmenprofil?.inhaber_name || "",
        telefon: firmenprofil?.telefon || "",
        steuernummer: firmenprofil?.steuernummer || "",
      });
    } else {
      setOpen(false);
    }
  }, [loading, profilUnvollstaendig, firmenprofil]);

  if (!open) return null;

  const save = async (goToAngebot: boolean) => {
    if (!form.firmenname.trim() || !form.telefon.trim() || !form.steuernummer.trim()) {
      toast.error("Firmenname, Telefon und Steuernummer sind Pflicht");
      return;
    }
    setSaving(true);
    const base = firmenprofil;
    const { error } = await saveFirmenprofil({
      firmenname: form.firmenname.trim(),
      logo_url: base?.logo_url || "",
      strasse: base?.strasse || "",
      plz: base?.plz || "",
      ort: base?.ort || "",
      telefon: form.telefon.trim(),
      email: base?.email || "",
      gewerke: base?.gewerke || [],
      stundenlohn: Number(base?.stundenlohn ?? 45),
      anfahrtspauschale: Number(base?.anfahrtspauschale ?? 25),
      materialaufschlag_prozent: base?.materialaufschlag_prozent ?? 15,
      umsatzsteuer_prozent: base?.umsatzsteuer_prozent ?? 19,
      zahlungsziel_tage: base?.zahlungsziel_tage ?? 14,
      standard_angebotstext:
        base?.standard_angebotstext ||
        "Wir bedanken uns für Ihre Anfrage und unterbreiten Ihnen hiermit unser Angebot.",
      standard_mahnungstext:
        base?.standard_mahnungstext ||
        "Wir bitten höflich um Begleichung der offenen Forderung.",
      inhaber_name: form.inhaber_name.trim(),
      steuernummer: form.steuernummer.trim(),
      ust_id: base?.ust_id || "",
      rechnungsnummer_prefix: base?.rechnungsnummer_prefix || "RE-",
      naechste_rechnungsnummer: base?.naechste_rechnungsnummer ?? 1,
      bankverbindung: base?.bankverbindung || "",
      rechnungshinweis:
        base?.rechnungshinweis ||
        "Bitte überweisen Sie den Betrag innerhalb der Zahlungsfrist.",
    });
    setSaving(false);
    if (error) {
      toast.error(
        error.message?.includes("column")
          ? "Bitte supabase/gobd-rechnung.sql in Supabase ausführen"
          : error.message || "Fehler",
      );
      return;
    }
    toast.success("Profil gespeichert");
    setOpen(false);
    if (goToAngebot) router.push("/angebote");
  };

  return (
    <div className="modal-backdrop z-[60]">
      <div className="modal-panel max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="icon-box">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-50">Willkommen!</h2>
            <p className="text-sm text-dark-400">Erstellen Sie Ihr Firmenprofil.</p>
          </div>
        </div>
        <div>
          <label className="label">Firmenname *</label>
          <input
            className="input"
            value={form.firmenname}
            onChange={(e) => setForm({ ...form, firmenname: e.target.value })}
            placeholder="Müller Elektro"
          />
        </div>
        <div>
          <label className="label">Ihr Name *</label>
          <input
            className="input"
            value={form.inhaber_name}
            onChange={(e) => setForm({ ...form, inhaber_name: e.target.value })}
            placeholder="Max Müller"
          />
        </div>
        <div>
          <label className="label">Telefon *</label>
          <input
            className="input"
            value={form.telefon}
            onChange={(e) => setForm({ ...form, telefon: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Steuernummer *</label>
          <input
            className="input"
            value={form.steuernummer}
            onChange={(e) => setForm({ ...form, steuernummer: e.target.value })}
            placeholder="Für GoBD-Rechnungen"
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => save(true)}
          className="btn-primary w-full min-h-[52px] justify-center"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Erstes Angebot erstellen
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save(false)}
          className="btn-ghost w-full min-h-[44px] justify-center text-dark-500"
        >
          Nur speichern
        </button>
      </div>
    </div>
  );
}
