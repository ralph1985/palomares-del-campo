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
      { label: 'Servicios del pueblo', href: '/servicios-del-pueblo/' },
      { label: 'Servicios municipales', href: '/informacion-practica/' },
    ],
  },
  {
    label: 'Visita',
    links: [
      { label: 'Sobre el pueblo', href: '/sobre-el-pueblo/' },
      { label: 'Parques y zonas verdes', href: '/parques-y-zonas-verdes/' },
      { label: 'Rutas', href: '/rutas/' },
      { label: 'Qué ver cerca', href: '/que-ver-cerca/' },
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
    label: 'Comunidad',
    links: [{ label: 'Palomareños por el mundo', href: '/palomarenos-por-el-mundo/' }],
  },
  {
    label: 'Juego',
    links: [{ label: 'La bola', href: '/juego/' }],
  },
];
