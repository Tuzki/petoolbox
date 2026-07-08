import { toolCategories as categoryIds, toolsRegistry, type ToolCategory, type ToolStatus } from './tools.registry';
import { getMessages } from '@/lib/i18n/messages';
import { getLocalizedPath } from '@/lib/i18n/routes';
import type { Locale } from '@/lib/i18n/config';

export type ToolItem = {
  id: string;
  slug: string;
  title: string;
  category: ToolCategory;
  description: string;
  symbol: string;
  status: ToolStatus;
  href?: string;
  directory?: boolean;
};

export type { ToolCategory, ToolStatus };

export function getToolCategories(locale: Locale): Array<{ id: ToolCategory | 'all'; label: string }> {
  const labels = getMessages(locale).tools.categories;
  return [{ id: 'all', label: labels.all }, ...categoryIds.map((id) => ({ id, label: labels[id] }))];
}

export function getAllTools(locale: Locale): ToolItem[] {
  const labels = getMessages(locale).tools.items;
  return toolsRegistry.map((tool) => ({
    ...tool,
    title: labels[tool.id as keyof typeof labels].title,
    description: labels[tool.id as keyof typeof labels].description,
    href: tool.route ? getLocalizedPath(tool.route, locale) : undefined
  }));
}

export function formatToolStatus(status: ToolStatus, locale: Locale): string {
  return getMessages(locale).site.status[status];
}

export function getDirectoryTools(locale: Locale): ToolItem[] {
  return getAllTools(locale).filter((tool) => tool.directory !== false);
}

export function getTool(id: string | null | undefined, locale: Locale): ToolItem | null {
  if (!id) return null;
  return getAllTools(locale).find((tool) => tool.id === id) ?? null;
}

export function getTools(ids: string[], locale: Locale): ToolItem[] {
  return ids.map((id) => getTool(id, locale)).filter((tool): tool is ToolItem => Boolean(tool));
}

export function getToolsByCategory(category: ToolCategory, locale: Locale): ToolItem[] {
  return getDirectoryTools(locale).filter((tool) => tool.category === category);
}
