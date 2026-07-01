export const navigationMessages = {
  items: {
    'topology-designers': 'Topology Designers',
    'engineering-calculators': 'Engineering Calculators',
    magnetics: 'Magnetics Design',
    control: 'Control Design',
    simulation: 'Simulation',
    articles: 'Articles'
  },
  sections: {
    'non-isolated': 'Non-Isolated',
    'ac-dc': 'AC-DC',
    isolated: 'Isolated',
    resonant: 'Resonant',
    'basic-circuits': 'Basic Circuits',
    'power-stage': 'Power Stage',
    protection: 'Protection'
  },
  viewAll: 'View All',
  toggleMenu: 'Toggle navigation menu',
  toggleSection: 'Toggle'
} as const;

type WidenMessages<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? WidenMessages<Item>[]
    : T extends object
      ? { [Key in keyof T]: WidenMessages<T[Key]> }
      : T;

export type NavigationMessages = WidenMessages<typeof navigationMessages>;
