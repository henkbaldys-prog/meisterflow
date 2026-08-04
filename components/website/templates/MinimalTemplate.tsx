import type { HandwerkerWebsite } from "@/types/website";
import WebsiteKontaktForm from "../WebsiteKontaktForm";

export default function MinimalTemplate({
  site,
  preview,
}: {
  site: HandwerkerWebsite;
  preview?: boolean;
}) {
  const primary = site.farbe_primary || "#0f172a";
  const name = site.firmenname || "Handwerksbetrieb";

  return (
    <div
      className="flex min-h-screen flex-col bg-[#fafafa] text-slate-900"
      data-preview={preview || undefined}
    >
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-20 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
          {site.ort || "Meisterbetrieb"}
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{name}</h1>
        <p className="mt-4 text-slate-500">
          {site.hero_headline || site.slogan || "Weniger Worte. Mehr Handwerk."}
        </p>
        {site.telefon ? (
          <a
            href={`tel:${site.telefon}`}
            className="mt-10 inline-flex min-h-[56px] items-center justify-center rounded-full px-8 text-base font-semibold text-white"
            style={{ background: primary }}
          >
            Jetzt anrufen · {site.telefon}
          </a>
        ) : (
          <a
            href="#kontakt"
            className="mt-10 inline-flex min-h-[56px] items-center justify-center rounded-full px-8 text-base font-semibold text-white"
            style={{ background: primary }}
          >
            Kontakt aufnehmen
          </a>
        )}
      </main>

      <section id="kontakt" className="border-t border-slate-200 bg-white px-6 py-14">
        <div className="mx-auto max-w-md">
          <h2 className="text-center text-lg font-medium">Kurze Nachricht</h2>
          <div className="mt-6">
            {site.subdomain ? (
              <WebsiteKontaktForm subdomain={site.subdomain} primary={primary} compact />
            ) : (
              <p className="text-center text-sm text-slate-400">
                Kontaktformular nach Veröffentlichung aktiv.
              </p>
            )}
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {name}
      </footer>
    </div>
  );
}
