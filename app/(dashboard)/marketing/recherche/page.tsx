"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketingAccessGuard } from "@/components/MarketingAccessGuard";
import { LeadsRecherchePanel } from "@/components/LeadsRecherchePanel";

export default function RecherchePage() {
  return (
    <MarketingAccessGuard>
      <div>
        <Link
          href="/marketing"
          className="mb-2 inline-flex items-center gap-1 text-sm text-dark-500 hover:text-brand-400"
        >
          <ArrowLeft className="h-4 w-4" /> Marketing
        </Link>
        <h1 className="text-3xl font-bold text-white">Lead-Recherche</h1>
        <p className="mt-1 text-dark-500">
          Nur Research – Texte kopieren und manuell senden. Kein Auto-Versand.
        </p>
      </div>
      <LeadsRecherchePanel />
    </MarketingAccessGuard>
  );
}
