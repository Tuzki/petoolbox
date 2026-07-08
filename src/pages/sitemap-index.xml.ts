import { toolsRegistry } from '@/data/tools.registry';
import { getArticles, articleSlug } from '@/lib/articles';
import { getLocalizedPath } from '@/lib/i18n/routes';
import { site } from '@/lib/site';
import type { Locale } from '@/lib/i18n/config';

const locales: Locale[] = ['en', 'zh'];
const staticRoutes = [
  '/',
  '/tools/',
  '/topology-designers/',
  '/magnetics/',
  '/control/',
  '/simulation/',
  '/articles/',
  '/about/',
  '/feedback/'
];

function absoluteUrl(pathname: string): string {
  return `${site.url.replace(/\/$/, '')}${pathname}`;
}

function urlEntry(pathname: string): string {
  return `  <url><loc>${absoluteUrl(pathname)}</loc></url>`;
}

export async function GET() {
  const paths = new Set<string>();

  for (const locale of locales) {
    for (const route of staticRoutes) paths.add(getLocalizedPath(route, locale));

    for (const tool of toolsRegistry) {
      if (tool.status === 'available' && tool.route) paths.add(getLocalizedPath(tool.route, locale));
    }

    for (const article of await getArticles(locale)) {
      paths.add(getLocalizedPath(`/articles/${articleSlug(article)}/`, locale));
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from(paths).sort().map(urlEntry),
    '</urlset>'
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
