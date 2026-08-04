"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Mic,
  Camera,
  FileText,
  Eye,
  Bell,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  Shield,
  Clock,
  Wrench,
} from "lucide-react";
import MeisterFlowLogo from "@/components/MeisterFlowLogo";
import AppPreview from "@/components/AppPreview";
import toast from "react-hot-toast";

export default function LandingPage() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (user) {
    router.push("/dashboard");
    return null;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        isLogin ? "Erfolgreich eingeloggt!" : "Konto erstellt! Bitte bestätige deine E-Mail.",
      );
      if (isLogin) router.push("/dashboard");
    }
  };

  const features = [
    {
      icon: Mic,
      title: "Sprache zu Angebot",
      desc: "Auftrag diktieren – fertiges Angebot in Sekunden.",
    },
    {
      icon: Camera,
      title: "Foto zu Angebot",
      desc: "Baustellenfoto hochladen, Positionen automatisch erfassen.",
    },
    {
      icon: FileText,
      title: "PDF & Versand",
      desc: "Professionelle PDFs per WhatsApp oder E-Mail.",
    },
    {
      icon: Eye,
      title: "Angebot-Tracking",
      desc: "Sehen, wann Kunden dein Angebot öffnen.",
    },
    {
      icon: Bell,
      title: "Automatische Mahnungen",
      desc: "Offene Rechnungen nie wieder vergessen.",
    },
    {
      icon: RefreshCw,
      title: "Follow-ups",
      desc: "Nachfassen zur richtigen Zeit – ohne Excel.",
    },
  ];

  const handleNotifyMe = (planName: string) => {
    toast.success(
      `${planName} ist noch in Entwicklung. Schreib uns an kontakt@meisterflow.de – wir informieren dich.`,
    );
  };

  return (
    <div className="app-shell min-h-screen">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-dark-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <MeisterFlowLogo size="sm" priority />
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-dark-400 transition-colors hover:text-white">
              Features
            </a>
            <a href="#preise" className="text-sm text-dark-400 transition-colors hover:text-white">
              Preise
            </a>
            <button
              onClick={() => {
                setShowAuth(true);
                setIsLogin(true);
              }}
              className="btn-ghost"
            >
              Login
            </button>
            <button
              onClick={() => {
                setShowAuth(true);
                setIsLogin(false);
              }}
              className="btn-primary"
            >
              Kostenlos testen
            </button>
          </div>
          <button
            className="flex h-12 w-12 items-center justify-center text-dark-400 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menü"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="space-y-2 border-b border-white/[0.06] bg-dark-900 px-4 py-4 md:hidden">
            <a href="#features" className="block py-3 text-dark-300">
              Features
            </a>
            <a href="#preise" className="block py-3 text-dark-300">
              Preise
            </a>
            <button
              onClick={() => {
                setShowAuth(true);
                setIsLogin(true);
              }}
              className="block py-3 text-dark-300"
            >
              Login
            </button>
            <button
              onClick={() => {
                setShowAuth(true);
                setIsLogin(false);
              }}
              className="btn-primary w-full justify-center"
            >
              Kostenlos testen
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="px-4 pb-20 pt-28 sm:pt-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="page-enter text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-btn border border-brand-500/20 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              KI für Handwerksbetriebe
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-dark-50 sm:text-5xl lg:text-6xl">
              Büroarbeit war gestern.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-dark-400 sm:text-lg lg:mx-0">
              MeisterFlow erstellt Angebote per Sprache und Foto, trackt Öffnungen und mahnt
              automatisch – damit du wieder auf der Baustelle bist.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button
                onClick={() => {
                  setShowAuth(true);
                  setIsLogin(false);
                }}
                className="btn-primary min-h-[52px] px-7 text-base"
              >
                14 Tage kostenlos testen
                <ArrowRight className="h-5 w-5" />
              </button>
              <a href="#features" className="btn-secondary min-h-[52px] justify-center px-7 text-base">
                Features ansehen
              </a>
            </div>
          </div>
          <div className="page-enter [animation-delay:80ms]">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-white/[0.06] px-4 py-10">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-medium text-dark-400">
            Bereits von Handwerkern in Deutschland genutzt
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { icon: Wrench, label: "Elektriker" },
              { icon: Shield, label: "Sanitär" },
              { icon: Clock, label: "Maler" },
              { icon: FileText, label: "Dachdecker" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-dark-500"
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-dark-50 sm:text-4xl">
              Alles, was dein Büro braucht
            </h2>
            <p className="mt-4 text-dark-400">
              Sechs Werkzeuge. Ein Flow. Kein Excel-Chaos.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card-interactive">
                  <div className="icon-box mb-5">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-semibold text-dark-50">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-dark-400">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing – middle plan highlighted */}
      <section id="preise" className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-dark-50 sm:text-4xl">
              Klare Preise
            </h2>
            <p className="mt-4 text-dark-400">
              Keine versteckten Kosten. Jederzeit kündbar.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3 md:items-stretch">
            {[
              {
                name: "Starter",
                price: "35",
                desc: "Für Solo-Handwerker",
                features: [
                  "KI-Angebote",
                  "Auto-Rechnungen",
                  "Kundenverwaltung",
                  "WhatsApp & E-Mail",
                  "14 Tage kostenlos",
                ],
                cta: "Jetzt starten",
                highlight: false,
                comingSoon: false,
              },
              {
                name: "Professional",
                price: "49",
                desc: "Für kleine Betriebe",
                features: [
                  "Alles aus Starter",
                  "Tracking & Follow-ups",
                  "Mahnungs-Automatik",
                  "Marketing-Studio",
                  "Bis 5 Mitarbeiter",
                ],
                cta: "Notify Me",
                highlight: true,
                comingSoon: true,
              },
              {
                name: "Business",
                price: "75",
                desc: "Für wachsende Betriebe",
                features: [
                  "Alles aus Professional",
                  "Bis 15 Mitarbeiter",
                  "Team-Übersicht",
                  "Prioritäts-Support",
                  "API-Zugriff",
                ],
                cta: "Notify Me",
                highlight: false,
                comingSoon: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`card relative flex flex-col ${
                  plan.highlight
                    ? "border-brand-500/40 ring-1 ring-brand-500/30 md:scale-[1.03]"
                    : ""
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge badge-blue px-3 py-1">Empfohlen</span>
                  </div>
                )}
                {plan.comingSoon && !plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge badge-yellow">Coming soon</span>
                  </div>
                )}
                <div className="mb-6 text-center">
                  <h3 className="text-lg font-semibold text-dark-50">{plan.name}</h3>
                  <p className="mt-1 text-sm text-dark-500">{plan.desc}</p>
                  <div className="mt-5">
                    <span className="kpi text-4xl text-white">{plan.price}€</span>
                    <span className="text-dark-500">/Monat</span>
                  </div>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-dark-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    plan.comingSoon
                      ? handleNotifyMe(plan.name)
                      : (() => {
                          setShowAuth(true);
                          setIsLogin(false);
                        })()
                  }
                  className={
                    plan.highlight
                      ? "btn-primary w-full justify-center"
                      : "btn-secondary w-full justify-center"
                  }
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-modal border border-white/[0.06] bg-gradient-to-br from-brand-500/15 via-dark-900 to-dark-900 p-8 text-center sm:p-12">
          <h2 className="text-3xl font-bold text-dark-50 sm:text-4xl">
            Zurück auf die Baustelle.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-dark-400">
            Starte mit 14 Tagen kostenlos. Keine Kreditkarte nötig.
          </p>
          <button
            onClick={() => {
              setShowAuth(true);
              setIsLogin(false);
            }}
            className="btn-primary mx-auto mt-8 min-h-[52px] px-8 text-base"
          >
            Jetzt kostenlos testen
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer 4 columns */}
      <footer className="border-t border-white/[0.06] px-4 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <MeisterFlowLogo size="sm" />
            <p className="mt-4 text-sm leading-relaxed text-dark-500">
              KI-Automation für Handwerksbetriebe. Weniger Büro. Mehr Umsatz.
            </p>
          </div>
          <div>
            <p className="label !mb-4">Produkt</p>
            <ul className="space-y-3 text-sm text-dark-400">
              <li>
                <a href="#features" className="hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#preise" className="hover:text-white">
                  Preise
                </a>
              </li>
              <li>
                <a href="/ratgeber" className="hover:text-white">
                  Ratgeber
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="label !mb-4">Rechtliches</p>
            <ul className="space-y-3 text-sm text-dark-400">
              <li>
                <a href="#" className="hover:text-white">
                  Datenschutz
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Impressum
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  AGB
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="label !mb-4">Kontakt</p>
            <ul className="space-y-3 text-sm text-dark-400">
              <li>
                <a href="mailto:kontakt@meisterflow.de" className="hover:text-white">
                  kontakt@meisterflow.de
                </a>
              </li>
              <li className="text-dark-500">© 2026 MeisterFlow</li>
            </ul>
          </div>
        </div>
      </footer>

      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div
            className="modal-panel max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAuth(false)}
              className="modal-close"
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-6 text-center">
              <div className="mb-4 flex justify-center">
                <MeisterFlowLogo size="md" />
              </div>
              <h2 className="text-2xl font-bold text-dark-50">
                {isLogin ? "Willkommen zurück" : "Konto erstellen"}
              </h2>
              <p className="mt-1 text-sm text-dark-500">
                {isLogin ? "Melde dich an, um fortzufahren" : "Starte deine 14 Tage kostenlos"}
              </p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="label">E-Mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="dein@email.de"
                  required
                />
              </div>
              <div>
                <label className="label">Passwort</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn-primary w-full justify-center min-h-[48px]">
                {isLogin ? "Anmelden" : "Konto erstellen"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-dark-500">
              {isLogin ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-brand-400 hover:text-brand-300"
              >
                {isLogin ? "Jetzt registrieren" : "Jetzt anmelden"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
