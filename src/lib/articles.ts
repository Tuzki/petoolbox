import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n/config';
import { getMessages } from './i18n/messages';

export type ArticleEntry = CollectionEntry<'articles'>;

export function articleLocale(article: ArticleEntry): Locale {
  const first = article.id.split('/')[0];
  if (first !== 'en' && first !== 'zh') throw new Error(`Article ${article.id} must live under en/ or zh/.`);
  return first;
}

export function articleSlug(article: ArticleEntry): string {
  return article.slug.replace(/^(en|zh)\//, '');
}

export async function getArticles(locale: Locale): Promise<ArticleEntry[]> {
  return (await getCollection('articles', ({ data }) => !(import.meta.env.PROD && data.draft)))
    .filter((article) => articleLocale(article) === locale)
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export function formatArticleDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    day: 'numeric'
  });
}

export function articleHref(article: ArticleEntry, locale: Locale): string {
  return `/${locale}/articles/${articleSlug(article)}/`;
}

export function articleCategoryLabel(category: string, locale: Locale): string {
  const categories = getMessages(locale).pages.articles.categories as Record<string, string>;
  const label = categories[category];
  if (!label) throw new Error(`Unknown article category ID: ${category}`);
  return label;
}
