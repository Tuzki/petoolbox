export const pageMessages = {
  home: {
    title: 'PE Toolbox',
    description: 'Power electronics design tools, browser-based calculators, design workflows, and engineering notes.',
    h1: 'Power Electronics Design Tools',
    intro: 'Browser-based calculators, design workflows, and engineering notes for power electronics engineers.',
    actionsLabel: 'Homepage actions',
    exploreTools: 'Explore Tools',
    readArticles: 'Read Articles',
    featuredToolsTitle: 'Featured Tools',
    viewAllTools: 'View all tools →',
    latestTitle: 'Latest Article',
    latestLabel: 'Engineering article',
    latestArticleTitle: 'NVIDIA 800V Power Architecture',
    latestArticleDescription: 'A practical engineering note on high-voltage rack power, 48V intermediate buses, and board-level power delivery for AI servers.',
    viewAllArticles: 'View all articles →',
    whyTitle: 'Why PE Toolbox',
    values: [
      { title: 'Browser-based', text: 'Browser-based tools, no installation required.' },
      { title: 'Visible assumptions', text: 'Engineering assumptions are visible.' },
      { title: 'Practical workflows', text: 'Built for practical power electronics design workflows.' }
    ]
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
    tocLabel: 'On this page',
    categories: {
      'converter-design': 'Converter Design',
      'engineering-articles': 'Engineering Articles'
    },
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
