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

export const municipalInfoReviewedAt = '2026-11-15';

// TODO(AYTO)[MUN-01]: Confirmar qué correo debe ser el contacto general; mantener separados los correos publicados por la Sede y por la PLACSP hasta recibir respuesta.
// TODO(AYTO)[MUN-02]: Confirmar el horario de atención al público y si hace falta cita o contacto previo; no inferirlo a partir de otra oficina.
// TODO(AYTO)[CORP-01]: Solicitar al Ayuntamiento la composición actual de la Corporación y sus delegaciones; la página municipal enlazada parece desactualizada.
// TODO(AYTO)[TRN-01]: Preguntar al Ayuntamiento u operador si sigue vigente el bando 1659178 y actualizarlo si hay un horario más reciente.

export const municipalInfo = {
  pageTitle: 'Información práctica para el día a día',
  pageDescription:
    'Contacto del Ayuntamiento de Palomares del Campo y acceso a sus canales oficiales.',
  contact: {
    ...municipalContact,
    mapHref:
      'https://www.openstreetmap.org/search?query=Plaza%20del%20Coso%201%2C%20Palomares%20del%20Campo%2C%20Cuenca',
    source: {
      label: 'Sede electrónica · Titularidad y Directorio de Oficinas',
      href: 'https://palomaresdelcampo.sedelectronica.es/ownership',
    } satisfies MunicipalInfoSource,
    dir3: 'L01161489',
    registrationOfficeCode: 'O00021005',
  },
  contractingContact: {
    authority: 'Alcaldía del Ayuntamiento de Palomares del Campo',
    nif: 'P1615700J',
    email: 'ayto.palomares@gmail.com',
    source: {
      label: 'Perfil del contratante en la Plataforma de Contratación del Sector Público',
      href: 'https://contrataciondelestado.es/wps/poc?uri=deeplink%3AperfilContratante&idBp=3mNkoZjkBQwSugstABGr5A%3D%3D',
    } satisfies MunicipalInfoSource,
  },
  corporation: {
    status:
      'No se ha podido confirmar una composición municipal vigente en una fuente oficial actualizada. La página municipal consultada afirma que la Corporación tiene once concejales, pero enumera siete; no confirma una composición actual y no reproducimos esos nombres como vigentes. Para publicar una relación fiable, hace falta que el Ayuntamiento confirme la composición y las delegaciones actuales.',
    members: [],
    source: {
      label: 'Página municipal «Gobierno» (relación publicada, aparentemente desactualizada)',
      href: 'https://palomaresdelcampo.dipucuenca.es/index.php/joomla/smart-search',
    } satisfies MunicipalInfoSource,
  },
  // TODO(AYTO)[MUN-03]: Confirmar que el directorio de enlaces oficiales está completo y vigente; el buzón electrónico de la Sede redirige a identificación.
  officialServices: footerOfficialLinks,
  transport: {
    title: 'Transporte y servicios locales',
    description:
      'Horarios de autobús de línea publicados por Palomares del Campo Informa para los trayectos entre Palomares del Campo y Cuenca.',
    publishedAt: '2026-10-09',
    publishedTime: '20:05:06',
    lastCheckedAt: '2026-11-15',
    source: {
      label: 'Bando 1659178 · Palomares del Campo Informa',
      href: 'https://www.bandomovil.com/palomaresdelcampo/1659178/0',
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
