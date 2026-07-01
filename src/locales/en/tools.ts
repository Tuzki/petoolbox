export const toolMessages = {
  categories: {
    all: 'All',
    topology: 'Topology',
    calculators: 'Calculators',
    magnetics: 'Magnetics',
    control: 'Control',
    simulation: 'Simulation'
  },
  items: {
    'buck-converter-designer': { title: 'Buck Converter Designer', description: 'Design the power stage, estimate component values and check voltage and current stress.' },
    'boost-converter-designer': { title: 'Boost Converter Designer', description: 'Plan boost converter operating points, component ranges and semiconductor stress.' },
    'boost-pfc-designer': { title: 'Boost PFC Designer', description: 'Outline boost PFC design assumptions for line current shaping and power-stage sizing.' },
    'flyback-converter-designer': { title: 'Flyback Converter Designer', description: 'Estimate transformer turns ratio, switch stress and operating ranges for flyback supplies.' },
    'llc-resonant-converter-designer': { title: 'LLC Resonant Converter Designer', description: 'Search LLC resonant tank candidates across input voltage and load corners using trajectory-guided ODE analysis.' },
    'rc-time-constant-calculator': { title: 'RC Time Constant Calculator', description: 'Calculate RC time constants for filters, delays, soft-start networks and sensing circuits.' },
    'voltage-divider-calculator': { title: 'Voltage Divider Calculator', description: 'Estimate divider ratios, output voltage and resistor selection for feedback networks.' },
    'voltage-sensing-adc-scaling': { title: 'Voltage Sensing & ADC Scaling', description: 'Select a practical high-voltage sensing divider and calculate ADC scaling, resolution, current and stress.' },
    'sensing-rc-filter-designer': { title: 'Sensing RC Filter Designer', description: 'Design a first-order RC filter for voltage, current and temperature sensing signal chains.' },
    'buck-inductor-ripple-calculator': { title: 'Buck Inductor Ripple Calculator', description: 'Estimate buck inductor ripple current from voltage, inductance, duty cycle and switching frequency.' },
    'rc-snubber-calculator': { title: 'RC Snubber Calculator', description: 'Size damping networks for ringing control using measured frequency and circuit assumptions.' },
    'rcd-snubber-calculator': { title: 'RCD Snubber Calculator', description: 'Estimate clamp and dissipation ranges for leakage-energy snubber design.' },
    'output-capacitor-calculator': { title: 'Output Capacitor Calculator', description: 'Placeholder for output ripple and capacitance selection workflows.' },
    'magnetics-designer': { title: 'Magnetics Designer', description: 'Work through core area, flux density, turns and winding assumptions for power magnetics.' },
    'buck-control-loop-designer': { title: 'Buck Control Loop Designer', description: 'Shape buck converter loop response from plant assumptions, compensator targets and crossover goals.' },
    'boost-control-loop-designer': { title: 'Boost Control Loop Designer', description: 'Plan boost converter compensation while accounting for right-half-plane zero limits.' },
    'boost-pfc-control-loop-designer': { title: 'Boost PFC Control Loop Designer', description: 'Coordinate current-loop and voltage-loop assumptions for boost PFC control workflows.' },
    'flyback-control-loop-designer': { title: 'Flyback Control Loop Designer', description: 'Estimate flyback loop-shaping constraints from plant behavior and isolation feedback assumptions.' },
    'llc-control-loop-designer': { title: 'LLC Control Loop Designer', description: 'Prepare LLC control assumptions across frequency modulation range and load conditions.' },
    pulse: { title: 'PULSE', description: 'An event-driven piecewise-linear simulation ecosystem for power electronics.' }
  }
} as const;

type WidenMessages<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? WidenMessages<Item>[]
    : T extends object
      ? { [Key in keyof T]: WidenMessages<T[Key]> }
      : T;

export type ToolMessages = WidenMessages<typeof toolMessages>;
