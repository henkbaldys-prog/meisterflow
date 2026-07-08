# 🚀 MeisterFlow - Komplette Setup-Anleitung

## Übersicht

| Komponente | Kosten/Monat | Limits |
|-----------|-------------|--------|
| **Supabase Free** | 0 € | 500 MB DB, 50K MAU, pausiert nach 7 Tagen Inaktivität |
| **Supabase Pro** | ~25 € | 8 GB DB, 100K MAU, nie pausierend |
| **Vercel Free** | 0 € | 100 GB Bandwidth, 100K Function Invocations |
| **Vercel Pro** | 20 € | 1 TB Bandwidth, 10M Edge Requests |
| **OpenAI GPT-4o-mini** | ~0,15 $ pro 1M Input-Tokens | Sehr günstig für Textgenerierung |
| **GESAMT (Start)** | **0 €** | |
| **GESAMT (Produktion)** | **~45 €** | |

---

## SCHRITTE

### SCHWERPUNKT 1: Supabase-Projekt erstellen (15 Minuten)

1. Gehe zu [supabase.com](https://supabase.com) und melde dich an
2. Klicke auf "New Project"
3. Wähle einen Namen: `meinflow-prod`
4. Wähle Region: **Frankfurt (eu-central-1)** ← Wichtig für DSGVO!
5. Warte bis das Projekt bereit ist (ca. 2 Minuten)

### SCHWERPUNKT 2: Datenbank einrichten (10 Minuten)

1. Im Supabase Dashboard → SQL Editor
2. Öffne die Datei `supabase/schema.sql` aus diesem Projekt
3. Kopiere den gesamten Inhalt
4. Füge ihn in den SQL Editor ein
5. Klicke "Run"
6. Du solltest "Success. No rows returned" sehen

### SCHWERPUNKT 3: API-Keys holen (5 Minuten)

1. Im Supabase Dashboard → Project Settings → API
2. Kopiere:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### SCHWERPUNKT 4: OpenAI API-Key (5 Minuten)

1. Gehe zu [platform.openai.com](https://platform.openai.com)
2. Melde dich an (oder erstelle Account)
3. Gehe zu "API Keys"
4. Erstelle einen neuen Key
5. Kopiere ihn → `OPENAI_API_KEY`
6. Lade dein Konto mit 5-10 $ auf (reicht für Monate)

### SCHWERPUNKT 5: .env.local erstellen (2 Minuten)

```bash
cp .env.example .env.local
```

Fülle die Werte ein:
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh12345678.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
OPENAI_API_KEY=sk-proj-...
```

### SCHWERPUNKT 6: Projekt starten (5 Minuten)

```bash
# Im Projektordner
cd meinflow

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

---

## NÄCHSTE SCHRITTE (DEINE AUFGABEN)

### Tag 3: Beta-Tester finden

**Wo findest du Handwerker?**

| Kanal | Taktik | Erwartung |
|-------|--------|-----------|
| **Facebook-Gruppen** | Suche "Handwerker [Deine Stadt]", "Elektriker Deutschland", "Maler & Lackierer". Schreibe NICHT direkt rein. Kommentiere erst hilfreich auf 5 Posts, dann erwähne dein Tool. | 3-5 Tester |
| **Gewerbeamt** | Schreibe eine freundliche E-Mail an das Gewerbeamt deiner Stadt: "Ich entwickle Software für Handwerker und suche Betriebe für einen kostenlosen Beta-Test. Können Sie mir eine Liste der Neugewerbeanmeldungen der letzten 6 Monate zusenden?" (Kostet oft 20-50 €) | 10-15 Kontakte |
| **Handwerkskammer** | Rufe die örtliche Handwerkskammer an. Frage nach einem Kontakt zu Jungunternehmern oder Betrieben, die digitalisieren wollen. | 2-3 Tester |
| **Persönlich** | Fahre zu 5 Handwerker-Betrieben in deiner Stadt. Sag: "Ich bin 17 und baue Software für Handwerker. Könnte ich Sie 10 Minuten fragen, was Sie am meisten nervt?" | 1-2 Tester |
| **Instagram/TikTok** | Drehe ein 30-Sekunden-Video: "So spart ein Elektriker 20 Stunden Büroarbeit pro Woche" → Zeige dein Dashboard | 2-3 Tester |

**Das perfekte Beta-Tester-Gespräch:**

```
"Hallo, ich bin [Name] und baue eine Software, die Handwerkern hilft, 
Büroarbeit zu automatisieren. Ich suche 5 Handwerker, die sie 14 Tage 
kostenlos testen und mir sagen, was gut und was schlecht ist. 
Interessiert?"
```

**Was du von Beta-Testern brauchst:**
- [ ] 3-5 echte Kunden in die Datenbank eingeben
- [ ] 1-2 echte Angebote erstellen (mit KI)
- [ ] 1 Rechnung aus Angebot generieren
- [ ] Feedback-Formular ausfüllen (5 Fragen)

### Tag 4-7: PDF-Export, E-Mail-Versand, Polish

**PDF-Export:**
```bash
npm install jspdf html2canvas
```

Erstelle eine `components/PDFExport.tsx`:
- Nutze jsPDF für einfache PDFs
- Oder html2canvas für pixelgenaue Reproduktion

**E-Mail-Versand:**
- Nutze SendGrid (Free Tier: 100 E-Mails/Tag)
- Erstelle `app/api/email/route.ts`
- Versende Angebote/Rechnungen als PDF-Anhang

**Polish-Liste:**
- [ ] Lade-Animationen überall
- [ ] Fehlermeldungen benutzerfreundlich
- [ ] Mobile-Ansicht testen (Chrome DevTools)
- [ ] Dark Mode konsistent
- [ ] Formular-Validierung verbessern

### Tag 8-14: Landing Page verfeinern, erste Kunden gewinnen

**Landing Page Verbesserungen:**
- [ ] Video-Demo aufnehmen (Loom, kostenlos)
- [ ] 3 Kunden-Testimonials (von Beta-Testern)
- [ ] Preise klar kommunizieren
- [ ] FAQ-Sektion hinzufügen
- [ ] Impressum & Datenschutzerklärung

**Erste zahlende Kunden:**

| Taktik | Budget | Erwartung |
|--------|--------|-----------|
| Facebook-Gruppen (organisch) | 0 € | 5-10 Kunden |
| Google Ads ("Handwerker Software") | 200 €/Monat | 10-15 Kunden |
| Direktansprache (Telefon) | 0 € | 5-10 Kunden |
| Empfehlungsprogramm (1 Monat gratis) | 0 € | 5-10 Kunden |

**Der Verkaufs-Call (15 Minuten):**

```
1. "Was nervt Sie am meisten an der Büroarbeit?" (2 Min)
2. "Wie viele Stunden verbringen Sie pro Woche damit?" (1 Min)
3. "Was würde es Ihnen wert sein, das zu automatisieren?" (2 Min)
4. Demo zeigen (5 Min)
5. "Wollen Sie es 14 Tage kostenlos testen?" (2 Min)
6. Preis nennen: "Danach kostet es 149 €/Monat. Das sind ca. 5 € pro Tag." (2 Min)
7. Zusage einholen (1 Min)
```

---

## KOSTENÜBERSICHT (REALISTISCH)

### Monat 1-3 (MVP & Beta)
| Posten | Kosten |
|--------|--------|
| Supabase Free | 0 € |
| Vercel Free | 0 € |
| OpenAI API (~500 Anfragen) | ~5 € |
| Domain (Namecheap) | ~10 €/Jahr |
| **GESAMT** | **~5 €/Monat** |

### Monat 4-6 (Produktion)
| Posten | Kosten |
|--------|--------|
| Supabase Pro | 25 € |
| Vercel Pro | 20 € |
| OpenAI API (~2.000 Anfragen) | ~15 € |
| SendGrid (E-Mails) | 0 € (Free) |
| **GESAMT** | **~60 €/Monat** |

### Break-Even
- Bei **1 zahlendem Kunden à 149 €/Monat** = Profit ab Monat 4
- Bei **5 zahlenden Kunden** = 745 €/Monat Umsatz, ~685 € Profit

---

## WICHTIGE HINWEISE

### DSGVO-Konformität
- ✅ Supabase Frankfurt (EU-Region)
- ✅ Row Level Security (jeder sieht nur seine Daten)
- ✅ SSL-Verschlüsselung (Standard bei Supabase)
- ⚠️ Datenschutzerklärung nötig (Generator: [e-recht24.de](https://e-recht24.de))
- ⚠️ Einwilligung für E-Mail-Versand nötig

### Steuern (als 17-Jähriger)
- Du kannst ein Gewerbe anmelden (mit elterlicher Zustimmung)
- Kleinunternehmer-Regelung: Bis 22.000 €/Jahr umsatzsteuerfrei
- Buchhaltung: Einfach mit DATEV-Export aus MeisterFlow ;)

### Support
- KI-Chatbot für 80% der Fragen
- E-Mail-Support für komplexe Fragen
- Community-Forum (Discord/Slack)

---

## FEHLER, DIE DU VERMEIDEN SOLLTEST

1. ❌ Nicht warten, bis alles perfekt ist → MVP raus, Feedback einholen
2. ❌ Zu viele Features auf einmal → Fokus auf Angebote + Rechnungen
3. ❌ Keine Preise nennen → Sei transparent, 149 € ist fair
4. ❌ Nur online verkaufen → Handwerker kaufen persönlich
5. ❌ Technische Sprache → "Automatisierung" statt "Workflow-Engine"

---

## ERfolgs-METRIKEN

| Metrik | Ziel Monat 1 | Ziel Monat 3 | Ziel Monat 6 |
|--------|-------------|-------------|-------------|
| Beta-Tester | 5 | - | - |
| Kunden | 0 | 10 | 50 |
| MRR | 0 € | 1.490 € | 7.450 € |
| Churn Rate | - | <10% | <5% |
| NPS | - | >50 | >70 |

---

**Du hast jetzt alles, was du brauchst. Fang an.**
