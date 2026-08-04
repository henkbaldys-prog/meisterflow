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
    <div className="mb-2 flex items-start gap-3 rounded-card border border-warning/30 bg-warning/10 p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-amber-100">Firmenprofil unvollständig</p>
        <p className="mt-1 text-sm text-amber-100/80">
          Bitte echten Firmennamen eintragen (nicht „Mein Betrieb“) – für korrekte Angebote &amp; Rechnungen.
        </p>
        <Link href="/einstellungen" className="btn-primary mt-3 min-h-[48px] !bg-warning !text-dark-950 hover:!bg-amber-400">
          Zum Firmenprofil
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="btn-ghost min-h-[44px] min-w-[44px] shrink-0 text-amber-200"
        aria-label="Banner schließen"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
