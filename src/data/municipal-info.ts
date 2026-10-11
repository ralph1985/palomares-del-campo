import { footerOfficialLinks, municipalContact } from './site-footer';

export interface MunicipalInfoSource {
  label: string;
  href: string;
}

export interface TransportScheduleEntry {
  day: string;
  time: string;
}

export interface TransportRoute {
  title: string;
  entries: TransportScheduleEntry[];
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
      'Horarios de autobús de línea publicados por Palomares del Campo Informa para los trayectos entre Palomares del Campo y Cuenca.',
    publishedAt: '2026-10-09',
    source: {
      label: 'Bando 1659178 · Palomares del Campo Informa',
      href: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=1659178',
    } satisfies MunicipalInfoSource,
    routes: [
      {
        title: 'Palomares del Campo → Cuenca',
        entries: [
          { day: 'Lunes', time: '07:45' },
          { day: 'Martes', time: '08:34' },
          { day: 'Jueves', time: '08:34' },
          { day: 'Viernes', time: '07:45' },
          { day: 'Domingo', time: '17:30' },
        ],
      },
      {
        title: 'Cuenca → Palomares del Campo',
        entries: [
          { day: 'Lunes', time: '15:15' },
          { day: 'Martes', time: '15:15' },
          { day: 'Jueves', time: '15:15' },
          { day: 'Viernes', time: '15:15' },
        ],
      },
    ] satisfies TransportRoute[],
  },
};

export const municipalPhoneHref = `tel:${municipalInfo.contact.phone.replaceAll(' ', '')}`;
export const municipalEmailHref = `mailto:${municipalInfo.contact.email}`;
