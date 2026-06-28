import { formatToolStatus, getTool } from '@/data/tools';

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

function toolItem(id: string, hrefOverride?: string): NavigationChild {
  const tool = getTool(id);
  return {
    label: tool?.title ?? id,
    href: hrefOverride ?? tool?.href,
    status: tool ? formatToolStatus(tool.status) : 'Coming Soon'
  };
}

export const productNavigation: NavigationItem[] = [
  {
    id: 'topology-designers',
    label: 'Topology Designers',
    href: '/topology-designers/',
    sections: [
      { label: 'Non-Isolated', children: [toolItem('buck-converter-designer'), toolItem('boost-converter-designer')] },
      { label: 'AC-DC', children: [toolItem('boost-pfc-designer')] },
      { label: 'Isolated', children: [toolItem('flyback-converter-designer')] },
      { label: 'Resonant', children: [toolItem('llc-resonant-converter-designer')] }
    ]
  },
  {
    id: 'engineering-calculators',
    label: 'Engineering Calculators',
    href: '/tools/',
    sections: [
      { label: 'Basic Circuits', children: [toolItem('rc-time-constant-calculator'), toolItem('voltage-divider-calculator')] },
      { label: 'Power Stage', children: [toolItem('buck-inductor-ripple-calculator')] },
      { label: 'Protection', children: [toolItem('rc-snubber-calculator'), toolItem('rcd-snubber-calculator')] }
    ]
  },
  { id: 'magnetics', label: 'Magnetics Design', href: '/magnetics/' },
  { id: 'control', label: 'Control Design', href: '/control/' },
  { id: 'simulation', label: 'Simulation', href: '/simulation/' },
  { id: 'articles', label: 'Articles', href: '/articles/' }
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
