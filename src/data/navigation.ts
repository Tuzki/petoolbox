import { formatToolStatus, getTool } from '@/data/tools';

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
};

export type ToolsMenuLink = {
  label: string;
  href: string;
  status?: string;
};

export type ToolsMenuSection = {
  label: string;
  links: ToolsMenuLink[];
};

const buckCalculator = getTool('buck-inductor-ripple-calculator');

export const primaryNavigation: NavigationItem[] = [
  { id: 'tools', label: 'Tools', href: '/tools/' },
  { id: 'articles', label: 'Articles', href: '/articles/' },
  { id: 'about', label: 'About', href: '/about/' }
];

export const toolsMenuSections: ToolsMenuSection[] = [
  {
    label: 'Design Workflows',
    links: [
      { label: 'Topology Designers', href: '/topology-designers/' },
      { label: 'Magnetics Design', href: '/magnetics/' },
      { label: 'Control Design', href: '/control/' }
    ]
  },
  {
    label: 'Engineering Tools',
    links: [
      { label: 'Engineering Calculators', href: '/tools/' },
      { label: 'Simulation & PULSE', href: '/simulation/' }
    ]
  },
  {
    label: 'Featured',
    links: [
      {
        label: buckCalculator?.title ?? 'Buck Inductor Ripple Calculator',
        href: buckCalculator?.href ?? '/tools/buck-inductor-ripple-calculator/',
        status: buckCalculator ? formatToolStatus(buckCalculator.status) : 'Coming Soon'
      }
    ]
  }
];

export const footerTools = [
  { label: 'Topology Designers', href: '/topology-designers/' },
  { label: 'Engineering Calculators', href: '/tools/' },
  { label: 'Magnetics Design', href: '/magnetics/' },
  { label: 'Control Design', href: '/control/' },
  { label: 'Simulation & PULSE', href: '/simulation/' }
];

export const languageNavigation = [
  { label: 'EN', status: 'available' as const },
  { label: '中文', status: 'planned' as const, title: 'Chinese version coming soon' }
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href);
}
