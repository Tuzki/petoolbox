import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    articleId: z.string().min(1),
    description: z.string().min(1),
    category: z.string().min(1),
    primaryTool: z.string().nullable(),
    relatedTools: z.array(z.string()),
    publishedAt: z.date(),
    updatedAt: z.date(),
    draft: z.boolean()
  })
});

export const collections = { articles };
