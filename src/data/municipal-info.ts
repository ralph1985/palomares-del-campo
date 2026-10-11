import { footerOfficialLinks, municipalContact } from './site-footer';

export interface MunicipalInfoSource {
  label: string;
  href: string;
}

export const municipalInfoReviewedAt = '2026-10-11';

export const municipalInfo = {
  pageTitle: 'Información práctica para el día a día',
  pageDescription:
    'Contacto del Ayuntamiento de Palomares del Campo y acceso a sus canales oficiales.',
  contact: {
    ...municipalContact,
    mapHref:
      'https://www.openstreetmap.org/search?query=Plaza%20del%20Coso%201%2C%20Palomares%20del%20Campo%2C%20Cuenca',
    source: {
      label: 'Portal municipal de Palomares del Campo',
      href: 'https://palomaresdelcampo.dipucuenca.es/index.php',
    } satisfies MunicipalInfoSource,
  },
  officialServices: footerOfficialLinks,
  transport: {
    title: 'Transporte y servicios locales',
    description:
      'Los horarios de transporte se incorporarán cuando exista una fuente institucional vigente. Preferimos dejar este espacio pendiente antes que publicar un horario que pueda haber cambiado.',
    source: {
      label: 'Portal municipal de Palomares del Campo',
      href: 'https://palomaresdelcampo.dipucuenca.es/index.php',
    } satisfies MunicipalInfoSource,
  },
};

export const municipalPhoneHref = `tel:${municipalInfo.contact.phone.replaceAll(' ', '')}`;
export const municipalEmailHref = `mailto:${municipalInfo.contact.email}`;
