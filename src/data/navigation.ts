import { navigationRegistry } from './navigation.registry';
import { formatToolStatus, getTool } from './tools';
import { getMessages } from '@/lib/i18n/messages';
import { getLocalizedPath } from '@/lib/i18n/routes';
import type { Locale } from '@/lib/i18n/config';

export type NavigationChild = {
  label: string;
  href?: string;
  status: string;
};

export type NavigationSection = {
  label: string;
  children: NavigationChild[];
};

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  sections?: NavigationSection[];
};

export function getProductNavigation(locale: Locale): NavigationItem[] {
  const t = getMessages(locale);
  return navigationRegistry.map((item) => ({
    id: item.id,
    label: t.navigation.items[item.id],
    href: getLocalizedPath(item.route, locale),
    sections: item.sections?.map((section) => ({
      label: t.navigation.sections[section.id as keyof typeof t.navigation.sections],
      children: section.toolIds.map((id) => {
        const tool = getTool(id, locale);
        return {
          label: tool?.title ?? id,
          href: tool?.href,
          status: tool ? formatToolStatus(tool.status, locale) : t.site.status['coming-soon']
        };
      })
    }))
  }));
}

export function getFooterTools(locale: Locale) {
  const t = getMessages(locale).navigation.items;
  return [
    { label: t['topology-designers'], href: getLocalizedPath('/topology-designers/', locale) },
    { label: t['engineering-calculators'], href: getLocalizedPath('/tools/', locale) },
    { label: t.magnetics, href: getLocalizedPath('/magnetics/', locale) },
    { label: t.control, href: getLocalizedPath('/control/', locale) },
    { label: t.simulation, href: getLocalizedPath('/simulation/', locale) }
  ];
}

export function isActivePath(pathname: string, href: string): boolean {
  if (href.endsWith('/')) return pathname === href || pathname.startsWith(href);
  return pathname === href;
}
