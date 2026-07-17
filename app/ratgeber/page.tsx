"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MeisterFlowLogo from "@/components/MeisterFlowLogo";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  published_at: string;
};

export default function RatgeberPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [genNote, setGenNote] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // Zuerst vorhandene Artikel zeigen (schnell)
        const res = await fetch("/api/marketing/blog/list");
        const data = await res.json();
        setPosts(data.posts || []);
        setLoading(false);

        // Autopilot im Hintergrund (kann KI dauern)
        const ensure = await fetch("/api/marketing/blog/ensure", { method: "POST" });
        const ensureData = await ensure.json();
        if (ensureData.generated) {
          setGenNote("Neuer Artikel automatisch veröffentlicht.");
          const res2 = await fetch("/api/marketing/blog/list");
          const data2 = await res2.json();
          setPosts(data2.posts || []);
        }
      } catch {
        setPosts([]);
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <header className="border-b border-dark-800 px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/">
            <MeisterFlowLogo size="sm" />
          </Link>
          <Link href="/" className="text-sm text-brand-400 hover:text-brand-300">
            App starten →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Ratgeber für Handwerker</h1>
        <p className="mt-2 text-dark-400">
          Tipps zu Angeboten, Nachfassen und Mahnungen – automatisch aktualisiert.
        </p>
        {genNote && <p className="mt-3 text-sm text-brand-300">{genNote}</p>}

        {loading ? (
          <p className="mt-10 text-dark-500">Lade Artikel…</p>
        ) : posts.length === 0 ? (
          <p className="mt-10 text-dark-500">Noch keine Artikel.</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/ratgeber/${p.slug}`}
                  className="card block transition-colors hover:border-brand-500/40"
                >
                  <p className="text-xs text-dark-500">
                    {new Date(p.published_at).toLocaleDateString("de-DE")}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">{p.title}</h2>
                  <p className="mt-2 text-sm text-dark-400">{p.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
