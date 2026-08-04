import type { HandwerkerWebsite } from "@/types/website";
import WebsiteKontaktForm from "../WebsiteKontaktForm";

export default function ModernTemplate({
  site,
  preview,
}: {
  site: HandwerkerWebsite;
  preview?: boolean;
}) {
  const primary = site.farbe_primary || "#6366F1";
  const name = site.firmenname || "Handwerksbetrieb";
  const leistungen = site.leistungen?.length
    ? site.leistungen
    : ["Beratung", "Ausführung", "Wartung", "Notdienst", "Garantie"];

  return (
    <div className="min-h-screen bg-slate-950 text-white" data-preview={preview || undefined}>
      <header
        className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-8 sm:pb-32 sm:pt-24"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, #0f172a 55%, #020617 100%)`,
        }}
      >
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="text-sm font-medium uppercase tracking-widest text-white/70">
            {site.ort || "Deutschland"}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">{name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85 sm:text-xl">
            {site.hero_headline || site.slogan || "Qualität, auf die Sie bauen können."}
          </p>
          <p className="mt-3 max-w-xl text-white/70">
            {site.hero_subheadline ||
              "Persönliche Beratung, saubere Ausführung und Termine, die stimmen."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {site.telefon && (
              <a
                href={`tel:${site.telefon}`}
                className="inline-flex min-h-[48px] items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900"
              >
                Jetzt anrufen
              </a>
            )}
            <a
              href="#kontakt"
              className="inline-flex min-h-[48px] items-center rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white"
            >
              Anfrage senden
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        <h2 className="text-2xl font-bold">Leistungen</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {leistungen.map((l) => (
            <li
              key={l}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-slate-100"
            >
              <span className="mr-2 font-bold" style={{ color: primary }}>
                ✓
              </span>
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold">Über uns</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-300">
            {site.ueber_uns ||
              `${name} ist Ihr zuverlässiger Partner vor Ort. Wir arbeiten transparent, termingerecht und mit Handschlagqualität.`}
          </p>
        </div>
      </section>

      <section id="kontakt" className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        <h2 className="text-2xl font-bold">Kontakt</h2>
        <p className="mt-2 text-slate-400">Schreiben Sie uns – wir melden uns persönlich.</p>
        <div className="mt-8 max-w-xl">
          {site.subdomain ? (
            <WebsiteKontaktForm subdomain={site.subdomain} primary={primary} />
          ) : (
            <p className="text-sm text-slate-500">Kontaktformular nach Veröffentlichung aktiv.</p>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-10 text-sm text-slate-500 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {name}</span>
          <div className="flex gap-4">
            {site.impressum && <span>Impressum</span>}
            {site.datenschutz && <span>Datenschutz</span>}
          </div>
        </div>
        {(site.impressum || site.datenschutz) && (
          <div className="mx-auto mt-6 max-w-5xl space-y-4 whitespace-pre-wrap text-xs text-slate-600">
            {site.impressum && (
              <div>
                <p className="font-semibold text-slate-400">Impressum</p>
                <p>{site.impressum}</p>
              </div>
            )}
            {site.datenschutz && (
              <div>
                <p className="font-semibold text-slate-400">Datenschutz</p>
                <p>{site.datenschutz}</p>
              </div>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
