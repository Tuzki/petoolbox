import type { SiteMessages } from '../en/site';

export const siteMessages = {
  name: 'PE Toolbox',
  tagline: '面向电力电子工程师的实用设计工具。',
  language: '语言',
  languages: { en: 'EN', zh: '中文' },
  footer: {
    tools: '工具',
    resources: '资源',
    articles: '技术文章',
    about: '关于'
  },
  breadcrumbs: {
    home: '首页'
  },
  status: {
    available: '可用',
    beta: 'Beta',
    'coming-soon': '规划中'
  },
  controls: {
    copy: '复制',
    copied: '已复制',
    copyFailed: '复制失败'
  }
} as const satisfies SiteMessages;
