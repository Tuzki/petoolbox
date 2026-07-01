export const pageMessages = {
  home: {
    title: 'PE Toolbox',
    description: 'Power electronics design tools, calculators, control workflows and simulation resources.',
    eyebrow: 'Power Electronics Design Tools',
    h1: 'Design power converters faster.',
    intro: 'Topology design, engineering calculations, magnetics, control-loop design and simulation tools for power electronics engineers.',
    explore: 'Explore the tools below ↓',
    directoryEyebrow: 'Tool Directory',
    directoryTitle: 'Power electronics workflows in one place.',
    whyEyebrow: 'Why PE Toolbox?',
    whyTitle: 'Focused on practical engineering work.',
    values: [
      { title: 'Power-electronics focused', text: 'Built for converter design, magnetics, control and simulation.' },
      { title: 'No registration required', text: 'Use tools directly in the browser.' },
      { title: 'Engineering formulas and assumptions', text: 'Each tool explains its model, units and limitations.' },
      { title: 'Open simulation ecosystem', text: 'PULSE connects design workflows with simulation.' }
    ],
    latestEyebrow: 'Latest Articles',
    latestTitle: 'Engineering notes and design guides.',
    viewAllArticles: 'View all articles →'
  },
  categories: {
    tools: { title: 'Engineering Calculators', description: 'Power electronics engineering calculators for quick design checks.', intro: 'PE Toolbox will provide practical electrical and power-stage calculators for fast engineering checks.' },
    'topology-designers': { title: 'Topology Designers', description: 'Power converter topology design workflows planned for PE Toolbox.', intro: 'Design workflows for common power converter topologies will be collected here, including Buck, Boost, Boost PFC, Flyback and LLC converters.' },
    magnetics: { title: 'Magnetics Design', description: 'Planned magnetics design tools for power electronics inductors and transformers.', intro: 'Magnetics design tools will cover inductor and transformer workflows used in power electronics converters.' },
    control: { title: 'Control Design', description: 'Planned control loop design workflows for power converters.', intro: 'Control design tools will focus on loop-shaping workflows for common converter families.' },
    simulation: { title: 'Simulation', description: 'PULSE simulation resources planned for PE Toolbox.', intro: 'Simulation will introduce the PULSE workflow for schematic entry, solving and waveform inspection.' }
  },
  about: {
    title: 'About',
    description: 'About PE Toolbox and its focus on practical power electronics engineering workflows.',
    h1: 'About PE Toolbox',
    paragraphs: [
      'PE Toolbox is a practical collection of design tools, calculators, control workflows and simulation resources for power electronics engineers.',
      'The project focuses on moving engineering validation earlier and reducing the time from specifications to a working design.'
    ],
    scopeLabel: 'Current scope',
    scope: ['Topology design', 'Engineering calculations', 'Magnetics', 'Control', 'PULSE simulation']
  },
  articles: {
    title: 'Articles',
    description: 'Engineering articles and design guides from PE Toolbox.',
    categoryFallback: 'engineering article',
    empty: 'No articles are published yet.',
    related: 'Related Articles',
    editorial: 'PE Toolbox Editorial',
    published: 'Published',
    updated: 'Updated'
  },
  notFound: {
    title: 'Page Not Found',
    description: 'The requested PE Toolbox page could not be found.',
    h1: 'Page Not Found',
    text: 'The page you requested is not available.',
    action: 'Return home'
  }
} as const;

type WidenMessages<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? WidenMessages<Item>[]
    : T extends object
      ? { [Key in keyof T]: WidenMessages<T[Key]> }
      : T;

export type PageMessages = WidenMessages<typeof pageMessages>;
