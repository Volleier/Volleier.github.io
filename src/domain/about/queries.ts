import { getCollection } from "astro:content";

export async function getAboutCards() {
  return await getCollection("about");
}
