"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

type Props = {
  subdomain: string;
  primary: string;
  compact?: boolean;
};

export default function WebsiteKontaktForm({ subdomain, primary, compact }: Props) {
  const [name, setName] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/website/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, name, telefon, email, nachricht }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Senden fehlgeschlagen");
      setDone(true);
      setName("");
      setTelefon("");
      setEmail("");
      setNachricht("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{ borderColor: `${primary}33`, background: `${primary}0d` }}
      >
        <p className="font-semibold" style={{ color: primary }}>
          Danke! Wir melden uns schnellstmöglich.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-3 text-sm underline opacity-70"
        >
          Weitere Nachricht senden
        </button>
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:ring-2";

  return (
    <form onSubmit={submit} className={compact ? "space-y-3" : "space-y-4"}>
      <input
        className={field}
        style={{ ["--tw-ring-color" as string]: primary }}
        placeholder="Ihr Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className={compact ? "space-y-3" : "grid gap-4 sm:grid-cols-2"}>
        <input
          className={field}
          placeholder="Telefon"
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
          inputMode="tel"
        />
        <input
          className={field}
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <textarea
        className={`${field} min-h-[120px] resize-y`}
        placeholder="Ihre Nachricht *"
        value={nachricht}
        onChange={(e) => setNachricht(e.target.value)}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
        style={{ background: primary }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Anfrage senden
      </button>
    </form>
  );
}
