import Link from "next/link";
import { notFound } from "next/navigation";
import MeisterFlowLogo from "@/components/MeisterFlowLogo";
import { getBlogPost, listBlogPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const posts = await listBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function RatgeberArtikelPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPost(params.slug);
  if (!post) notFound();

  const paragraphs = post.body.split(/\n\n+/);

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <header className="border-b border-dark-800 px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/ratgeber">
            <MeisterFlowLogo size="sm" />
          </Link>
          <Link href="/ratgeber" className="text-sm text-dark-400 hover:text-white">
            ← Alle Artikel
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs text-dark-500">
          {new Date(post.published_at).toLocaleDateString("de-DE")}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight">{post.title}</h1>
        <p className="mt-4 text-dark-400">{post.excerpt}</p>

        <div className="mt-8 space-y-4 text-dark-200 leading-relaxed">
          {paragraphs.map((block, i) => {
            const lines = block.split("\n");
            return (
              <div key={i}>
                {lines.map((line, j) => {
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return (
                      <p key={j} className="font-semibold text-white">
                        {line.replace(/\*\*/g, "")}
                      </p>
                    );
                  }
                  if (/^\d+\./.test(line)) {
                    return (
                      <p key={j} className="pl-1">
                        {line}
                      </p>
                    );
                  }
                  return <p key={j}>{line}</p>;
                })}
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-xl border border-brand-500/30 bg-brand-500/10 p-5 text-center">
          <p className="text-sm text-brand-200">
            Angebote tracken, nachfassen und mahnen – mit MeisterFlow.
          </p>
          <Link
            href="/?ref=ratgeber"
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Kostenlos starten
          </Link>
        </div>
      </article>
    </div>
  );
}
