export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeHtmlLang: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN'
};

export const ogLocale: Record<Locale, string> = {
  en: 'en_US',
  zh: 'zh_CN'
};

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'zh';
}
