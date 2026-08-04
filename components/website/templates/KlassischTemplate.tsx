import type { HandwerkerWebsite } from "@/types/website";
import WebsiteKontaktForm from "../WebsiteKontaktForm";

export default function KlassischTemplate({
  site,
  preview,
}: {
  site: HandwerkerWebsite;
  preview?: boolean;
}) {
  const primary = site.farbe_primary || "#1d4ed8";
  const name = site.firmenname || "Handwerksbetrieb";
  const leistungen = site.leistungen?.length
    ? site.leistungen
    : ["Beratung", "Montage", "Reparatur", "Wartung", "Notdienst"];

  return (
    <div className="min-h-screen bg-white text-slate-900" data-preview={preview || undefined}>
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: primary }}>
              {name}
            </h1>
            <p className="text-sm text-slate-500">{site.ort || "Ihr Meisterbetrieb vor Ort"}</p>
          </div>
          {site.telefon && (
            <a
              href={`tel:${site.telefon}`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-md px-5 text-sm font-semibold text-white"
              style={{ background: primary }}
            >
              Tel. {site.telefon}
            </a>
          )}
        </div>
      </header>

      <section className="bg-white px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: primary }}>
            {site.hero_headline || "Zuverlässig. Sauber. Termingerecht."}
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            {site.hero_subheadline ||
              "Traditionelles Handwerk mit modernem Service – für Privat- und Gewerbekunden."}
          </p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold" style={{ color: primary }}>
              Leistungen
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {leistungen.map((l) => (
                <li key={l}>• {l}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: primary }}>
              Über uns
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-700">
              {site.ueber_uns ||
                `${name} steht für verlässliche Arbeit und ehrliche Beratung. Wir kommen, schauen uns die Sache an und machen einen klaren Vorschlag.`}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: primary }}>
              Kontakt
            </h3>
            <div className="mt-4 space-y-1 text-sm text-slate-700">
              {site.telefon && <p>Telefon: {site.telefon}</p>}
              {site.email && <p>E-Mail: {site.email}</p>}
              {site.ort && <p>Ort: {site.ort}</p>}
            </div>
          </div>
        </div>
      </section>

      <section id="kontakt" className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
        <h3 className="text-xl font-bold">Nachricht schreiben</h3>
        <div className="mt-6 max-w-xl">
          {site.subdomain ? (
            <WebsiteKontaktForm subdomain={site.subdomain} primary={primary} />
          ) : (
            <p className="text-sm text-slate-500">Kontaktformular nach Veröffentlichung aktiv.</p>
          )}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-100 px-4 py-8 text-xs text-slate-500 sm:px-8">
        <div className="mx-auto max-w-6xl whitespace-pre-wrap">
          <p className="font-semibold text-slate-700">
            © {new Date().getFullYear()} {name}
          </p>
          {site.impressum && <p className="mt-3">{site.impressum}</p>}
        </div>
      </footer>
    </div>
  );
}
