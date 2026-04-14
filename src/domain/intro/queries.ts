import { getCollection } from "astro:content";

export async function getAllBlogPosts() {
  const entries = await getCollection("intro");
  return entries.sort((a, b) => {
    const da = a.data.publishDate ? new Date(a.data.publishDate).getTime() : 0;
    const db = b.data.publishDate ? new Date(b.data.publishDate).getTime() : 0;
    return db - da;
  });
}

export async function getBlogPostBySlug(slug: string) {
  const entries = await getCollection("intro");
  return entries.find((e) => e.id === slug);
}

export async function getBlogTags() {
  const entries = await getCollection("intro");
  const set = new Set<string>();
  entries.forEach((e) => {
    const tags = (e.data as any).tags || [];
    tags.forEach((t: string) => set.add(t));
  });
  return Array.from(set);
}
