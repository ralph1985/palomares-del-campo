export interface FooterLink {
  label: string;
  href: string;
}

export const footerExploreLinks: FooterLink[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Noticias', href: '/noticias/' },
  { label: 'La bola', href: '/juego/' },
];

export const footerOfficialLinks: FooterLink[] = [
  {
    label: 'Portal municipal',
    href: 'https://palomaresdelcampo.dipucuenca.es/',
  },
  {
    label: 'Sede electrónica',
    href: 'https://palomaresdelcampo.sedelectronica.es/info.0',
  },
  {
    label: 'Buzón electrónico',
    href: 'https://palomaresdelcampo.sedelectronica.es/enotifications',
  },
  {
    label: 'Perfil del contratante',
    href: 'https://palomaresdelcampo.sedelectronica.es/contractor-profile-list',
  },
  {
    label: 'Tablón de anuncios',
    href: 'https://palomaresdelcampo.sedelectronica.es/board',
  },
  {
    label: 'Portal de transparencia',
    href: 'https://palomaresdelcampo.sedelectronica.es/transparency',
  },
  {
    label: 'Contratación del Estado',
    href: 'https://contrataciondelestado.es/wps/poc?uri=deeplink%3AperfilContratante&idBp=3mNkoZjkBQwSugstABGr5A%3D%3D',
  },
];

export const municipalContact = {
  name: 'Ayuntamiento de Palomares del Campo',
  address: 'Plaza del Coso, 1',
  locality: 'Palomares del Campo, Cuenca',
  judicialDistrict: 'Partido judicial: Tarancón',
  phone: '969 277 601',
  phoneHref: '+34969277601',
  email: 'ayto.palomares@gmail.com',
};
