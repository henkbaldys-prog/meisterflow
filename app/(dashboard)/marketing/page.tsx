"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Video,
  Mail,
  Loader2,
  Copy,
  Check,
  Download,
  Send,
  Sparkles,
  AlertTriangle,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  videoPackageToUploadText,
  type OutreachDraft,
  type VideoPackage,
} from "@/lib/marketing-studio-shared";
import { MarketingAccessGuard } from "@/components/MarketingAccessGuard";
import { LeadsRecherchePanel } from "@/components/LeadsRecherchePanel";

type Tab = "video" | "outreach" | "leads";

const GEWERKE = ["Elektriker", "Sanitär", "Maler", "Dachdecker", "Tischler", "SHK", "Allgemein Handwerk"];
const LAENGEN = [15, 30, 60];
const PLATTFORMEN = ["Reels", "TikTok", "Shorts"];

export default function MarketingPage() {
  const [tab, setTab] = useState<Tab>("video");

  return (
    <MarketingAccessGuard>
      <div>
        <h1 className="text-3xl font-bold text-white">Marketing-KI</h1>
        <p className="mt-1 text-dark-500">
          Videos, Outreach und Lead-Recherche – du prüfst und sendest manuell.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-dark-800 bg-dark-900 p-1">
        <TabButton active={tab === "video"} onClick={() => setTab("video")} icon={Video} label="Video" />
        <TabButton
          active={tab === "outreach"}
          onClick={() => setTab("outreach")}
          icon={Mail}
          label="Outreach"
        />
        <TabButton
          active={tab === "leads"}
          onClick={() => setTab("leads")}
          icon={Search}
          label="Leads finden"
        />
      </div>

      {tab === "video" && <VideoTab />}
      {tab === "outreach" && <OutreachTab />}
      {tab === "leads" && <LeadsRecherchePanel />}
    </MarketingAccessGuard>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Video;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium min-h-[48px] transition-colors ${
        active ? "bg-brand-600/20 text-brand-300" : "text-dark-400 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function VideoTab() {
  const [gewerk, setGewerk] = useState("Elektriker");
  const [thema, setThema] = useState("Angebote nachfassen");
  const [laenge, setLaenge] = useState(30);
  const [plattform, setPlattform] = useState("Reels");
  const [loading, setLoading] = useState(false);
  const [pkg, setPkg] = useState<VideoPackage | null>(null);
  const [history, setHistory] = useState<VideoPackage[]>([]);
  const [copied, setCopied] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/video/generate");
      const data = await res.json();
      if (res.ok) setHistory(data.packages || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          gewerk,
          thema,
          laenge_sek: laenge,
          plattform,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      setPkg(data.package);
      toast.success("Video-Paket fertig – nur noch hochladen");
      await loadHistory();
    } catch (e: any) {
      toast.error(e.message || "Generierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async (p: VideoPackage) => {
    await navigator.clipboard.writeText(videoPackageToUploadText(p));
    setCopied(true);
    toast.success("Gesamtes Paket kopiert");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = (p: VideoPackage) => {
    const blob = new Blob([videoPackageToUploadText(p)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.id}-upload.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <p className="text-sm font-medium text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-400" />
          Kurzvideo erzeugen
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Gewerk</label>
            <select className="input w-full" value={gewerk} onChange={(e) => setGewerk(e.target.value)}>
              {GEWERKE.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Plattform</label>
            <select
              className="input w-full"
              value={plattform}
              onChange={(e) => setPlattform(e.target.value)}
            >
              {PLATTFORMEN.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Thema / Hook</label>
            <input
              className="input w-full"
              value={thema}
              onChange={(e) => setThema(e.target.value)}
              placeholder="z.B. Rechnungen mahnen ohne Stress"
            />
          </div>
          <div>
            <label className="label">Länge</label>
            <div className="flex gap-2">
              {LAENGEN.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLaenge(n)}
                  className={`flex-1 rounded-lg py-2 text-sm min-h-[44px] ${
                    laenge === n
                      ? "bg-brand-600/30 text-brand-200"
                      : "bg-dark-900 text-dark-400"
                  }`}
                >
                  {n}s
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="btn-primary w-full justify-center min-h-[48px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> KI schreibt…
            </>
          ) : (
            <>
              <Video className="h-4 w-4" /> Video-Paket erzeugen
            </>
          )}
        </button>
        <p className="text-xs text-dark-500">
          Kein Auto-Upload zu TikTok/Instagram (braucht dein Konto). Du bekommst Shotlist, Text,
          Captions & CapCut-Tipp – dann nur noch hochladen.
        </p>
      </div>

      {pkg && <VideoPackageCard pkg={pkg} onCopy={copyAll} onDownload={downloadTxt} copied={copied} />}

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-dark-300">Zuletzt erzeugt</h3>
          {history.slice(0, 5).map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setPkg(h)}
              className="card w-full text-left hover:border-brand-500/40"
            >
              <p className="text-sm font-medium text-white">
                {h.gewerk} · {h.thema}
              </p>
              <p className="text-xs text-dark-500">
                {h.plattform} · {h.laenge_sek}s ·{" "}
                {new Date(h.created_at).toLocaleString("de-DE")}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoPackageCard({
  pkg,
  onCopy,
  onDownload,
  copied,
}: {
  pkg: VideoPackage;
  onCopy: (p: VideoPackage) => void;
  onDownload: (p: VideoPackage) => void;
  copied: boolean;
}) {
  return (
    <div className="card space-y-4 border-brand-500/25">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCopy(pkg)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600/20 px-3 py-2 text-sm text-brand-200"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Alles kopieren
        </button>
        <button
          type="button"
          onClick={() => onDownload(pkg)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-dark-800 px-3 py-2 text-sm text-dark-200"
        >
          <Download className="h-4 w-4" />
          .txt Download
        </button>
      </div>

      <Block title="Hook" text={pkg.hook} />
      <div>
        <p className="text-xs font-semibold uppercase text-dark-500 mb-2">Szenen</p>
        <ul className="space-y-2">
          {pkg.szenen.map((s, i) => (
            <li key={i} className="rounded-lg bg-dark-900 p-3 text-sm">
              <span className="text-brand-400">{s.zeit}</span> · {s.bild}
              <p className="mt-1 text-dark-400">On-Screen: {s.text_on_screen}</p>
            </li>
          ))}
        </ul>
      </div>
      <Block title="Sprechertext" text={pkg.sprechertext} />
      <Block title="Post-Caption" text={pkg.caption_post} />
      <Block title="Hashtags" text={pkg.hashtags.join(" ")} />
      <div>
        <p className="text-xs font-semibold uppercase text-dark-500 mb-2">Upload-Checkliste</p>
        <ul className="space-y-1 text-sm text-dark-300">
          {pkg.checklist.map((c, i) => (
            <li key={i}>☐ {c}</li>
          ))}
        </ul>
      </div>
      <Block title="CapCut-Tipp" text={pkg.capcut_tipp} />
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-dark-500 mb-1">{title}</p>
      <p className="whitespace-pre-wrap text-sm text-dark-200">{text}</p>
    </div>
  );
}

function OutreachTab() {
  const [leads, setLeads] = useState(
    "Max Müller;Müller Elektro;Berlin;max@example.com\nAnna Schmidt;Schmidt Sanitär;Hamburg;anna@example.com",
  );
  const [ton, setTon] = useState("freundlich");
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<OutreachDraft[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [log, setLog] = useState<{ at: string; email: string; subject: string }[]>([]);

  const loadLog = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/outreach/log");
      const data = await res.json();
      if (res.ok) setLog(data.log || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  const draft = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ leads, ton }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      setDrafts(data.drafts || []);
      toast.success(`${data.drafts?.length || 0} Entwürfe bereit`);
    } catch (e: any) {
      toast.error(e.message || "Fehler");
    } finally {
      setLoading(false);
    }
  };

  const sendOne = async (d: OutreachDraft) => {
    if (!confirm(`Mail wirklich an ${d.email} senden?\n\nNur senden, wenn du den Empfänger kontaktieren darfst.`)) {
      return;
    }
    setSending(d.email);
    try {
      const res = await fetch("/api/marketing/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          to: d.email,
          subject: d.subject,
          body: d.body,
          confirmed: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Versand fehlgeschlagen");
      toast.success(`Gesendet an ${d.email}`);
      await loadLog();
    } catch (e: any) {
      toast.error(e.message || "Fehler");
    } finally {
      setSending(null);
    }
  };

  const updateDraft = (email: string, patch: Partial<OutreachDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.email === email ? { ...d, ...patch } : d)));
  };

  return (
    <div className="space-y-6">
      <div className="card border-amber-500/30 bg-amber-500/5">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <div className="text-sm text-amber-100/90">
            <p className="font-medium">Kein Auto-Scraping</p>
            <p className="mt-1 text-amber-200/70">
              Du fügst E-Mails selbst ein (eigene Liste / Impressum). Jede Mail braucht deinen
              Klick. Nur an Empfänger senden, die du kontaktieren darfst.
            </p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Leads (eine Zeile: Name;Firma;Stadt;Email)</label>
          <textarea
            className="input min-h-[120px] w-full resize-y font-mono text-sm"
            value={leads}
            onChange={(e) => setLeads(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Ton</label>
          <select className="input w-full max-w-xs" value={ton} onChange={(e) => setTon(e.target.value)}>
            <option value="freundlich">Freundlich</option>
            <option value="kurz">Kurz &amp; direkt</option>
            <option value="professionell">Professionell</option>
          </select>
        </div>
        <button
          type="button"
          onClick={draft}
          disabled={loading}
          className="btn-primary w-full justify-center min-h-[48px] sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Entwürfe…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Mails entwerfen
            </>
          )}
        </button>
      </div>

      {drafts.map((d) => (
        <div key={d.email} className="card space-y-3">
          <p className="text-sm font-medium text-white">
            {d.name || "—"} · {d.firma || "—"} · {d.stadt || "—"}
          </p>
          <p className="text-xs text-dark-500">{d.email}</p>
          <div>
            <label className="label">Betreff</label>
            <input
              className="input w-full"
              value={d.subject}
              onChange={(e) => updateDraft(d.email, { subject: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Text</label>
            <textarea
              className="input min-h-[140px] w-full resize-y"
              value={d.body}
              onChange={(e) => updateDraft(d.email, { body: e.target.value })}
            />
          </div>
          <button
            type="button"
            onClick={() => sendOne(d)}
            disabled={sending === d.email}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-600/25 px-4 py-2 text-sm font-medium text-brand-200 hover:bg-brand-600/35 disabled:opacity-50"
          >
            {sending === d.email ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Diese Mail senden
          </button>
        </div>
      ))}

      {log.length > 0 && (
        <div className="card">
          <p className="mb-3 text-sm font-semibold text-dark-300">Gesendet (Log)</p>
          <ul className="space-y-2 text-xs text-dark-500">
            {log.map((e, i) => (
              <li key={i}>
                {new Date(e.at).toLocaleString("de-DE")} · {e.email} · {e.subject}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
