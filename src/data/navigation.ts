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
      { label: 'Servicios municipales', href: '/informacion-practica/' },
      { label: 'Contacto', href: '/#contacto' },
    ],
  },
  {
    label: 'Visita',
    links: [
      { label: 'Sobre el pueblo', href: '/sobre-el-pueblo/' },
      { label: 'Paisaje y patrimonio', href: '/sobre-el-pueblo/#patrimonio' },
      { label: 'Rutas', href: '/rutas/' },
      { label: 'Alojamientos rurales', href: '/alojamientos/' },
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
