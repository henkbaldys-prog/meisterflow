import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

async function getUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { data, error } = await supabase
    .from("mitarbeiter")
    .select("*")
    .eq("user_id", user.id)
    .eq("aktiv", true)
    .order("name");

  if (error) {
    return NextResponse.json({ mitarbeiter: [], needsMigration: true });
  }
  return NextResponse.json({ mitarbeiter: data || [] });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name erforderlich" }, { status: 400 });

  const { data, error } = await supabase
    .from("mitarbeiter")
    .insert({
      user_id: user.id,
      name,
      rolle: String(body.rolle || "Geselle").trim() || "Geselle",
      telefon: body.telefon || null,
      baustelle: body.baustelle || null,
      heutige_stunden: Number(body.heutige_stunden) || 0,
      offene_auftraege: Number(body.offene_auftraege) || 0,
      aktiv: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, needsMigration: true }, { status: 500 });
  }
  return NextResponse.json({ mitarbeiter: data });
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of [
    "name",
    "rolle",
    "telefon",
    "baustelle",
    "heutige_stunden",
    "offene_auftraege",
    "aktiv",
  ]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("mitarbeiter")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mitarbeiter: data });
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const { error } = await supabase
    .from("mitarbeiter")
    .update({ aktiv: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
