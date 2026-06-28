export type NavigationStatus = 'available' | 'planned';

export type NavigationChild = {
  label: string;
  href?: string;
  status: NavigationStatus;
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

export const productNavigation: NavigationItem[] = [
  {
    id: 'topology-designers',
    label: 'Topology Designers',
    href: '/topology-designers/',
    sections: [
      {
        label: 'Non-Isolated',
        children: [
          { label: 'Buck Converter Designer', status: 'planned' },
          { label: 'Boost Converter Designer', status: 'planned' }
        ]
      },
      {
        label: 'AC-DC',
        children: [
          { label: 'Boost PFC Designer', status: 'planned' }
        ]
      },
      {
        label: 'Isolated',
        children: [
          { label: 'Flyback Converter Designer', status: 'planned' }
        ]
      },
      {
        label: 'Resonant',
        children: [
          { label: 'LLC Resonant Converter Designer', status: 'planned' }
        ]
      }
    ]
  },
  {
    id: 'engineering-calculators',
    label: 'Engineering Calculators',
    href: '/tools/',
    sections: [
      {
        label: 'Basic Circuits',
        children: [
          { label: 'RC Time Constant Calculator', status: 'planned' },
          { label: 'Voltage Divider Calculator', status: 'planned' }
        ]
      },
      {
        label: 'Power Stage',
        children: [
          {
            label: 'Buck Inductor Ripple Calculator',
            href: '/tools/buck-inductor-ripple-calculator/',
            status: 'available'
          }
        ]
      },
      {
        label: 'Protection & Components',
        children: [
          { label: 'RC Snubber Calculator', status: 'planned' },
          { label: 'RCD Snubber Calculator', status: 'planned' }
        ]
      }
    ]
  },
  {
    id: 'magnetics',
    label: 'Magnetics Design',
    href: '/magnetics/'
  },
  {
    id: 'control',
    label: 'Control Design',
    href: '/control/'
  },
  {
    id: 'simulation',
    label: 'Simulation',
    href: '/simulation/'
  },
  {
    id: 'articles',
    label: 'Articles',
    href: '/articles/'
  }
];

export const languageNavigation = [
  { label: 'EN', status: 'available' as const, href: '/' },
  { label: '中文', status: 'planned' as const, title: 'Chinese version coming soon' }
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href);
}
