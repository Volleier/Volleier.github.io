import { getCollection } from "astro:content";

export async function getAboutCards() {
  const entries = await getCollection("about");
  return entries.sort((a, b) => a.data.order - b.data.order);
}
