"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import {
  Users,
  FileText,
  Receipt,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalKunden: 0,
    totalAngebote: 0,
    totalRechnungen: 0,
    offeneRechnungen: 0,
    umsatzDieserMonat: 0,
    angeboteDieserMonat: 0,
  });
  const [recentAngebote, setRecentAngebote] = useState<any[]>([]);
  const [recentRechnungen, setRecentRechnungen] = useState<any[]>([]);
  const [upcomingTermine, setUpcomingTermine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userId = user.id;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Kunden
    const { count: kundenCount } = await supabase
      .from("kunden")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Angebote
    const { count: angeboteCount } = await supabase
      .from("angebote")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: angeboteThisMonth } = await supabase
      .from("angebote")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    // Rechnungen
    const { count: rechnungenCount } = await supabase
      .from("rechnungen")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: offeneRechnungenCount } = await supabase
      .from("rechnungen")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["versendet", "ueberfaellig"]);

    const { data: umsatzData } = await supabase
      .from("rechnungen")
      .select("brutto")
      .eq("user_id", userId)
      .eq("status", "bezahlt")
      .gte("created_at", startOfMonth.toISOString());

    const umsatz = umsatzData?.reduce((sum, r) => sum + (r.brutto || 0), 0) || 0;

    // Recent items
    const { data: recentAngeboteData } = await supabase
      .from("angebote")
      .select("*, kunden(firma, ansprechpartner)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentRechnungenData } = await supabase
      .from("rechnungen")
      .select("*, kunden(firma, ansprechpartner)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const today = new Date().toISOString().split("T")[0];
    const { data: termineData } = await supabase
      .from("termine")
      .select("*, kunden(firma, ansprechpartner)")
      .eq("user_id", userId)
      .gte("datum", today)
      .order("datum", { ascending: true })
      .limit(5);

    setStats({
      totalKunden: kundenCount || 0,
      totalAngebote: angeboteCount || 0,
      totalRechnungen: rechnungenCount || 0,
      offeneRechnungen: offeneRechnungenCount || 0,
      umsatzDieserMonat: umsatz,
      angeboteDieserMonat: angeboteThisMonth || 0,
    });

    setRecentAngebote(recentAngeboteData || []);
    setRecentRechnungen(recentRechnungenData || []);
    setUpcomingTermine(termineData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-500 mt-1">Übersicht deines Handwerksbetriebs</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Kunden"
          value={stats.totalKunden.toString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Angebote"
          value={stats.totalAngebote.toString()}
          subtitle={`${stats.angeboteDieserMonat} diesen Monat`}
          icon={FileText}
          color="brand"
        />
        <StatCard
          title="Rechnungen"
          value={stats.totalRechnungen.toString()}
          icon={Receipt}
          color="green"
        />
        <StatCard
          title="Offene Rechnungen"
          value={stats.offeneRechnungen.toString()}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title="Umsatz (Monat)"
          value={formatCurrency(stats.umsatzDieserMonat)}
          icon={TrendingUp}
          color="purple"
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Konversionsrate"
          value={stats.totalAngebote > 0 
            ? `${Math.round((recentAngebote.filter((a: any) => a.status === "angenommen").length / stats.totalAngebote) * 100)}%` 
            : "0%"}
          icon={ArrowUpRight}
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Angebote */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Neueste Angebote</h3>
            <Link href="/angebote" className="text-sm text-brand-400 hover:text-brand-300">
              Alle anzeigen →
            </Link>
          </div>
          <div className="space-y-3">
            {recentAngebote.length === 0 ? (
              <p className="text-dark-500 text-sm">Noch keine Angebote erstellt.</p>
            ) : (
              recentAngebote.map((angebot: any) => (
                <div
                  key={angebot.id}
                  className="flex items-center justify-between p-3 bg-dark-900 rounded-lg hover:bg-dark-800 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{angebot.betreff}</p>
                    <p className="text-xs text-dark-500">
                      {angebot.kunden?.firma || "Unbekannt"} • {formatDate(angebot.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-white">{formatCurrency(angebot.brutto)}</span>
                    <StatusBadge status={angebot.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Rechnungen */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Neueste Rechnungen</h3>
            <Link href="/rechnungen" className="text-sm text-brand-400 hover:text-brand-300">
              Alle anzeigen →
            </Link>
          </div>
          <div className="space-y-3">
            {recentRechnungen.length === 0 ? (
              <p className="text-dark-500 text-sm">Noch keine Rechnungen erstellt.</p>
            ) : (
              recentRechnungen.map((rechnung: any) => (
                <div
                  key={rechnung.id}
                  className="flex items-center justify-between p-3 bg-dark-900 rounded-lg hover:bg-dark-800 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{rechnung.betreff}</p>
                    <p className="text-xs text-dark-500">
                      {rechnung.kunden?.firma || "Unbekannt"} • Fällig: {formatDate(rechnung.faellig_am)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-white">{formatCurrency(rechnung.brutto)}</span>
                    <StatusBadge status={rechnung.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Termine */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Kommende Termine</h3>
          <Link href="/termine" className="text-sm text-brand-400 hover:text-brand-300">
            Alle anzeigen →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingTermine.length === 0 ? (
            <p className="text-dark-500 text-sm col-span-full">Keine anstehenden Termine.</p>
          ) : (
            upcomingTermine.map((termin: any) => (
              <div key={termin.id} className="p-4 bg-dark-900 rounded-lg border border-dark-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{termin.titel}</p>
                    <p className="text-xs text-dark-500 mt-1">
                      {formatDate(termin.datum)} • {termin.uhrzeit_von} – {termin.uhrzeit_bis}
                    </p>
                    {termin.kunden && (
                      <p className="text-xs text-brand-400 mt-1">
                        {termin.kunden.firma}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={termin.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
