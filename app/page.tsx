"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Mic, Camera, FileText, ArrowRight, Menu, X } from "lucide-react";
import MeisterFlowLogo from "@/components/MeisterFlowLogo";
import toast from "react-hot-toast";

export default function LandingPage() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) {
    router.push("/dashboard");
    return null;
  }

  const openSignup = () => {
    setIsLogin(false);
    setShowAuth(true);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isLogin ? "Eingeloggt" : "Konto erstellt – willkommen!");
    if (isLogin) router.push("/dashboard");
    else router.push("/dashboard");
  };

  return (
    <div className="app-shell min-h-screen">
      <nav className="border-b border-white/[0.06] bg-dark-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <MeisterFlowLogo size="sm" priority />
          <div className="hidden items-center gap-3 sm:flex">
            <button type="button" className="btn-ghost" onClick={() => { setIsLogin(true); setShowAuth(true); }}>
              Login
            </button>
            <button type="button" className="btn-primary" onClick={openSignup}>
              Kostenlos starten
            </button>
          </div>
          <button type="button" className="sm:hidden btn-ghost min-h-[48px] min-w-[48px]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileOpen && (
          <div className="space-y-2 border-t border-white/[0.06] px-4 py-4 sm:hidden">
            <button type="button" className="btn-ghost w-full justify-center" onClick={() => { setIsLogin(true); setShowAuth(true); }}>Login</button>
            <button type="button" className="btn-primary w-full justify-center" onClick={openSignup}>Kostenlos starten</button>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-dark-50 sm:text-5xl">
          Angebote und Rechnungen für Handwerker. Per Sprache. In 2 Minuten.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-dark-400 sm:text-lg">
          Kostenlos. Kein Abo. Kein Stripe. Einfach anmelden und loslegen.
        </p>

        <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
          {[
            { icon: Mic, title: "Sprache → Angebot", desc: "Diktieren, fertig" },
            { icon: Camera, title: "Foto → Angebot", desc: "Baustelle scannen" },
            { icon: FileText, title: "GoBD-Rechnung", desc: "In 1 Klick" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card text-center">
              <div className="mx-auto icon-box">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 font-semibold text-dark-50">{title}</p>
              <p className="mt-1 text-sm text-dark-500">{desc}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={openSignup}
          className="btn-primary mx-auto mt-12 min-h-[56px] px-8 text-base"
        >
          Jetzt kostenlos starten
          <ArrowRight className="h-5 w-5" />
        </button>
        <p className="mt-4 text-sm text-dark-500">
          Für die ersten 50 Handwerker komplett gratis.
        </p>
      </main>

      <footer className="border-t border-white/[0.06] px-4 py-10 text-center text-sm text-dark-500">
        <p>© {new Date().getFullYear()} MeisterFlow</p>
        <p className="mt-2">
          <a href="mailto:kontakt@meisterflow.de" className="hover:text-white">Kontakt</a>
          {" · "}
          <a href="#" className="hover:text-white">Impressum</a>
        </p>
      </footer>

      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowAuth(false)}>
              <X className="h-4 w-4" />
            </button>
            <div className="mb-6 text-center">
              <div className="mb-3 flex justify-center">
                <MeisterFlowLogo size="md" />
              </div>
              <h2 className="text-xl font-bold text-dark-50">
                {isLogin ? "Anmelden" : "Kostenlos starten"}
              </h2>
              <p className="mt-1 text-sm text-dark-500">
                {isLogin ? "Willkommen zurück" : "Nur E-Mail und Passwort. Keine Kreditkarte."}
              </p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="label">E-Mail</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="label">Passwort</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>
              <button type="submit" disabled={busy} className="btn-primary w-full min-h-[52px] justify-center">
                {busy ? "…" : isLogin ? "Anmelden" : "Jetzt starten"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-dark-500">
              {isLogin ? "Noch kein Konto?" : "Schon registriert?"}{" "}
              <button
                type="button"
                className="font-medium text-brand-400"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Registrieren" : "Login"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
