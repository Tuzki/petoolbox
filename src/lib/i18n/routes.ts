import { defaultLocale, isLocale, type Locale } from './config';

export function stripLocalePrefix(pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const [, first, ...rest] = normalized.split('/');
  if (!isLocale(first)) return normalized;
  const stripped = `/${rest.join('/')}`;
  return stripped === '/' ? '/' : ensureTrailingSlash(stripped);
}

export function getLocaleFromPath(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  return isLocale(first) ? first : defaultLocale;
}

export function getLocalizedPath(pathname: string, locale: Locale): string {
  const path = ensureTrailingSlash(stripLocalePrefix(pathname));
  return path === '/' ? `/${locale}/` : `/${locale}${path}`;
}

export function swapLocaleInPath(pathname: string, locale: Locale): string {
  return getLocalizedPath(pathname, locale);
}

export function localizedUrl(pathname: string, locale: Locale, search = '', hash = ''): string {
  return `${getLocalizedPath(pathname, locale)}${search}${hash}`;
}

export function ensureTrailingSlash(pathname: string): string {
  if (pathname === '') return '/';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}
