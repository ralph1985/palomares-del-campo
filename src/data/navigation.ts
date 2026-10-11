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
      { label: 'Información práctica', href: '/informacion-practica/' },
      { label: 'Servicios municipales', href: '/#vecinos' },
      { label: 'Contacto', href: '/#contacto' },
    ],
  },
  {
    label: 'Visita',
    links: [
      { label: 'Sobre el pueblo', href: '/sobre-el-pueblo/' },
      { label: 'Paisaje y patrimonio', href: '/sobre-el-pueblo/#patrimonio' },
      { label: 'Rutas', href: '/rutas/' },
    ],
  },
  {
    label: 'Actualidad',
    links: [
      { label: 'Noticias', href: '/noticias/' },
      { label: 'Agenda', href: '/agenda/' },
      { label: 'Bandos', href: '/bandos/' },
    ],
  },
  {
    label: 'Juego',
    links: [{ label: 'La bola', href: '/juego/' }],
  },
];
