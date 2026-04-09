import { getCollection } from "astro:content";

export async function getAllWikiPages() {
  const entries = await getCollection("wiki");
  return entries.sort((a, b) => {
    const da = a.data.lastUpdated ? new Date(a.data.lastUpdated).getTime() : 0;
    const db = b.data.lastUpdated ? new Date(b.data.lastUpdated).getTime() : 0;
    return db - da;
  });
}

export async function getWikiPageBySlug(slug: string) {
  const entries = await getCollection("wiki");
  return entries.find((e) => e.id === slug);
}

export async function getWikiByCategory() {
  const entries = await getCollection("wiki");
  const map = new Map<string, any[]>();
  entries.forEach((e) => {
    const cat = (e.data as any).category || "uncategorized";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(e);
  });
  return Object.fromEntries(map);
}
