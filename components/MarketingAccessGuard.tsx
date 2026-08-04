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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="spinner" aria-label="Laden" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="modal-backdrop !fixed">
        <form onSubmit={unlock} className="modal-panel max-w-sm space-y-5">
          <div className="flex flex-col items-center text-center">
            <div className="icon-box mb-3 h-12 w-12">
              <Lock className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl font-bold text-dark-50">Marketing-Studio</h1>
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
              className="input text-center text-2xl tracking-[0.4em]"
              style={{ fontSize: "24px" }}
              aria-label="6-stelliger Zugangscode"
            />
            {error && (
              <p className="mt-2 text-center text-sm font-medium text-danger">Falscher Code</p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full min-h-[52px] justify-center text-base">
            Entsperren
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="section-gap page-enter">
      {children}
      <div className="pt-2">
        <button type="button" onClick={resetAccess} className="btn-ghost text-xs text-dark-600">
          Zugang zurücksetzen
        </button>
      </div>
    </div>
  );
}
