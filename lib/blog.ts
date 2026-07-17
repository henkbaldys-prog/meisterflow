import { promises as fs } from "fs";
import path from "path";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  published_at: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export async function ensureBlogDir() {
  await fs.mkdir(BLOG_DIR, { recursive: true });
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  await ensureBlogDir();
  const files = (await fs.readdir(BLOG_DIR)).filter((f) => f.endsWith(".json"));
  const posts: BlogPost[] = [];
  for (const file of files) {
    try {
      const raw = await fs.readFile(path.join(BLOG_DIR, file), "utf8");
      posts.push(JSON.parse(raw) as BlogPost);
    } catch {
      // skip broken
    }
  }
  return posts.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await listBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export async function writeBlogPost(post: BlogPost): Promise<void> {
  await ensureBlogDir();
  const file = path.join(BLOG_DIR, `${post.slug}.json`);
  await fs.writeFile(file, JSON.stringify(post, null, 2), "utf8");
}

export function daysSinceLatestPost(posts: BlogPost[], now = new Date()): number {
  if (posts.length === 0) return 999;
  const latest = new Date(posts[0].published_at).getTime();
  return Math.floor((now.getTime() - latest) / (1000 * 60 * 60 * 24));
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
