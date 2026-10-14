export type PalomarenoNotificationData = {
  id: string;
  displayName: string;
  city: string;
  country: string;
  story: string;
  contactEmail: string;
};

export type PalomarenoNotification = {
  subject: string;
  text: string;
  html: string;
};

export const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const buildPalomarenoNotification = (
  submission: PalomarenoNotificationData,
): PalomarenoNotification => {
  const place = `${submission.city}, ${submission.country}`;
  const text = [
    'Hay una nueva propuesta pendiente de moderación en Palomareños por el mundo.',
    '',
    `ID: ${submission.id}`,
    `Nombre: ${submission.displayName}`,
    `Lugar: ${place}`,
    `Email: ${submission.contactEmail}`,
    '',
    'Historia:',
    submission.story,
    '',
    'La ficha todavía no se ha publicado.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
  <body style="margin: 0; padding: 24px; background: #f4f1e9; color: #19342d; font-family: Arial, sans-serif;">
    <main style="max-width: 640px; margin: 0 auto; background: #fffdf8; border-radius: 12px; overflow: hidden;">
      <header style="padding: 28px 32px; background: #19342d; color: #fffdf8;">
        <p style="margin: 0 0 8px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase;">Palomares del Campo</p>
        <h1 style="margin: 0; font-size: 26px; line-height: 1.2;">Nueva propuesta pendiente</h1>
      </header>
      <section style="padding: 28px 32px; line-height: 1.5;">
        <p><strong>ID:</strong> ${escapeHtml(submission.id)}</p>
        <p><strong>Nombre:</strong> ${escapeHtml(submission.displayName)}</p>
        <p><strong>Lugar:</strong> ${escapeHtml(place)}</p>
        <p><strong>Email:</strong> ${escapeHtml(submission.contactEmail)}</p>
        <h2 style="font-size: 18px;">Historia</h2>
        <p style="white-space: pre-line;">${escapeHtml(submission.story)}</p>
      </section>
      <footer style="padding: 18px 32px; background: #e5b77e; color: #19342d; font-size: 13px; line-height: 1.5;">La ficha está pendiente de moderación y todavía no se ha publicado.</footer>
    </main>
  </body>
</html>`;

  return {
    subject: 'Palomares: nueva propuesta de Palomareños por el mundo',
    text,
    html,
  };
};
