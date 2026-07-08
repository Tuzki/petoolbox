export type SiteMode = 'private' | 'public';

const rawMode = import.meta.env.PUBLIC_SITE_MODE;
const privateModeEnabled = import.meta.env.PUBLIC_ENABLE_PRIVATE_MODE === 'true';

export const siteMode: SiteMode = rawMode === 'private' && privateModeEnabled ? 'private' : 'public';

export const site = {
  name: 'PE Toolbox',
  tagline: 'Practical tools for power electronics engineers',
  mode: siteMode,
  url: import.meta.env.PUBLIC_SITE_URL || 'https://www.petoolbox.tech',
  lang: 'en'
} as const;

export const isPrivateMode = site.mode === 'private';

export function canonicalUrl(pathname: string): string {
  const base = site.url.replace(/\/$/, '');
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}
