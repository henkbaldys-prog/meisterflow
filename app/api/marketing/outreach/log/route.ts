import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { readOutreachLog } from "@/lib/marketing-studio";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const all = await readOutreachLog();
  const log = all.filter((e) => e.user_id === user.id).slice(0, 50);
  return NextResponse.json({ log });
}
