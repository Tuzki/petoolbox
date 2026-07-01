import { siteMessages as enSite } from '@/locales/en/site';
import { siteMessages as zhSite } from '@/locales/zh/site';
import { navigationMessages as enNavigation } from '@/locales/en/navigation';
import { navigationMessages as zhNavigation } from '@/locales/zh/navigation';
import { toolMessages as enTools } from '@/locales/en/tools';
import { toolMessages as zhTools } from '@/locales/zh/tools';
import { pageMessages as enPages } from '@/locales/en/pages';
import { pageMessages as zhPages } from '@/locales/zh/pages';
import type { Locale } from './config';

export const messages = {
  en: {
    site: enSite,
    navigation: enNavigation,
    tools: enTools,
    pages: enPages
  },
  zh: {
    site: zhSite,
    navigation: zhNavigation,
    tools: zhTools,
    pages: zhPages
  }
} as const;

export function getMessages(locale: Locale) {
  return messages[locale];
}
