export type ToolInfo = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export const tools: Record<string, ToolInfo> = {
  'buck-inductor-ripple-calculator': {
    id: 'buck-inductor-ripple-calculator',
    title: 'Buck Inductor Ripple Calculator',
    description: 'Estimate buck inductor ripple current from voltage, inductance, duty cycle, and switching frequency.',
    href: '/tools/buck-inductor-ripple-calculator/'
  },
  'output-capacitor-calculator': {
    id: 'output-capacitor-calculator',
    title: 'Output Capacitor Calculator',
    description: 'Placeholder for output ripple and capacitance selection workflows.',
    href: '/tools/buck-inductor-ripple-calculator/'
  },
  'buck-converter-designer': {
    id: 'buck-converter-designer',
    title: 'Buck Converter Designer',
    description: 'Placeholder for the full buck converter design workflow.',
    href: '/tools/buck-inductor-ripple-calculator/'
  }
};

export function getTool(id: string | null | undefined): ToolInfo | null {
  if (!id) return null;
  return tools[id] ?? null;
}

export function getTools(ids: string[]): ToolInfo[] {
  return ids.map((id) => tools[id]).filter((tool): tool is ToolInfo => Boolean(tool));
}
