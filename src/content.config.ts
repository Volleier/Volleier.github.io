import { z, defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const introCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/intro" }),
  schema: z.object({
    title: z.string(),
    publishDate: z.date(),
    description: z.string(),
    author: z.string().default("Volleier"),
    tags: z.array(z.string()).optional(),
  }),
});

const wikiCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/wiki" }),
  schema: z.object({
    title: z.string(),
    lastUpdated: z.date(),
    description: z.string().optional(),
    category: z.string(),
  }),
});

export const collections = {
  intro: introCollection,
  wiki: wikiCollection,
};
