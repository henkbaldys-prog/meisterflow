/**
 * Vollständiger Fake-Daten-Test für Sprache + Foto → Angebot
 * Run: npx tsx scripts/test-fake-angebot-flow.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const FAKE_SPRACHE_TRANSCRIPT =
  "Neues Badezimmer, 18 Quadratmeter Fliesen, alte Fliesen entfernen, neue Toilette montieren";

const FAKE_KUNDEN = [
  { id: "k1", firma: "Müller Bau GmbH", ansprechpartner: "Hans Müller" },
  { id: "k2", firma: "Schmidt Sanitär", ansprechpartner: "Anna Schmidt" },
];

async function main() {
  loadEnv();

  const { extractSpracheAngebot, analyzeBaustellenFoto } = await import("../lib/openai");
  const { spracheToInitialData, fotoToInitialData, findKundeIdByName } = await import(
    "../lib/angebot-initial"
  );

  let passed = 0;
  let failed = 0;

  const check = (name: string, ok: boolean, detail?: string) => {
    if (ok) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}${detail ? ` – ${detail}` : ""}`);
      failed++;
    }
  };

  console.log("═══════════════════════════════════════════");
  console.log("MINDFLOW FAKE-DATEN TEST – Sprache + Foto");
  console.log("═══════════════════════════════════════════\n");

  // ── 1. Sprache: KI-Extraktion ──
  console.log("── 1. SPRACHE (Fake-Transkript) ──");
  console.log(`Input: "${FAKE_SPRACHE_TRANSCRIPT}"\n`);

  const spracheData = await extractSpracheAngebot(FAKE_SPRACHE_TRANSCRIPT);
  console.log("KI-Extraktion:", JSON.stringify(spracheData, null, 2), "\n");

  check("Leistung: Badezimmer/Fliesen", /badezimmer|fliesen/i.test(spracheData.leistung || ""));
  check("Material: Fliesen", /fliesen/i.test(spracheData.material || ""));
  check("Material: Toilette", /toilette/i.test(spracheData.material || ""));
  check("Menge: 18", /18/.test(spracheData.menge || ""));
  check("Menge: Einheit", /m²|quadratmeter|qm/i.test(spracheData.menge || ""));
  check("Zusammenfassung vorhanden", (spracheData.zusammenfassung?.length || 0) > 20);

  // ── 2. Sprache → AngebotForm Mapping ──
  console.log("\n── 2. SPRACHE → AngebotForm (Vorausfüllung) ──");
  const spracheInitial = spracheToInitialData(spracheData);
  console.log("initialData:", JSON.stringify(spracheInitial, null, 2), "\n");

  check("Betreff gesetzt", (spracheInitial.betreff?.length || 0) > 5);
  check("Beschreibung enthält Leistung", /leistung/i.test(spracheInitial.beschreibung || ""));
  check("Beschreibung enthält Material", /material/i.test(spracheInitial.beschreibung || ""));
  check("Beschreibung enthält Menge", /menge/i.test(spracheInitial.beschreibung || ""));

  const fakeKundeSprache = { ...spracheData, kunde_name: "Müller Bau" };
  const kundeId = findKundeIdByName(FAKE_KUNDEN, fakeKundeSprache.kunde_name);
  check("Kunde-Matching: Müller Bau", kundeId === "k1");

  // ── 3. Foto: KI-Analyse ──
  console.log("\n── 3. FOTO (Beispiel-Badezimmerbild) ──");
  const imgRes = await fetch(
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=256&q=60",
  );
  const base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
  const fotoData = await analyzeBaustellenFoto(base64, "image/jpeg");
  console.log("KI-Analyse:", JSON.stringify(fotoData, null, 2), "\n");

  check("Beschreibung plausibel", (fotoData.beschreibung?.length || 0) > 30);
  check("Arbeiten-Liste", Array.isArray(fotoData.arbeiten) && fotoData.arbeiten.length >= 2);
  check("Materialien-Liste", Array.isArray(fotoData.materialien) && fotoData.materialien.length >= 1);
  check("Aufwand angegeben", (fotoData.geschätzter_aufwand?.length || 0) > 3);
  check("⚠️ KI-Hinweis", /schätzung|prüfen/i.test(fotoData.hinweis || ""));
  check("Angebotsvorschlag", (fotoData.angebotsvorschlag?.length || 0) > 30);

  // ── 4. Foto → AngebotForm Mapping ──
  console.log("\n── 4. FOTO → AngebotForm (Vorausfüllung) ──");
  const fotoInitial = fotoToInitialData(fotoData);
  console.log("initialData:", JSON.stringify(fotoInitial, null, 2).slice(0, 500) + "...\n");

  check("Betreff aus Arbeiten", (fotoInitial.betreff?.length || 0) > 5);
  check("Beschreibung enthält Angebotsvorschlag", (fotoInitial.beschreibung?.length || 0) > 50);
  check("Beschreibung enthält Arbeiten", /arbeiten/i.test(fotoInitial.beschreibung || ""));
  check("Beschreibung enthält Hinweis", /schätzung|prüfen/i.test(fotoInitial.beschreibung || ""));

  // ── 5. API Auth (ohne Login) ──
  console.log("\n── 5. API-SICHERHEIT (ohne Login) ──");
  const base = process.env.TEST_BASE_URL || "http://localhost:3000";

  const sprache401 = await fetch(`${base}/api/ki/sprache`, { method: "POST" });
  const foto401 = await fetch(`${base}/api/ki/foto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: "fake" }),
  });

  check("/api/ki/sprache → 401 ohne Auth", sprache401.status === 401);
  check("/api/ki/foto → 401 ohne Auth", foto401.status === 401);

  // ── 6. API Fehlerfälle ──
  console.log("\n── 6. FEHLERFÄLLE (Fake-Requests) ──");
  const emptyAudio = await fetch(`${base}/api/ki/sprache`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: "" }),
  });
  check("Leeres Audio → nicht 200", emptyAudio.status === 401 || emptyAudio.status === 400);

  const emptyFoto = await fetch(`${base}/api/ki/foto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  check("Kein Bild → nicht 200", emptyFoto.status === 401 || emptyFoto.status === 400);

  // ── Ergebnis ──
  console.log("\n═══════════════════════════════════════════");
  console.log(`ERGEBNIS: ${passed} bestanden, ${failed} fehlgeschlagen`);
  console.log("═══════════════════════════════════════════");

  if (failed > 0) process.exit(1);

  console.log("\n📋 Was du in der App siehst (nach Login):");
  console.log("• Angebote-Seite: 2 Karten (🎙️ Sprache / 📷 Foto)");
  console.log("• Sprache-Modal: Mikrofon → Ergebnis → „Als Angebot übernehmen“");
  console.log("• Foto-Modal: Upload → KI-Analyse → gelbe Warnung → Übernehmen");
  console.log("• AngebotForm: Betreff + Beschreibung vorausgefüllt, Kunde + Preis manuell");
}

main().catch((e) => {
  console.error("\n💥 TEST ABGEBROCHEN:", e.message);
  process.exit(1);
});
