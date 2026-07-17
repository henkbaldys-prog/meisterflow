import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { normalizePublicEmail, normalizeUrl } from "@/types/research";

async function getUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Liste eigener Research-Leads */
export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { data, error } = await supabase
    .from("research_leads")
    .select("*")
    .neq("status", "nicht_interessant")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ leads: [], error: error.message, needsMigration: true });
  }

  return NextResponse.json({ leads: data || [] });
}

/** Manuell hinzufügen oder CSV-Zeilen */
export async function POST(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();

    // CSV bulk: { csv: "Firma;Gewerk;Stadt;Webseite;Email;Telefon\n..." }
    if (body.csv) {
      const rows = String(body.csv)
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter(Boolean)
        .slice(0, 50);

      const inserts = rows.flatMap((line: string) => {
        const p = line.split(";").map((x) => x.trim());
        if (p.length < 3) return [];
        if (/^firma$/i.test(p[0])) return [];
        return [
          {
            user_id: user.id,
            firma: p[0],
            gewerk: p[1] || body.gewerk || "Handwerk",
            stadt: p[2] || body.stadt || "",
            webseite: normalizeUrl(p[3]),
            email: normalizePublicEmail(p[4]),
            telefon: p[5] || null,
            status: "nicht_kontaktiert" as const,
            quelle: "CSV-Upload",
            updated_at: new Date().toISOString(),
          },
        ];
      });

      if (inserts.length === 0) {
        return NextResponse.json({ error: "Keine gültigen CSV-Zeilen" }, { status: 400 });
      }

      const { data, error } = await supabase.from("research_leads").insert(inserts).select();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ leads: data });
    }

    const firma = String(body.firma || "").trim();
    const gewerk = String(body.gewerk || "").trim();
    const stadt = String(body.stadt || "").trim();
    if (!firma || !gewerk || !stadt) {
      return NextResponse.json({ error: "firma, gewerk, stadt erforderlich" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("research_leads")
      .insert([
        {
          user_id: user.id,
          firma,
          gewerk,
          stadt,
          webseite: normalizeUrl(body.webseite),
          email: normalizePublicEmail(body.email),
          telefon: body.telefon ? String(body.telefon).trim() : null,
          status: "nicht_kontaktiert",
          text_kurz: body.text_kurz || null,
          text_mittel: body.text_mittel || null,
          text_lang: body.text_lang || null,
          quelle: "Manuell",
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lead: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}

/** Status / Texte aktualisieren */
export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "id erforderlich" }, { status: 400 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status) patch.status = body.status;
    if (body.text_kurz !== undefined) patch.text_kurz = body.text_kurz;
    if (body.text_mittel !== undefined) patch.text_mittel = body.text_mittel;
    if (body.text_lang !== undefined) patch.text_lang = body.text_lang;

    const { data, error } = await supabase
      .from("research_leads")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lead: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}

/** Soft-delete = nicht_interessant oder hard delete */
export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id erforderlich" }, { status: 400 });

  const { error } = await supabase
    .from("research_leads")
    .update({ status: "nicht_interessant", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
