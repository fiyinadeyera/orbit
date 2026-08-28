// Demo-only network shown when the user's real network is still sparse, so the
// app (and especially the Network map) looks alive on first open. These people
// are fictional and never written to the database. They disappear as soon as
// the user has a couple of real connections of their own.

export type MapPerson = {
  id: string;
  name: string;
  initials: string;
  company: string | null;
  role: string | null;
  location: string | null;
  howMet: string | null;
  dateMet: string | null;
  tags: string[];
  isDemo: boolean;
};

export type MapEdge = {
  id: string;
  aId: string;
  bId: string;
};

// Number of real people below which we fall back to the demo network.
export const DEMO_THRESHOLD = 2;

export const SAMPLE_PEOPLE: MapPerson[] = [
  {
    id: 'demo-maya',
    name: 'Maya Chen',
    initials: 'MC',
    company: 'Northwind',
    role: 'Head of Product',
    location: 'San Francisco',
    howMet: 'Met at an AI meetup in SoMa',
    dateMet: '2026-05-14',
    tags: ['product', 'climbing'],
    isDemo: true,
  },
  {
    id: 'demo-devin',
    name: 'Devin Okoye',
    initials: 'DO',
    company: 'Loop Labs',
    role: 'Founder',
    location: 'New York',
    howMet: 'Introduced over a founder dinner',
    dateMet: '2026-04-02',
    tags: ['founders', 'cycling'],
    isDemo: true,
  },
  {
    id: 'demo-priya',
    name: 'Priya Nasir',
    initials: 'PN',
    company: 'Ledgerly',
    role: 'Founding Engineer',
    location: 'Brooklyn',
    howMet: 'Introduced by Sam at a rooftop mixer',
    dateMet: '2026-06-21',
    tags: ['trail running', 'jazz piano'],
    isDemo: true,
  },
  {
    id: 'demo-sam',
    name: 'Sam Rivera',
    initials: 'SR',
    company: 'Figma',
    role: 'Product Designer',
    location: 'Remote',
    howMet: 'Met at a weekend design jam',
    dateMet: '2026-03-18',
    tags: ['design', 'pottery'],
    isDemo: true,
  },
  {
    id: 'demo-lena',
    name: 'Lena Bjork',
    initials: 'LB',
    company: 'Aster Capital',
    role: 'Partner',
    location: 'London',
    howMet: 'Met at a pitch night',
    dateMet: '2026-02-27',
    tags: ['investing', 'sailing'],
    isDemo: true,
  },
];

// Connections between the demo people (in addition to the implicit link each
// one has to "You" at the center of the map).
export const SAMPLE_EDGES: MapEdge[] = [
  { id: 'demo-e1', aId: 'demo-maya', bId: 'demo-devin' },
  { id: 'demo-e2', aId: 'demo-sam', bId: 'demo-priya' },
  { id: 'demo-e3', aId: 'demo-devin', bId: 'demo-lena' },
  { id: 'demo-e4', aId: 'demo-maya', bId: 'demo-sam' },
];
