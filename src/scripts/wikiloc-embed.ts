const embeds = document.querySelectorAll<HTMLElement>('[data-wikiloc-embed]');

for (const embed of embeds) {
  const button = embed.querySelector<HTMLButtonElement>('[data-wikiloc-load]');
  const frameHost = embed.querySelector<HTMLElement>('[data-wikiloc-frame-host]');
  const status = embed.querySelector<HTMLElement>('[data-wikiloc-status]');
  const embedUrl = embed.dataset.embedUrl;
  const routeTitle = embed.dataset.routeTitle;

  if (!button || !frameHost || !status || !embedUrl || !routeTitle) continue;

  button.addEventListener('click', () => {
    if (frameHost.querySelector('iframe')) return;

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.title = `Mapa de la ruta ${routeTitle} en Wikiloc`;
    iframe.width = '600';
    iframe.height = '500';
    iframe.className = 'wikiloc-frame';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('data-wikiloc-frame', '');

    iframe.addEventListener('error', () => {
      status.textContent =
        'No se ha podido cargar el mapa de Wikiloc. Puedes abrir la ficha original con el enlace disponible.';
    });

    frameHost.replaceChildren(iframe);
    button.setAttribute('aria-expanded', 'true');
    button.disabled = true;
    button.textContent = 'Solicitud a Wikiloc enviada';
    status.textContent =
      'Se ha solicitado el mapa a Wikiloc. Si no aparece o está bloqueado, abre la ficha original con el enlace disponible.';
  });
}
