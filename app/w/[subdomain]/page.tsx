import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAnonServerClient } from "@/lib/supabase-admin";
import WebsiteRenderer from "@/components/website/WebsiteRenderer";
import type { HandwerkerWebsite } from "@/types/website";

export const dynamic = "force-dynamic";

async function loadSite(subdomain: string): Promise<HandwerkerWebsite | null> {
  try {
    const supabase = createAnonServerClient();
    const { data } = await supabase
      .from("handwerker_websites")
      .select("*")
      .eq("subdomain", subdomain.toLowerCase())
      .eq("status", "veroeffentlicht")
      .maybeSingle();
    return (data as HandwerkerWebsite) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { subdomain: string };
}): Promise<Metadata> {
  const site = await loadSite(params.subdomain);
  if (!site) return { title: "Website nicht gefunden" };
  return {
    title: site.seo_titel || site.firmenname || "Handwerksbetrieb",
    description: site.seo_beschreibung || site.hero_subheadline || undefined,
  };
}

export default async function PublicWebsitePage({
  params,
}: {
  params: { subdomain: string };
}) {
  const site = await loadSite(params.subdomain);
  if (!site) notFound();
  return <WebsiteRenderer site={site} />;
}
