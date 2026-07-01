export const siteMessages = {
  name: 'PE Toolbox',
  tagline: 'Practical tools for power electronics engineers.',
  language: 'Language',
  languages: { en: 'EN', zh: '中文' },
  footer: {
    tools: 'Tools',
    resources: 'Resources',
    articles: 'Articles',
    about: 'About'
  },
  breadcrumbs: {
    home: 'Home'
  },
  status: {
    available: 'Available',
    beta: 'Beta',
    'coming-soon': 'Coming Soon'
  },
  controls: {
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Copy failed'
  }
} as const;

type WidenMessages<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? WidenMessages<Item>[]
    : T extends object
      ? { [Key in keyof T]: WidenMessages<T[Key]> }
      : T;

export type SiteMessages = WidenMessages<typeof siteMessages>;
