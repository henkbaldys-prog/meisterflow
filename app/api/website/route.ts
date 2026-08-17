import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugifySubdomain, type WebsiteTemplate } from "@/types/website";

async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { data, error } = await supabase
    .from("handwerker_websites")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message, needsMigration: true, website: null },
      { status: 200 },
    );
  }

  return NextResponse.json({ website: data });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const template = (body.template || "modern") as WebsiteTemplate;
    const farbe = String(body.farbe_primary || "#6366F1");

    // Profil-Snapshot
    const { data: profil } = await supabase
      .from("firmenprofile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const firmenname = profil?.firmenname || body.firmenname || "Mein Betrieb";
    let subdomain = slugifySubdomain(body.subdomain || firmenname);
    if (!subdomain) subdomain = `betrieb-${user.id.slice(0, 8)}`;

    const payload = {
      user_id: user.id,
      subdomain,
      status: "entwurf" as const,
      template,
      farbe_primary: farbe,
      seo_titel: body.seo_titel || `${firmenname} – Handwerk`,
      seo_beschreibung: body.seo_beschreibung || null,
      impressum: body.impressum || null,
      datenschutz: body.datenschutz || null,
      hero_headline: body.hero_headline || null,
      hero_subheadline: body.hero_subheadline || null,
      ueber_uns: body.ueber_uns || null,
      leistungen: Array.isArray(body.leistungen)
        ? body.leistungen
        : profil?.gewerke?.length
          ? profil.gewerke
          : [],
      firmenname,
      telefon: profil?.telefon || body.telefon || null,
      email: profil?.email || body.email || null,
      ort: profil?.ort || body.ort || null,
      logo_url: profil?.logo_url || null,
      slogan: body.slogan || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("handwerker_websites")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Subdomain bereits vergeben – bitte anderen Namen wählen" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message, needsMigration: true }, { status: 500 });
    }

    return NextResponse.json({ website: data });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    const allowed = [
      "template",
      "farbe_primary",
      "seo_titel",
      "seo_beschreibung",
      "impressum",
      "datenschutz",
      "hero_headline",
      "hero_subheadline",
      "ueber_uns",
      "leistungen",
      "slogan",
      "status",
      "subdomain",
      "firmenname",
      "telefon",
      "email",
      "ort",
      "logo_url",
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = key === "subdomain" ? slugifySubdomain(String(body[key])) : body[key];
      }
    }

    if (body.publish === true) {
      updates.status = "veroeffentlicht";
      // Sync profil snapshot on publish
      const { data: profil } = await supabase
        .from("firmenprofile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profil) {
        updates.firmenname = profil.firmenname;
        updates.telefon = profil.telefon;
        updates.email = profil.email;
        updates.ort = profil.ort;
        updates.logo_url = profil.logo_url;
        if (!body.leistungen && profil.gewerke?.length) {
          // keep existing leistungen unless empty
        }
      }
    }

    if (body.unpublish === true) {
      updates.status = "entwurf";
    }

    const { data, error } = await supabase
      .from("handwerker_websites")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Subdomain bereits vergeben" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ website: data });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler" },
      { status: 500 },
    );
  }
}
