"use client";

import { usePathname, useRouter } from "next/navigation";
import { Mic } from "lucide-react";

/** Mobile FAB – immer sichtbar für Neues Angebot */
export default function AngebotFAB() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname?.startsWith("/marketing") || pathname?.startsWith("/einstellungen/website")) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.push("/dashboard")}
      className="fixed bottom-5 right-5 z-40 flex h-[56px] min-w-[56px] items-center justify-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-semibold text-white shadow-soft md:hidden active:scale-[0.98]"
      aria-label="Neues Angebot"
    >
      <Mic className="h-5 w-5" />
      Angebot
    </button>
  );
}
