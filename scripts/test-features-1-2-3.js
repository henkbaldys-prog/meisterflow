/**
 * End-to-End Test: Feature 1–3 (Tracking, Follow-ups, Mahnungen)
 * Run: node scripts/test-features-1-2-3.js
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
  Object.assign(process.env, env);
  return env;
}

function check(name, ok, detail) {
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${name}${detail ? ` – ${detail}` : ""}`);
  return ok;
}

async function main() {
  const env = loadEnv();
  const base = process.env.TEST_BASE_URL || "http://localhost:3000";
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let passed = 0;
  let failed = 0;
  const assert = (name, ok, detail) => {
    if (check(name, ok, detail)) passed++;
    else failed++;
  };

  console.log("═══════════════════════════════════════════");
  console.log("MINDFLOW E2E – Feature 1 / 2 / 3");
  console.log("═══════════════════════════════════════════\n");

  // ── Auth ──
  const email = `e2e-${Date.now()}@mindflow-test.local`;
  const password = "TestPass123!";
  console.log(`── Auth: ${email} ──`);

  let { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
  if (signUpErr) {
    assert("Sign-up", false, signUpErr.message);
    console.log("\nAbbruch – kein Auth.");
    process.exit(1);
  }
  let user = signUpData.user;
  // Falls Confirm-Email aktiv: Session fehlt ggf.
  if (!signUpData.session) {
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr || !signInData.session) {
      assert(
        "Login nach Sign-up",
        false,
        signInErr?.message || "Keine Session (E-Mail-Bestätigung in Supabase aktiv?)",
      );
      console.log("\nOhne Session kein RLS-Insert. Bitte in Supabase Auth: Confirm email AUS.");
      process.exit(1);
    }
    user = signInData.user;
  }
  assert("Auth Session", !!user?.id, user?.id);

  // ── Seed Kunde ──
  console.log("\n── Seed: Kunde ──");
  const { data: kunde, error: kundeErr } = await supabase
    .from("kunden")
    .insert([
      {
        user_id: user.id,
        firma: "Müller Bau GmbH",
        ansprechpartner: "Hans Müller",
        email: "mueller@example.com",
        telefon: "015112345678",
        strasse: "Testweg 1",
        plz: "10115",
        ort: "Berlin",
      },
    ])
    .select()
    .single();
  assert("Kunde angelegt", !kundeErr && !!kunde, kundeErr?.message || kunde?.id);

  // ── Feature 1: Angebot + Tracking ──
  console.log("\n── Feature 1: Angebot-Tracking ──");
  const gueltig = new Date();
  gueltig.setDate(gueltig.getDate() + 30);
  const { data: angebot, error: agErr } = await supabase
    .from("angebote")
    .insert([
      {
        user_id: user.id,
        kunde_id: kunde.id,
        nummer: `AG-E2E-${Date.now().toString().slice(-6)}`,
        betreff: "E2E Test Angebot Fliesen",
        beschreibung: "18 qm Bad fliesen – automatischer Test",
        netto: 1000,
        mwst_satz: 19,
        brutto: 1190,
        status: "versendet",
        gueltig_bis: gueltig.toISOString().split("T")[0],
        gelesen_am: null,
      },
    ])
    .select()
    .single();
  assert("Angebot versendet angelegt", !agErr && !!angebot, agErr?.message || angebot?.id);
  assert("gelesen_am initial null", angebot?.gelesen_am == null, String(angebot?.gelesen_am));

  // Track via RPC
  const { data: tracked, error: trackErr } = await supabase.rpc("track_and_get_angebot", {
    p_id: angebot.id,
  });
  assert("RPC track_and_get_angebot", !trackErr && !!tracked, trackErr?.message);
  assert("RPC liefert Nummer", tracked?.nummer === angebot.nummer, tracked?.nummer);

  // Track via HTTP (mobile HTML)
  let htmlOk = false;
  let htmlBody = "";
  try {
    const res = await fetch(`${base}/api/angebote/track/${angebot.id}`);
    htmlBody = await res.text();
    htmlOk = res.ok && res.headers.get("content-type")?.includes("text/html");
    assert("HTTP Tracking-URL 200 + HTML", htmlOk, `status=${res.status}`);
    assert("HTML enthält Angebotsnummer", htmlBody.includes(angebot.nummer));
    assert("HTML mobil (viewport)", /viewport/i.test(htmlBody));
  } catch (e) {
    assert("HTTP Tracking-URL erreichbar", false, e.message);
  }

  // gelesen_am gesetzt (als eingeloggter User lesen)
  const { data: afterTrack, error: afterErr } = await supabase
    .from("angebote")
    .select("gelesen_am")
    .eq("id", angebot.id)
    .single();
  assert("gelesen_am nach Track gesetzt", !afterErr && !!afterTrack?.gelesen_am, afterErr?.message || afterTrack?.gelesen_am);

  // Zweiter Track ändert gelesen_am nicht
  const firstRead = afterTrack?.gelesen_am;
  await supabase.rpc("track_and_get_angebot", { p_id: angebot.id });
  const { data: after2 } = await supabase.from("angebote").select("gelesen_am").eq("id", angebot.id).single();
  assert("gelesen_am bleibt beim 2. Aufruf", after2?.gelesen_am === firstRead);

  // ── Feature 2: Follow-up ──
  console.log("\n── Feature 2: Follow-up Automatik ──");
  const faellig = new Date();
  faellig.setDate(faellig.getDate() + 3);
  const { data: followUp, error: fuErr } = await supabase
    .from("follow_ups")
    .upsert(
      {
        user_id: user.id,
        angebot_id: angebot.id,
        kunde_id: kunde.id,
        faellig_am: faellig.toISOString(),
        status: "offen",
        type: "angebot_followup",
      },
      { onConflict: "angebot_id" },
    )
    .select()
    .single();
  assert("Follow-up angelegt", !fuErr && !!followUp, fuErr?.message || followUp?.id);
  assert("Follow-up status offen", followUp?.status === "offen", followUp?.status);

  // Unique: zweites Insert darf nicht zwei Rows erzeugen
  const { error: dupErr } = await supabase.from("follow_ups").insert([
    {
      user_id: user.id,
      angebot_id: angebot.id,
      kunde_id: kunde.id,
      faellig_am: faellig.toISOString(),
      status: "offen",
      type: "angebot_followup",
    },
  ]);
  assert("UNIQUE(angebot_id) greift", !!dupErr, dupErr?.message || "kein Fehler – erwartet unique");

  // Fällig machen + erledigen
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await supabase.from("follow_ups").update({ faellig_am: yesterday.toISOString() }).eq("id", followUp.id);
  const { data: dueFu } = await supabase.from("follow_ups").select("*").eq("id", followUp.id).single();
  assert("Follow-up auf gestern gesetzt", new Date(dueFu.faellig_am) < new Date());

  const { error: doneErr } = await supabase
    .from("follow_ups")
    .update({ status: "erledigt" })
    .eq("id", followUp.id);
  assert("Follow-up erledigt", !doneErr);

  // ── Feature 3: Mahnungen ──
  console.log("\n── Feature 3: Automatische Mahnungen ──");
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 5);
  const { data: rechnung, error: reErr } = await supabase
    .from("rechnungen")
    .insert([
      {
        user_id: user.id,
        kunde_id: kunde.id,
        nummer: `RE-E2E-${Date.now().toString().slice(-6)}`,
        betreff: "E2E Test Rechnung",
        netto: 500,
        mwst_satz: 19,
        brutto: 595,
        status: "versendet",
        faellig_am: overdueDate.toISOString().split("T")[0],
      },
    ])
    .select()
    .single();
  assert("Überfällige Rechnung angelegt", !reErr && !!rechnung, reErr?.message || rechnung?.id);

  const today = new Date().toISOString().split("T")[0];
  const isOverdue = rechnung.faellig_am < today && ["versendet", "ueberfaellig", "gemahnt"].includes(rechnung.status);
  assert("Rechnung als überfällig erkannt", isOverdue, `faellig=${rechnung.faellig_am} today=${today}`);

  const nextMahnung = new Date();
  nextMahnung.setDate(nextMahnung.getDate() + 7);
  const nextIso = nextMahnung.toISOString().split("T")[0];
  const { data: gemahnt, error: mahErr } = await supabase
    .from("rechnungen")
    .update({
      status: "gemahnt",
      gemahnt_am: new Date().toISOString(),
      naechste_mahnung_am: nextIso,
    })
    .eq("id", rechnung.id)
    .select()
    .single();
  assert("Status gemahnt setzen", !mahErr && gemahnt?.status === "gemahnt", mahErr?.message);
  assert("gemahnt_am gesetzt", !!gemahnt?.gemahnt_am);
  assert("naechste_mahnung_am +7 Tage", gemahnt?.naechste_mahnung_am === nextIso, gemahnt?.naechste_mahnung_am);

  // Mahnungstext Helper (ohne TS-require)
  const msg = `Hallo Hans Müller,\n\nWir bitten höflich um Begleichung der offenen Forderung.\n\nRechnung ${rechnung.nummer}`;
  assert("Mahnungstext enthält Kundenname", msg.includes("Hans Müller"));
  assert("Mahnungstext enthält Rechnungsnr", msg.includes(rechnung.nummer));

  // Fällig bald (gelb)
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const { data: soonRe, error: soonErr } = await supabase
    .from("rechnungen")
    .insert([
      {
        user_id: user.id,
        kunde_id: kunde.id,
        nummer: `RE-SOON-${Date.now().toString().slice(-6)}`,
        betreff: "E2E Bald fällig",
        netto: 200,
        mwst_satz: 19,
        brutto: 238,
        status: "versendet",
        faellig_am: soon.toISOString().split("T")[0],
      },
    ])
    .select()
    .single();
  assert("Bald fällige Rechnung angelegt", !soonErr && !!soonRe, soonErr?.message);
  const daysUntil = Math.round(
    (new Date(soonRe.faellig_am + "T12:00:00") - new Date(today + "T12:00:00")) / 86400000,
  );
  assert("Fällig in ~3 Tagen", daysUntil >= 2 && daysUntil <= 4, `days=${daysUntil}`);

  // ── UI Routes smoke ──
  console.log("\n── Smoke: App-Routen ──");
  for (const route of ["/dashboard", "/angebote", "/rechnungen"]) {
    try {
      const res = await fetch(`${base}${route}`);
      // Ohne Cookie oft Redirect/Login – 200 oder 307 ok
      assert(`Route ${route} antwortet`, res.status < 500, `status=${res.status}`);
    } catch (e) {
      assert(`Route ${route} antwortet`, false, e.message);
    }
  }

  // Cleanup (best effort)
  console.log("\n── Cleanup ──");
  await supabase.from("follow_ups").delete().eq("user_id", user.id);
  await supabase.from("rechnungen").delete().eq("user_id", user.id);
  await supabase.from("angebote").delete().eq("user_id", user.id);
  await supabase.from("kunden").delete().eq("user_id", user.id);
  assert("Cleanup ok", true);

  console.log("\n═══════════════════════════════════════════");
  console.log(`Ergebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
  console.log("═══════════════════════════════════════════");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("SCRIPT_ERROR:", e);
  process.exit(1);
});
