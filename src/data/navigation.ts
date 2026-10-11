export interface NavigationLink {
  label: string;
  href: string;
}

export interface NavigationGroup {
  label: string;
  links: NavigationLink[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Vecinos',
    links: [
      { label: 'Servicios municipales', href: '/#vecinos' },
      { label: 'Contacto', href: '/#contacto' },
    ],
  },
  {
    label: 'Visita',
    links: [
      { label: 'Sobre el pueblo', href: '/sobre-el-pueblo/' },
      { label: 'Paisaje y patrimonio', href: '/sobre-el-pueblo/#patrimonio' },
    ],
  },
  {
    label: 'Actualidad',
    links: [{ label: 'Noticias', href: '/noticias/' }],
  },
  {
    label: 'Juego',
    links: [{ label: 'La bola', href: '/juego/' }],
  },
];
