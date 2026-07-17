import { NextResponse } from "next/server";
import {
  daysSinceLatestPost,
  listBlogPosts,
  slugify,
  writeBlogPost,
  type BlogPost,
} from "@/lib/blog";

const TOPICS = [
  "Angebot per WhatsApp senden als Handwerker",
  "Kunden nachfassen ohne aufdringlich zu wirken",
  "Liquidität im Handwerk: offene Rechnungen im Griff",
  "Zeit sparen bei Angeboten und Rechnungen",
  "Warum Handwerker Aufträge verlieren – und wie man nachfasst",
];

/**
 * Stellt sicher, dass mindestens wöchentlich ein Ratgeber-Artikel existiert.
 * Öffentlich aufrufbar (für Autopilot beim Besuch von /ratgeber).
 */
export async function POST() {
  try {
    const posts = await listBlogPosts();
    const age = daysSinceLatestPost(posts);

    if (age < 7) {
      return NextResponse.json({
        ok: true,
        generated: false,
        reason: `Letzter Artikel vor ${age} Tag(en)`,
        count: posts.length,
      });
    }

    const topic = TOPICS[posts.length % TOPICS.length];
    let post: BlogPost | null = null;

    if (process.env.OPENAI_API_KEY) {
      post = await generateWithOpenAI(topic);
    }

    if (!post) {
      post = fallbackPost(topic, posts.length);
    }

    // Unique slug
    let slug = post.slug;
    let i = 2;
    while (posts.some((p) => p.slug === slug)) {
      slug = `${post.slug}-${i}`;
      i += 1;
    }
    post.slug = slug;

    await writeBlogPost(post);

    return NextResponse.json({ ok: true, generated: true, slug: post.slug });
  } catch (e: any) {
    console.error("blog ensure:", e);
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}

async function generateWithOpenAI(topic: string): Promise<BlogPost | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 900,
        messages: [
          {
            role: "user",
            content: `Du schreibst einen kurzen SEO-Ratgeber für deutsche Handwerker (MeisterFlow-Blog).
Thema: ${topic}

Antworte NUR als JSON:
{
  "title": "max 70 Zeichen",
  "excerpt": "1-2 Sätze",
  "body": "Markdown-Text, 3 kurze Abschnitte, praxisnah, kein Marketing-Geschwafel. Erwähne MeisterFlow höchstens einmal am Ende dezent."
}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const json = JSON.parse(fenced ? fenced[1] : raw);
    const title = String(json.title || topic);
    return {
      slug: slugify(title),
      title,
      excerpt: String(json.excerpt || ""),
      body: String(json.body || ""),
      published_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function fallbackPost(topic: string, index: number): BlogPost {
  const title = topic.charAt(0).toUpperCase() + topic.slice(1);
  return {
    slug: slugify(`${title}-${index}`),
    title,
    excerpt: "Praxis-Tipp für Handwerksbetriebe: weniger Bürochaos, mehr Aufträge.",
    body: `${title}\n\nIm Alltag bleibt oft keine Zeit für Nachfassen und Mahnungen. Ein fester Rhythmus hilft:\n\n1. Angebot senden und Öffnung tracken\n2. Nach drei Tagen nachfassen\n3. Offene Rechnungen früh erinnern\n\nSo bleiben Aufträge und Zahlungen im Fluss – ohne Extra-Software-Chaos.\n\nMehr Automatisierung: MeisterFlow.`,
    published_at: new Date().toISOString(),
  };
}
