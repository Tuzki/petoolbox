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
    'llc-resonant-converter-designer': { title: 'LLC Resonant Converter Designer', description: 'Design LLC resonant converters from input/output specifications, transformer ratio, resonant tank parameters, gain limits, and operating-point constraints.' },
    'voltage-sensing-adc-scaling': { title: 'Voltage Sensing and ADC Scaling Calculator', description: 'Calculate resistor divider values, ADC input range, measurement resolution, voltage stress, and tolerance impact for high-voltage sensing circuits.' },
    'sensing-rc-filter-designer': { title: 'Sensing RC Filter Designer', description: 'Design RC input filters for sensing and ADC interfaces, including cutoff frequency, settling behavior, source impedance, and sampling constraints.' },
    'shunt-current-sensing-evaluator': { title: 'Shunt Current Sensing Evaluator', description: 'Evaluate shunt resistor current sensing circuits, including sense voltage, power loss, amplifier output range, resolution, and thermal stress.' },
    'gate-resistor-power-stress-evaluator': { title: 'Gate Resistor Power and Stress Evaluator', description: 'Estimate gate resistor average power, pulse energy, peak stress, package margin, and parallel resistor sharing for power switch gate-drive design.' },
    'rc-snubber-first-pass-designer': { title: 'RC Snubber First-Pass Designer', description: 'Extract equivalent parasitic inductance and capacitance from two ringing measurements, then estimate series RC snubber values, loss, stress, and bench-tuning candidates.' },
    'capacitor-ripple-current-calculator': { title: 'Capacitor Ripple Current Calculator', description: 'Estimate capacitor RMS ripple current for power-stage filtering and thermal checks.' },
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
