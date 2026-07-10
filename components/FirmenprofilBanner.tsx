"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

export default function FirmenprofilBanner() {
  const { profilUnvollstaendig, loading } = useData();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  if (loading || !profilUnvollstaendig || dismissed || pathname === "/einstellungen") {
    return null;
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-amber-200">Bitte vervollständigen Sie Ihr Firmenprofil</p>
        <p className="mt-1 text-sm text-amber-200/80">
          Tragen Sie Ihren Firmennamen und Kontaktdaten ein, damit Angebote und Rechnungen korrekt aussehen.
        </p>
        <Link
          href="/einstellungen"
          className="mt-3 inline-flex min-h-[48px] items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-dark-950 transition-colors hover:bg-amber-400"
        >
          Zum Firmenprofil
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-lg p-2 text-amber-300 hover:bg-amber-500/20 hover:text-amber-100"
        aria-label="Banner schließen"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
