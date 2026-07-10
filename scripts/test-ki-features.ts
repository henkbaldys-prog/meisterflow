/**
 * Integration test for Sprache/Foto KI helpers (run: npx tsx scripts/test-ki-features.ts)
 */
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  console.warn("No .env.local found");
}

async function main() {
  const { extractSpracheAngebot, analyzeBaustellenFoto } = await import("../lib/openai");

  console.log("=== TEST 1: Sprache-Extraktion (simuliertes Transkript) ===");
  const transcript =
    "Neues Badezimmer, 18 Quadratmeter Fliesen, alte Fliesen entfernen, neue Toilette montieren";
  const sprache = await extractSpracheAngebot(transcript);
  console.log(JSON.stringify(sprache, null, 2));

  const checks = [
    ["leistung enthält Fliesen/Badezimmer", /fliesen|badezimmer/i.test(sprache.leistung || "")],
    ["material enthält Fliesen", /fliesen/i.test(sprache.material || "")],
    ["material enthält Toilette", /toilette/i.test(sprache.material || "")],
    ["menge enthält 18", /18/.test(sprache.menge || "")],
    ["menge hat Einheit", /m²|quadratmeter|qm/i.test(sprache.menge || "")],
  ];

  for (const [name, ok] of checks) {
    console.log(ok ? `✅ ${name}` : `❌ ${name}`);
  }

  console.log("\n=== TEST 2: Foto-Analyse (Beispielbild) ===");
  let fotoOk = false;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const imgUrl =
        "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=256&q=60";
      const res = await fetch(imgUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      const base64 = buf.toString("base64");
      const foto = await analyzeBaustellenFoto(base64, "image/jpeg");
      console.log(JSON.stringify(foto, null, 2));

      const fotoChecks = [
        ["beschreibung nicht leer", (foto.beschreibung?.length || 0) > 10],
        ["arbeiten Array", Array.isArray(foto.arbeiten) && foto.arbeiten.length > 0],
        ["materialien Array", Array.isArray(foto.materialien) && foto.materialien.length > 0],
        ["hinweis vorhanden", /schätzung|prüfen/i.test(foto.hinweis || "")],
        ["angebotsvorschlag nicht leer", (foto.angebotsvorschlag?.length || 0) > 20],
      ];

      for (const [name, ok] of fotoChecks) {
        console.log(ok ? `✅ ${name}` : `❌ ${name}`);
      }
      fotoOk = fotoChecks.every(([, ok]) => ok);
      break;
    } catch (e: any) {
      console.warn(`Versuch ${attempt} fehlgeschlagen:`, e.message);
      if (attempt === 2) throw e;
    }
  }

  if (!fotoOk) process.exit(1);
}

main().catch((e) => {
  console.error("TEST FAILED:", e.message);
  process.exit(1);
});
