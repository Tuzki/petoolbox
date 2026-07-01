export type NavigationItemId = 'topology-designers' | 'engineering-calculators' | 'magnetics' | 'control' | 'simulation' | 'articles';

export type NavigationRegistryItem = {
  id: NavigationItemId;
  route: string;
  sections?: Array<{
    id: string;
    toolIds: string[];
  }>;
};

export const navigationRegistry: NavigationRegistryItem[] = [
  {
    id: 'topology-designers',
    route: '/topology-designers/',
    sections: [
      { id: 'non-isolated', toolIds: ['buck-converter-designer', 'boost-converter-designer'] },
      { id: 'ac-dc', toolIds: ['boost-pfc-designer'] },
      { id: 'isolated', toolIds: ['flyback-converter-designer'] },
      { id: 'resonant', toolIds: ['llc-resonant-converter-designer'] }
    ]
  },
  {
    id: 'engineering-calculators',
    route: '/tools/',
    sections: [
      { id: 'basic-circuits', toolIds: ['rc-time-constant-calculator', 'voltage-divider-calculator', 'voltage-sensing-adc-scaling', 'sensing-rc-filter-designer', 'shunt-current-sensing-evaluator', 'gate-resistor-power-stress-evaluator'] },
      { id: 'power-stage', toolIds: ['buck-inductor-ripple-calculator'] },
      { id: 'protection', toolIds: ['rc-snubber-calculator', 'rcd-snubber-calculator'] }
    ]
  },
  { id: 'magnetics', route: '/magnetics/' },
  { id: 'control', route: '/control/' },
  { id: 'simulation', route: '/simulation/' },
  { id: 'articles', route: '/articles/' }
];
