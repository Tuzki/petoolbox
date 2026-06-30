export type ToolCategory = 'topology' | 'calculators' | 'magnetics' | 'control' | 'simulation';
export type ToolStatus = 'available' | 'beta' | 'coming-soon';

export type ToolItem = {
  id: string;
  title: string;
  category: ToolCategory;
  description: string;
  symbol: string;
  status: ToolStatus;
  href?: string;
  directory?: boolean;
};

export const toolCategories: Array<{ id: ToolCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'topology', label: 'Topology' },
  { id: 'calculators', label: 'Calculators' },
  { id: 'magnetics', label: 'Magnetics' },
  { id: 'control', label: 'Control' },
  { id: 'simulation', label: 'Simulation' }
];

export const tools: ToolItem[] = [
  {
    id: 'buck-converter-designer',
    title: 'Buck Converter Designer',
    category: 'topology',
    description: 'Design the power stage, estimate component values and check voltage and current stress.',
    symbol: 'VOUT = D · VIN',
    status: 'coming-soon'
  },
  {
    id: 'boost-converter-designer',
    title: 'Boost Converter Designer',
    category: 'topology',
    description: 'Plan boost converter operating points, component ranges and semiconductor stress.',
    symbol: 'VOUT / VIN',
    status: 'coming-soon'
  },
  {
    id: 'boost-pfc-designer',
    title: 'Boost PFC Designer',
    category: 'topology',
    description: 'Outline boost PFC design assumptions for line current shaping and power-stage sizing.',
    symbol: 'PF ≈ 1',
    status: 'coming-soon'
  },
  {
    id: 'flyback-converter-designer',
    title: 'Flyback Converter Designer',
    category: 'topology',
    description: 'Estimate transformer turns ratio, switch stress and operating ranges for flyback supplies.',
    symbol: 'Np : Ns',
    status: 'coming-soon'
  },
  {
    id: 'llc-resonant-converter-designer',
    title: 'LLC Resonant Converter Designer',
    category: 'topology',
    description: 'Prepare resonant tank assumptions and operating points for LLC converter design.',
    symbol: 'Lr · Cr',
    status: 'coming-soon'
  },
  {
    id: 'rc-time-constant-calculator',
    title: 'RC Time Constant Calculator',
    category: 'calculators',
    description: 'Calculate RC time constants for filters, delays, soft-start networks and sensing circuits.',
    symbol: 'τ = RC',
    status: 'coming-soon'
  },
  {
    id: 'voltage-divider-calculator',
    title: 'Voltage Divider Calculator',
    category: 'calculators',
    description: 'Estimate divider ratios, output voltage and resistor selection for feedback networks.',
    symbol: 'VOUT / VIN',
    status: 'coming-soon'
  },
  {
    id: 'voltage-sensing-adc-scaling',
    title: 'Voltage Sensing & ADC Scaling',
    category: 'calculators',
    description: 'Select a practical high-voltage sensing divider and calculate ADC scaling, resolution, current and stress.',
    symbol: 'ADC',
    status: 'available',
    href: '/tools/voltage-sensing-adc-scaling/'
  },
  {
    id: 'sensing-rc-filter-designer',
    title: 'Sensing RC Filter Designer',
    category: 'calculators',
    description: 'Design a first-order RC filter for voltage, current and temperature sensing signal chains.',
    symbol: 'RC',
    status: 'available',
    href: '/tools/sensing-rc-filter-designer/'
  },
  {
    id: 'buck-inductor-ripple-calculator',
    title: 'Buck Inductor Ripple Calculator',
    category: 'calculators',
    description: 'Estimate buck inductor ripple current from voltage, inductance, duty cycle and switching frequency.',
    symbol: 'ΔIL',
    status: 'coming-soon',
    href: '/tools/buck-inductor-ripple-calculator/'
  },
  {
    id: 'rc-snubber-calculator',
    title: 'RC Snubber Calculator',
    category: 'calculators',
    description: 'Size damping networks for ringing control using measured frequency and circuit assumptions.',
    symbol: 'R · C',
    status: 'coming-soon'
  },
  {
    id: 'rcd-snubber-calculator',
    title: 'RCD Snubber Calculator',
    category: 'calculators',
    description: 'Estimate clamp and dissipation ranges for leakage-energy snubber design.',
    symbol: 'RCD',
    status: 'coming-soon'
  },
  {
    id: 'output-capacitor-calculator',
    title: 'Output Capacitor Calculator',
    category: 'calculators',
    description: 'Placeholder for output ripple and capacitance selection workflows.',
    symbol: 'COUT',
    status: 'coming-soon',
    directory: false
  },
  {
    id: 'magnetics-designer',
    title: 'Magnetics Designer',
    category: 'magnetics',
    description: 'Work through core area, flux density, turns and winding assumptions for power magnetics.',
    symbol: 'B · Ae',
    status: 'coming-soon'
  },
  {
    id: 'buck-control-loop-designer',
    title: 'Buck Control Loop Designer',
    category: 'control',
    description: 'Shape buck converter loop response from plant assumptions, compensator targets and crossover goals.',
    symbol: 'G(s)',
    status: 'coming-soon'
  },
  {
    id: 'boost-control-loop-designer',
    title: 'Boost Control Loop Designer',
    category: 'control',
    description: 'Plan boost converter compensation while accounting for right-half-plane zero limits.',
    symbol: 'G(s)',
    status: 'coming-soon'
  },
  {
    id: 'boost-pfc-control-loop-designer',
    title: 'Boost PFC Control Loop Designer',
    category: 'control',
    description: 'Coordinate current-loop and voltage-loop assumptions for boost PFC control workflows.',
    symbol: 'G(s)',
    status: 'coming-soon'
  },
  {
    id: 'flyback-control-loop-designer',
    title: 'Flyback Control Loop Designer',
    category: 'control',
    description: 'Estimate flyback loop-shaping constraints from plant behavior and isolation feedback assumptions.',
    symbol: 'G(s)',
    status: 'coming-soon'
  },
  {
    id: 'llc-control-loop-designer',
    title: 'LLC Control Loop Designer',
    category: 'control',
    description: 'Prepare LLC control assumptions across frequency modulation range and load conditions.',
    symbol: 'G(s)',
    status: 'coming-soon'
  },
  {
    id: 'pulse',
    title: 'PULSE',
    category: 'simulation',
    description: 'An event-driven piecewise-linear simulation ecosystem for power electronics.',
    symbol: '┌─┐ ┌─┐',
    status: 'beta',
    href: '/simulation/'
  }
];

export function formatToolStatus(status: ToolStatus): string {
  if (status === 'coming-soon') return 'Coming Soon';
  if (status === 'beta') return 'Beta';
  return 'Available';
}

export function getDirectoryTools(): ToolItem[] {
  return tools.filter((tool) => tool.directory !== false);
}

export function getTool(id: string | null | undefined): ToolItem | null {
  if (!id) return null;
  return tools.find((tool) => tool.id === id) ?? null;
}

export function getTools(ids: string[]): ToolItem[] {
  return ids.map((id) => getTool(id)).filter((tool): tool is ToolItem => Boolean(tool));
}

export function getToolsByCategory(category: ToolCategory): ToolItem[] {
  return getDirectoryTools().filter((tool) => tool.category === category);
}
