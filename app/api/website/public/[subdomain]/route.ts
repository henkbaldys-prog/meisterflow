import { NextRequest, NextResponse } from "next/server";
import { createAnonServerClient } from "@/lib/supabase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { subdomain: string } },
) {
  const subdomain = String(params.subdomain || "")
    .toLowerCase()
    .trim();

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain fehlt" }, { status: 400 });
  }

  try {
    const supabase = createAnonServerClient();
    const { data, error } = await supabase
      .from("handwerker_websites")
      .select("*")
      .eq("subdomain", subdomain)
      .eq("status", "veroeffentlicht")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Website nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ website: data });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler" },
      { status: 500 },
    );
  }
}
