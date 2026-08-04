"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import type { WebsiteAnfrage } from "@/types/website";
import toast from "react-hot-toast";

export default function WebsiteAnfragenCard() {
  const [anfragen, setAnfragen] = useState<WebsiteAnfrage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/website/anfragen");
      const data = await res.json();
      setAnfragen(data.anfragen || []);
    } catch {
      setAnfragen([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = anfragen.filter((a) => !a.gelesen);
  if (loading || unread.length === 0) return null;

  const markRead = async (id: string) => {
    const res = await fetch("/api/website/anfragen", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, gelesen: true }),
    });
    if (!res.ok) {
      toast.error("Konnte nicht markieren");
      return;
    }
    setAnfragen((prev) => prev.map((a) => (a.id === id ? { ...a, gelesen: true } : a)));
    toast.success("Als gelesen markiert");
  };

  return (
    <div className="card border-accent/20 bg-accent/5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="icon-box !bg-accent/10 !text-accent">
            <Globe className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-semibold text-dark-50">Website-Anfragen</h3>
            <p className="text-sm text-dark-400">
              {unread.length} neue {unread.length === 1 ? "Anfrage" : "Anfragen"} über deine
              Webseite
            </p>
          </div>
        </div>
        <Link href="/einstellungen/website" className="btn-ghost text-xs">
          Website
        </Link>
      </div>
      <ul className="space-y-3">
        {unread.slice(0, 5).map((a) => (
          <li
            key={a.id}
            className="rounded-btn border border-white/[0.06] bg-dark-950/40 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-dark-50">{a.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-dark-400">{a.nachricht}</p>
                <p className="mt-1 text-[11px] text-dark-500">
                  {[a.telefon, a.email].filter(Boolean).join(" · ") || "Keine Kontaktdaten"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => markRead(a.id)}
                className="btn-ghost min-h-[44px] shrink-0"
                title="Als gelesen"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {loading && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-dark-500" />
        </div>
      )}
    </div>
  );
}
