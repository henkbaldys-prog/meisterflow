"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Zap,
  FileText,
  MessageSquare,
  Calendar,
  TrendingUp,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
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
      toast.success(isLogin ? "Erfolgreich eingeloggt!" : "Konto erstellt! Bitte bestätige deine E-Mail.");
      if (isLogin) router.push("/dashboard");
    }
  };

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "KI-Angebote",
      desc: "Beschreibe den Auftrag – die KI schreibt ein professionelles Angebot in Sekunden.",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Auto-Rechnungen",
      desc: "Aus Angebot wird Rechnung mit einem Klick. Inklusive MwSt. und Zahlungsbedingungen.",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "WhatsApp-KI",
      desc: "Automatische Antworten auf Kundenanfragen via WhatsApp Business.",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Smart-Termine",
      desc: "KI findet den optimalen Termin und sendet automatische Erinnerungen.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Mahnungs-Automatik",
      desc: "Automatische Mahnungen nach Fristen – nie wieder ausstehende Zahlungen vergessen.",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Dashboard & Stats",
      desc: "Behalte Umsatz, offene Rechnungen und Angebote im Blick.",
    },
  ];

  const stats = [
    { value: "17+", label: "Stunden/Woche gespart" },
    { value: "3,7Mio", label: "Handwerker in Deutschland" },
    { value: "35€", label: "ab Monat" },
    { value: "<30s", label: "für ein Angebot" },
  ];

  const handleNotifyMe = (planName: string) => {
    toast.success(
      `${planName} ist noch in Entwicklung. Schreib uns an kontakt@meisterflow.de – wir informieren dich.`
    );
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">MeisterFlow</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-dark-400 hover:text-white transition-colors">Features</a>
              <a href="#preise" className="text-dark-400 hover:text-white transition-colors">Preise</a>
              <button
                onClick={() => { setShowAuth(true); setIsLogin(true); }}
                className="text-dark-400 hover:text-white transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => { setShowAuth(true); setIsLogin(false); }}
                className="btn-primary"
              >
                Kostenlos testen
              </button>
            </div>
            <button
              className="md:hidden text-dark-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-dark-900 border-b border-dark-800 px-4 py-4 space-y-3">
            <a href="#features" className="block text-dark-400 hover:text-white">Features</a>
            <a href="#preise" className="block text-dark-400 hover:text-white">Preise</a>
            <button onClick={() => { setShowAuth(true); setIsLogin(true); }} className="block text-dark-400 hover:text-white">Login</button>
            <button onClick={() => { setShowAuth(true); setIsLogin(false); }} className="btn-primary w-full justify-center">Kostenlos testen</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            KI-gestützte Automation für Handwerker
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Weniger Büroarbeit.<br />
            <span className="text-brand-500">Mehr Handwerk.</span>
          </h1>
          <p className="text-lg sm:text-xl text-dark-400 max-w-2xl mx-auto mb-10">
            MeisterFlow automatisiert Angebote, Rechnungen, Termine und Kundenkommunikation 
            mit KI. Spare 17+ Stunden pro Woche.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => { setShowAuth(true); setIsLogin(false); }}
              className="btn-primary text-lg px-8 py-4"
            >
              14 Tage kostenlos testen
              <ArrowRight className="w-5 h-5" />
            </button>
            <a href="#demo" className="btn-secondary text-lg px-8 py-4 justify-center">
              Demo ansehen
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="card text-center">
                <div className="text-2xl sm:text-3xl font-bold text-brand-400">{stat.value}</div>
                <div className="text-sm text-dark-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Alles, was du brauchst
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Von Angebot bis Rechnung – MeisterFlow übernimmt die komplette Büroarbeit.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card hover:border-brand-500/30 transition-all group">
                <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-500/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-dark-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              So funktioniert es
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              In 3 Schritten von der Auftragsbeschreibung zum fertigen Angebot.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Auftrag beschreiben",
                desc: 'Gib einfach ein: "Neue Elektroinstallation für ein Einfamilienhaus, ca. 200m²"',
              },
              {
                step: "02",
                title: "KI generiert Angebot",
                desc: "Die KI erstellt in Sekunden ein professionelles Angebot mit Preiskalkulation.",
              },
              {
                step: "03",
                title: "Senden & verfolgen",
                desc: "Per E-Mail oder WhatsApp senden. Status automatisch verfolgen.",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="card h-full">
                  <div className="text-4xl font-bold text-brand-500/20 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-dark-400">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-dark-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="py-20 px-4 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Einfache Preise</h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Keine versteckten Kosten. Kündige jederzeit. Aktuell nur Starter verfügbar.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "35",
                desc: "Für Solo-Handwerker",
                subtitle: "Alle Basis-Funktionen inklusive",
                features: [
                  "KI-Angebote (unbegrenzt)",
                  "Auto-Rechnungen",
                  "Kundenverwaltung",
                  "WhatsApp-Integration",
                  "E-Mail-Versand",
                  "14 Tage kostenlos",
                ],
                cta: "Jetzt starten",
                popular: true,
                comingSoon: false,
              },
              {
                name: "Professional",
                price: "49",
                desc: "Für kleine Betriebe",
                features: [
                  "Alles aus Starter",
                  "KI-Telefonassistent",
                  "Smart-Termine",
                  "Mahnungs-Automatik",
                  "Steuer-Export (DATEV)",
                  "Bis 5 Mitarbeiter",
                ],
                cta: "Notify Me",
                popular: false,
                comingSoon: true,
              },
              {
                name: "Business",
                price: "75",
                desc: "Für wachsende Betriebe",
                features: [
                  "Alles aus Professional",
                  "Bis 15 Mitarbeiter",
                  "Kundenportal",
                  "Fahrtenbuch-KI",
                  "API-Zugriff",
                  "Prioritäts-Support",
                ],
                cta: "Notify Me",
                popular: false,
                comingSoon: true,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`card relative ${
                  plan.popular
                    ? "border-brand-500 ring-1 ring-brand-500/20"
                    : plan.comingSoon
                      ? "border-dark-700 opacity-90"
                      : "border-dark-700"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="badge badge-blue">Verfügbar</span>
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      COMING SOON
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="text-dark-500 text-sm mt-1">{plan.desc}</p>
                  {"subtitle" in plan && plan.subtitle && (
                    <p className="text-brand-400 text-sm mt-2 font-medium">{plan.subtitle}</p>
                  )}
                  <div className="mt-4">
                    <span className={`text-4xl font-bold ${plan.comingSoon ? "text-dark-300" : "text-white"}`}>
                      {plan.price}€
                    </span>
                    <span className="text-dark-500">/Monat</span>
                  </div>
                  {plan.comingSoon && (
                    <p className="text-dark-500 text-sm mt-3">
                      Noch nicht verfügbar – wir arbeiten daran
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-dark-300">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${plan.comingSoon ? "text-dark-500" : "text-green-400"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    plan.comingSoon
                      ? handleNotifyMe(plan.name)
                      : (() => { setShowAuth(true); setIsLogin(false); })()
                  }
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.comingSoon
                      ? "bg-dark-700 hover:bg-dark-600 text-dark-200 border border-dark-600"
                      : plan.popular
                        ? "bg-brand-600 hover:bg-brand-500 text-white"
                        : "bg-dark-700 hover:bg-dark-600 text-dark-100"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center card bg-gradient-to-br from-brand-900/50 to-dark-800">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Bereit, deine Büroarbeit zu automatisieren?
          </h2>
          <p className="text-dark-400 mb-8 max-w-xl mx-auto">
            Starte jetzt mit 14 Tagen kostenlos. Keine Kreditkarte nötig.
          </p>
          <button
            onClick={() => { setShowAuth(true); setIsLogin(false); }}
            className="btn-primary text-lg px-8 py-4"
          >
            Jetzt kostenlos starten
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-dark-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">MeisterFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-dark-500">
            <span>© 2026 MeisterFlow</span>
            <a href="#" className="hover:text-dark-300">Datenschutz</a>
            <a href="#" className="hover:text-dark-300">Impressum</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md relative">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-dark-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {isLogin ? "Willkommen zurück" : "Konto erstellen"}
              </h2>
              <p className="text-dark-500 mt-1">
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
              <button type="submit" className="btn-primary w-full justify-center py-3">
                {isLogin ? "Anmelden" : "Konto erstellen"}
              </button>
            </form>
            <p className="text-center text-sm text-dark-500 mt-4">
              {isLogin ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-brand-400 hover:text-brand-300 font-medium"
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
