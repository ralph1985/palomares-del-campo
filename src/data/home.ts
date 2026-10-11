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
    description: 'Lomas suaves, caminos rurales y un territorio para recorrer sin prisa.',
    href: '/sobre-el-pueblo/#paisaje',
    linkLabel: 'Ver el paisaje',
    accent: 'landscape',
  },
  {
    title: 'Descubrir',
    eyebrow: 'Patrimonio e historia',
    description: 'Iglesias, ermitas, memoria romana y lugares que explican el pueblo.',
    href: '/sobre-el-pueblo/#patrimonio',
    linkLabel: 'Ver el patrimonio',
    accent: 'heritage',
  },
  {
    title: 'Celebrar',
    eyebrow: 'Fiestas y memoria viva',
    description: 'Tradiciones, música y encuentros que siguen poniendo Palomares en movimiento.',
    href: '/sobre-el-pueblo/#tradiciones',
    linkLabel: 'Ver las fiestas',
    accent: 'traditions',
  },
  {
    title: 'Jugar',
    eyebrow: 'Experiencia interactiva',
    description:
      'Una partida geolocalizada para moverse por el pueblo y competir con otros jugadores.',
    href: '/juego/',
    linkLabel: 'Entrar en el juego',
    accent: 'game',
  },
];
