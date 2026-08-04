"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Loader2,
  Sparkles,
  ExternalLink,
  Smartphone,
  Monitor,
  Save,
  Rocket,
} from "lucide-react";
import toast from "react-hot-toast";
import { useData } from "@/contexts/DataContext";
import WebsiteRenderer from "@/components/website/WebsiteRenderer";
import {
  slugifySubdomain,
  type HandwerkerWebsite,
  type WebsiteTemplate,
} from "@/types/website";

type Tab = "vorlage" | "farbe" | "texte" | "vorschau";

const TEMPLATES: { id: WebsiteTemplate; name: string; desc: string }[] = [
  { id: "modern", name: "Modern", desc: "Fullscreen-Hero, bold, zeitgemäß" },
  { id: "klassisch", name: "Klassisch", desc: "Blau-Weiß, vertrauenswürdig" },
  { id: "minimalistisch", name: "Minimalistisch", desc: "Name + Anruf-CTA, edel" },
];

export default function WebsiteEditorPage() {
  const { firmenprofil } = useData();
  const [tab, setTab] = useState<Tab>("vorlage");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kiLoading, setKiLoading] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [site, setSite] = useState<Partial<HandwerkerWebsite>>({
    template: "modern",
    farbe_primary: "#6366F1",
    status: "entwurf",
    leistungen: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/website");
      const data = await res.json();
      if (data.needsMigration) setNeedsMigration(true);
      if (data.website) {
        setSite(data.website);
      } else if (firmenprofil) {
        setSite((prev) => ({
          ...prev,
          firmenname: firmenprofil.firmenname,
          telefon: firmenprofil.telefon,
          email: firmenprofil.email,
          ort: firmenprofil.ort,
          logo_url: firmenprofil.logo_url,
          subdomain: slugifySubdomain(firmenprofil.firmenname),
          leistungen: firmenprofil.gewerke || [],
          seo_titel: `${firmenprofil.firmenname} – Handwerk`,
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [firmenprofil]);

  useEffect(() => {
    load();
  }, [load]);

  const previewSite = useMemo(() => {
    return {
      id: site.id || "preview",
      user_id: site.user_id || "",
      subdomain: site.subdomain || "vorschau",
      status: (site.status || "entwurf") as HandwerkerWebsite["status"],
      template: (site.template || "modern") as WebsiteTemplate,
      farbe_primary: site.farbe_primary || "#6366F1",
      seo_titel: site.seo_titel || null,
      seo_beschreibung: site.seo_beschreibung || null,
      impressum: site.impressum || null,
      datenschutz: site.datenschutz || null,
      hero_headline: site.hero_headline || null,
      hero_subheadline: site.hero_subheadline || null,
      ueber_uns: site.ueber_uns || null,
      leistungen: site.leistungen || [],
      firmenname: site.firmenname || firmenprofil?.firmenname || "Mein Betrieb",
      telefon: site.telefon || firmenprofil?.telefon || null,
      email: site.email || firmenprofil?.email || null,
      ort: site.ort || firmenprofil?.ort || null,
      logo_url: site.logo_url || firmenprofil?.logo_url || null,
      slogan: site.slogan || null,
      created_at: site.created_at || new Date().toISOString(),
      updated_at: site.updated_at || new Date().toISOString(),
    } satisfies HandwerkerWebsite;
  }, [site, firmenprofil]);

  const publicUrl = site.subdomain ? `/w/${site.subdomain}` : null;

  const save = async (extra?: Record<string, unknown>) => {
    setSaving(true);
    try {
      const method = site.id ? "PATCH" : "POST";
      const res = await fetch("/api/website", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...site, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      if (data.needsMigration) setNeedsMigration(true);
      setSite(data.website);
      toast.success("Gespeichert");
      return data.website as HandwerkerWebsite;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Fehler");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!site.subdomain?.trim()) {
      toast.error("Bitte Subdomain setzen");
      setTab("texte");
      return;
    }
    const saved = await save({ publish: true });
    if (saved) toast.success("Veröffentlicht!");
  };

  const generateKi = async () => {
    setKiLoading(true);
    try {
      const res = await fetch("/api/website/ki-texte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firmenname: site.firmenname || firmenprofil?.firmenname,
          ort: site.ort || firmenprofil?.ort,
          gewerk: firmenprofil?.gewerke?.[0],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "KI-Fehler");
      setSite((prev) => ({
        ...prev,
        hero_headline: data.texte.hero_headline,
        hero_subheadline: data.texte.hero_subheadline,
        ueber_uns: data.texte.ueber_uns,
        leistungen: data.texte.leistungen,
        seo_beschreibung: data.texte.seo_beschreibung,
      }));
      toast.success("KI-Texte eingefügt – bitte prüfen");
      setTab("texte");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setKiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="section-gap page-enter">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/einstellungen"
            className="mb-2 inline-flex items-center gap-1 text-sm text-dark-500 hover:text-brand-400"
          >
            <ArrowLeft className="h-4 w-4" /> Einstellungen
          </Link>
          <h1 className="text-3xl font-bold text-dark-50">Meine Website</h1>
          <p className="mt-1 text-dark-400">
            Vorlage wählen, Texte anpassen, veröffentlichen – ohne Domain-Kosten.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            className="btn-secondary min-h-[48px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Speichern
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={saving}
            className="btn-primary min-h-[48px]"
          >
            <Rocket className="h-4 w-4" />
            Veröffentlichen
          </button>
        </div>
      </div>

      {needsMigration && (
        <div className="card border-danger/30 bg-danger/5 text-sm text-red-200">
          Bitte in Supabase ausführen:{" "}
          <code className="text-xs">supabase/handwerker-websites.sql</code>
        </div>
      )}

      {site.status === "veroeffentlicht" && publicUrl && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-success/20 bg-success/5">
          <div className="flex items-center gap-2 text-sm text-dark-200">
            <Globe className="h-4 w-4 text-success" />
            Live unter{" "}
            <code className="rounded bg-dark-950/50 px-2 py-0.5 text-accent">{publicUrl}</code>
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost min-h-[44px]"
          >
            Öffnen <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-card border border-white/[0.06] bg-dark-900 p-1">
        {(
          [
            ["vorlage", "Vorlage wählen"],
            ["farbe", "Farbe"],
            ["texte", "SEO & Texte"],
            ["vorschau", "Vorschau"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-[48px] flex-1 rounded-btn px-3 text-sm font-medium transition-colors ${
              tab === id ? "bg-brand-500/10 text-brand-300" : "text-dark-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "vorlage" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSite((s) => ({ ...s, template: t.id }))}
              className={`card-interactive text-left ${
                site.template === t.id ? "border-brand-500/40 ring-1 ring-brand-500/30" : ""
              }`}
            >
              <div
                className="mb-4 h-28 rounded-btn"
                style={{
                  background:
                    t.id === "modern"
                      ? `linear-gradient(135deg, ${site.farbe_primary || "#6366F1"}, #0f172a)`
                      : t.id === "klassisch"
                        ? "linear-gradient(180deg, #f8fafc, #dbeafe)"
                        : "linear-gradient(180deg, #fafafa, #e2e8f0)",
                }}
              />
              <p className="font-semibold text-dark-50">{t.name}</p>
              <p className="mt-1 text-sm text-dark-500">{t.desc}</p>
            </button>
          ))}
        </div>
      )}

      {tab === "farbe" && (
        <div className="card max-w-md space-y-4">
          <label className="label">Primary-Farbe</label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={site.farbe_primary || "#6366F1"}
              onChange={(e) => setSite((s) => ({ ...s, farbe_primary: e.target.value }))}
              className="h-14 w-14 cursor-pointer rounded-btn border border-white/[0.08] bg-transparent"
            />
            <input
              className="input"
              value={site.farbe_primary || "#6366F1"}
              onChange={(e) => setSite((s) => ({ ...s, farbe_primary: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["#6366F1", "#1d4ed8", "#0f172a", "#059669", "#b45309"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSite((s) => ({ ...s, farbe_primary: c }))}
                className="h-10 w-10 rounded-btn border border-white/10"
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "texte" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generateKi}
              disabled={kiLoading}
              className="btn-accent min-h-[48px]"
            >
              {kiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              KI-Texte generieren
            </button>
          </div>

          <div className="card grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Subdomain (URL)</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="input"
                  value={site.subdomain || ""}
                  onChange={(e) =>
                    setSite((s) => ({ ...s, subdomain: slugifySubdomain(e.target.value) }))
                  }
                  placeholder="mueller-fliesen"
                />
                <span className="shrink-0 text-xs text-dark-500">→ /w/{site.subdomain || "…"}</span>
              </div>
            </div>
            <div>
              <label className="label">SEO-Titel</label>
              <input
                className="input"
                value={site.seo_titel || ""}
                onChange={(e) => setSite((s) => ({ ...s, seo_titel: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">SEO-Beschreibung</label>
              <input
                className="input"
                value={site.seo_beschreibung || ""}
                onChange={(e) => setSite((s) => ({ ...s, seo_beschreibung: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Hero-Headline</label>
              <input
                className="input"
                value={site.hero_headline || ""}
                onChange={(e) => setSite((s) => ({ ...s, hero_headline: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Hero-Subheadline</label>
              <input
                className="input"
                value={site.hero_subheadline || ""}
                onChange={(e) => setSite((s) => ({ ...s, hero_subheadline: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Über uns</label>
              <textarea
                className="input min-h-[100px] resize-y"
                value={site.ueber_uns || ""}
                onChange={(e) => setSite((s) => ({ ...s, ueber_uns: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Leistungen (eine pro Zeile)</label>
              <textarea
                className="input min-h-[120px] resize-y"
                value={(site.leistungen || []).join("\n")}
                onChange={(e) =>
                  setSite((s) => ({
                    ...s,
                    leistungen: e.target.value
                      .split("\n")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Impressum</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={site.impressum || ""}
                onChange={(e) => setSite((s) => ({ ...s, impressum: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Datenschutz</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={site.datenschutz || ""}
                onChange={(e) => setSite((s) => ({ ...s, datenschutz: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {tab === "vorschau" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMobilePreview(false)}
              className={`btn-ghost min-h-[44px] ${!mobilePreview ? "bg-brand-500/10 text-brand-300" : ""}`}
            >
              <Monitor className="h-4 w-4" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setMobilePreview(true)}
              className={`btn-ghost min-h-[44px] ${mobilePreview ? "bg-brand-500/10 text-brand-300" : ""}`}
            >
              <Smartphone className="h-4 w-4" /> Mobile
            </button>
          </div>
          <div className="overflow-hidden rounded-modal border border-white/[0.06] bg-dark-950 p-2 sm:p-4">
            <div
              className={`mx-auto overflow-hidden rounded-card border border-white/10 bg-white shadow-modal transition-all ${
                mobilePreview ? "max-w-[375px]" : "max-w-5xl"
              }`}
            >
              <div className="max-h-[70vh] overflow-y-auto">
                <WebsiteRenderer site={previewSite} preview />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
