export type ToolCategory = 'topology' | 'calculators' | 'magnetics' | 'control' | 'simulation';
export type ToolStatus = 'available' | 'beta' | 'coming-soon';

export type ToolRegistryItem = {
  id: string;
  slug: string;
  category: ToolCategory;
  symbol: string;
  status: ToolStatus;
  route?: string;
  directory?: boolean;
};

export const toolCategories = ['topology', 'calculators', 'magnetics', 'control', 'simulation'] as const satisfies readonly ToolCategory[];

export const toolsRegistry: ToolRegistryItem[] = [
  { id: 'buck-converter-designer', slug: 'buck-converter-designer', category: 'topology', symbol: 'VOUT = D · VIN', status: 'coming-soon' },
  { id: 'boost-converter-designer', slug: 'boost-converter-designer', category: 'topology', symbol: 'VOUT / VIN', status: 'coming-soon' },
  { id: 'boost-pfc-designer', slug: 'boost-pfc-designer', category: 'topology', symbol: 'PF ≈ 1', status: 'coming-soon' },
  { id: 'flyback-converter-designer', slug: 'flyback-converter-designer', category: 'topology', symbol: 'Np : Ns', status: 'coming-soon' },
  { id: 'llc-resonant-converter-designer', slug: 'llc-resonant-converter-designer', category: 'topology', symbol: 'Lr · Cr', status: 'available', route: '/tools/llc-resonant-converter-designer/' },
  { id: 'rc-time-constant-calculator', slug: 'rc-time-constant-calculator', category: 'calculators', symbol: 'τ = RC', status: 'coming-soon' },
  { id: 'voltage-divider-calculator', slug: 'voltage-divider-calculator', category: 'calculators', symbol: 'VOUT / VIN', status: 'coming-soon' },
  { id: 'voltage-sensing-adc-scaling', slug: 'voltage-sensing-adc-scaling', category: 'calculators', symbol: 'ADC', status: 'available', route: '/tools/voltage-sensing-adc-scaling/' },
  { id: 'sensing-rc-filter-designer', slug: 'sensing-rc-filter-designer', category: 'calculators', symbol: 'RC', status: 'available', route: '/tools/sensing-rc-filter-designer/' },
  { id: 'shunt-current-sensing-evaluator', slug: 'shunt-current-sensing-evaluator', category: 'calculators', symbol: 'I × R', status: 'available', route: '/tools/shunt-current-sensing-evaluator/' },
  { id: 'buck-inductor-ripple-calculator', slug: 'buck-inductor-ripple-calculator', category: 'calculators', symbol: 'ΔIL', status: 'coming-soon', route: '/tools/buck-inductor-ripple-calculator/' },
  { id: 'rc-snubber-calculator', slug: 'rc-snubber-calculator', category: 'calculators', symbol: 'R · C', status: 'coming-soon' },
  { id: 'rcd-snubber-calculator', slug: 'rcd-snubber-calculator', category: 'calculators', symbol: 'RCD', status: 'coming-soon' },
  { id: 'output-capacitor-calculator', slug: 'output-capacitor-calculator', category: 'calculators', symbol: 'COUT', status: 'coming-soon', directory: false },
  { id: 'magnetics-designer', slug: 'magnetics-designer', category: 'magnetics', symbol: 'B · Ae', status: 'coming-soon' },
  { id: 'buck-control-loop-designer', slug: 'buck-control-loop-designer', category: 'control', symbol: 'G(s)', status: 'coming-soon' },
  { id: 'boost-control-loop-designer', slug: 'boost-control-loop-designer', category: 'control', symbol: 'G(s)', status: 'coming-soon' },
  { id: 'boost-pfc-control-loop-designer', slug: 'boost-pfc-control-loop-designer', category: 'control', symbol: 'G(s)', status: 'coming-soon' },
  { id: 'flyback-control-loop-designer', slug: 'flyback-control-loop-designer', category: 'control', symbol: 'G(s)', status: 'coming-soon' },
  { id: 'llc-control-loop-designer', slug: 'llc-control-loop-designer', category: 'control', symbol: 'G(s)', status: 'coming-soon' },
  { id: 'pulse', slug: 'pulse', category: 'simulation', symbol: '┌─┐ ┌─┐', status: 'beta', route: '/simulation/' }
];
