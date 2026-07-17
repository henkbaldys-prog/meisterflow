"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Lock } from "lucide-react";

const STORAGE_KEY = "marketing_access";
const ACCESS_CODE = "120222";

export function MarketingAccessGuard({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      setUnlocked(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      setUnlocked(false);
    }
    setReady(true);
  }, []);

  const unlock = (e?: FormEvent) => {
    e?.preventDefault();
    if (code.trim() === ACCESS_CODE) {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // ignore
      }
      setError(false);
      setUnlocked(true);
      return;
    }
    setError(true);
  };

  const resetAccess = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setUnlocked(false);
    setCode("");
    setError(false);
  };

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-dark-500 text-sm">
        Laden…
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950 px-4">
        <form
          onSubmit={unlock}
          className="w-full max-w-sm space-y-5 rounded-2xl border border-dark-800 bg-dark-900 p-6 shadow-xl"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/20 text-brand-300">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-white">Marketing-Studio</h1>
            <p className="mt-2 text-sm text-dark-400">
              Dieser Bereich ist geschützt. Bitte Code eingeben:
            </p>
          </div>

          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(false);
              }}
              placeholder="••••••"
              className="w-full rounded-xl border border-dark-700 bg-dark-950 px-4 py-4 text-center text-2xl tracking-[0.4em] text-white outline-none focus:border-brand-500"
              style={{ fontSize: "24px" }}
              aria-label="6-stelliger Zugangscode"
            />
            {error && (
              <p className="mt-2 text-center text-sm font-medium text-red-400">Falscher Code</p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full justify-center min-h-[52px] text-base"
          >
            Entsperren
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {children}
      <div className="pt-4">
        <button
          type="button"
          onClick={resetAccess}
          className="text-xs text-dark-600 hover:text-dark-400 underline-offset-2 hover:underline"
        >
          Zugang zurücksetzen
        </button>
      </div>
    </div>
  );
}
