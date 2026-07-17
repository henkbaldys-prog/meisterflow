import { NextResponse } from "next/server";
import { listBlogPosts } from "@/lib/blog";

export async function GET() {
  const posts = await listBlogPosts();
  return NextResponse.json({
    posts: posts.map(({ slug, title, excerpt, published_at }) => ({
      slug,
      title,
      excerpt,
      published_at,
    })),
  });
}
