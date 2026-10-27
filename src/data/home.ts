export interface HomeEditorialEntry {
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  linkLabel: string;
  accent: 'landscape' | 'heritage' | 'traditions' | 'game';
}

export const homeEditorialEntries: HomeEditorialEntry[] = [
  {
    title: 'Pasear',
    eyebrow: 'Paisaje y situación',
    description: 'Caminos rurales y campos de cultivo alrededor del pueblo.',
    href: '/sobre-el-pueblo/#paisaje',
    linkLabel: 'Ver el paisaje',
    accent: 'landscape',
  },
  {
    title: 'Descubrir',
    eyebrow: 'Patrimonio e historia',
    description: 'La iglesia, las ermitas y los restos de la historia local.',
    href: '/sobre-el-pueblo/#patrimonio',
    linkLabel: 'Ver el patrimonio',
    accent: 'heritage',
  },
  {
    title: 'Celebrar',
    eyebrow: 'Fiestas y tradiciones',
    description: 'Las fiestas patronales, sus danzas y los actos de cada año.',
    href: '/sobre-el-pueblo/#tradiciones',
    linkLabel: 'Ver las fiestas',
    accent: 'traditions',
  },
  {
    title: 'Jugar',
    eyebrow: 'Juego geolocalizado',
    description: 'Encuentra lugares del pueblo y juega desde el mapa.',
    href: '/juego/',
    linkLabel: 'Entrar en el juego',
    accent: 'game',
  },
];
