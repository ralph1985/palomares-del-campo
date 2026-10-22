import { getDateInTimeZone } from '../data/agenda-utils';

const PAGE_SIZE = 6;
const FILTER_PARAMS = ['q', 'kind', 'category', 'year'] as const;
const TIME_ZONE = 'Europe/Madrid';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function initAgenda(): void {
  const root = document.querySelector<HTMLElement>('[data-agenda]');
  const form = root?.querySelector<HTMLFormElement>('[data-agenda-filters]');
  if (!root || !form) return;

  const controls = {
    q: form.querySelector<HTMLInputElement>('[name="q"]'),
    kind: form.querySelector<HTMLSelectElement>('[name="kind"]'),
    category: form.querySelector<HTMLSelectElement>('[name="category"]'),
    year: form.querySelector<HTMLSelectElement>('[name="year"]'),
  };
  const lists = {
    upcoming: root.querySelector<HTMLElement>('[data-agenda-list="upcoming"]'),
    past: root.querySelector<HTMLElement>('[data-agenda-list="past"]'),
    cancelled: root.querySelector<HTMLElement>('[data-agenda-list="cancelled"]'),
  };
  const today = getDateInTimeZone(new Date(), TIME_ZONE);
  for (const card of root.querySelectorAll<HTMLElement>('[data-agenda-card]')) {
    const endDate = card.dataset.endDate ?? card.dataset.startDate ?? '';
    const destination =
      card.dataset.status === 'cancelled'
        ? lists.cancelled
        : endDate < today
          ? lists.past
          : lists.upcoming;
    destination?.append(card);
  }
  const status = root.querySelector<HTMLElement>('[data-agenda-results]');
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-agenda-card]'));
  const groups = (['upcoming', 'past', 'cancelled'] as const).map((name) => {
    const section = root.querySelector<HTMLElement>(`[data-agenda-section="${name}"]`);
    const list = section?.querySelector<HTMLElement>(`[data-agenda-list="${name}"]`);
    const pagination = section?.querySelector<HTMLElement>('[data-pagination]');
    const previous = pagination?.querySelector<HTMLButtonElement>('[data-page-previous]');
    const next = pagination?.querySelector<HTMLButtonElement>('[data-page-next]');
    const label = pagination?.querySelector<HTMLElement>('[data-page-label]');
    return { name, section, list, pagination, previous, next, label, page: 1 };
  });

  const params = new URLSearchParams(window.location.search);
  for (const key of FILTER_PARAMS) {
    const control = controls[key];
    const value = params.get(key);
    if (!control || !value) continue;
    if (control instanceof HTMLInputElement) {
      control.value = value;
    } else if (Array.from(control.options).some((option) => option.value === value)) {
      control.value = value;
    }
  }

  const syncUrl = () => {
    const nextParams = new URLSearchParams(window.location.search);
    for (const key of FILTER_PARAMS) {
      const value = controls[key]?.value.trim() ?? '';
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    }
    for (const group of groups) {
      const pageParam = `${group.name}Page`;
      if (group.page > 1) nextParams.set(pageParam, String(group.page));
      else nextParams.delete(pageParam);
    }
    const query = nextParams.toString();
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    );
  };

  const matches = (card: HTMLElement): boolean => {
    const query = normalize(controls.q?.value ?? '');
    const searchable = normalize(card.textContent ?? '');
    return (
      (!query || query.split(' ').every((token) => searchable.includes(token))) &&
      (!controls.kind?.value || card.dataset.kind === controls.kind.value) &&
      (!controls.category?.value || card.dataset.category === controls.category.value) &&
      (!controls.year?.value || card.dataset.year === controls.year.value)
    );
  };

  const sortGroupCards = (
    groupCards: HTMLElement[],
    name: (typeof groups)[number]['name'],
  ): HTMLElement[] =>
    groupCards.sort((left, right) => {
      const leftDate = left.dataset.startDate ?? '';
      const rightDate = right.dataset.startDate ?? '';
      return name === 'upcoming'
        ? leftDate.localeCompare(rightDate)
        : rightDate.localeCompare(leftDate);
    });

  const update = (announce = true) => {
    for (const group of groups) group.page = 1;
    const visibleCards = cards.filter(matches);
    for (const card of cards) card.hidden = true;

    for (const group of groups) {
      const groupCards = sortGroupCards(
        visibleCards.filter((card) => card.closest('[data-agenda-list]') === group.list),
        group.name,
      );
      const pageCount = Math.max(1, Math.ceil(groupCards.length / PAGE_SIZE));
      const start = (group.page - 1) * PAGE_SIZE;
      for (const card of groupCards.slice(start, start + PAGE_SIZE)) card.hidden = false;

      if (group.section && group.name !== 'upcoming')
        group.section.hidden = groupCards.length === 0;
      if (group.pagination) {
        group.pagination.hidden = groupCards.length <= PAGE_SIZE;
        if (group.previous) group.previous.disabled = group.page <= 1;
        if (group.next) group.next.disabled = group.page >= pageCount;
        if (group.label) group.label.textContent = `Página ${group.page} de ${pageCount}`;
      }

      const counter = root.querySelector<HTMLElement>(`[data-agenda-count="${group.name}"]`);
      if (counter) counter.textContent = String(groupCards.length);
      if (group.name === 'upcoming') {
        const empty = root.querySelector<HTMLElement>('[data-agenda-empty-upcoming]');
        if (empty) empty.hidden = groupCards.length > 0;
      }

      if (group.name !== 'upcoming' && group.section instanceof HTMLDetailsElement) {
        const hasActiveFilter = FILTER_PARAMS.some((key) => Boolean(controls[key]?.value));
        if (hasActiveFilter && groupCards.length > 0) group.section.open = true;
        if (!hasActiveFilter) group.section.open = false;
      }
    }

    if (status && announce) {
      const count = visibleCards.length;
      status.textContent = count === 1 ? '1 fecha encontrada.' : `${count} fechas encontradas.`;
    }
    syncUrl();
  };

  for (const control of Object.values(controls)) {
    control?.addEventListener('input', () => update());
    control?.addEventListener('change', () => update());
  }
  form.addEventListener('submit', (event) => event.preventDefault());
  form.querySelector<HTMLButtonElement>('[data-agenda-clear]')?.addEventListener('click', () => {
    form.reset();
    update();
    controls.q?.focus();
  });

  for (const group of groups) {
    group.previous?.addEventListener('click', () => {
      if (group.page <= 1) return;
      group.page -= 1;
      renderPage(group.name);
    });
    group.next?.addEventListener('click', () => {
      const count = cards.filter(
        (card) => card.closest('[data-agenda-list]') === group.list && matches(card),
      ).length;
      if (group.page >= Math.ceil(count / PAGE_SIZE)) return;
      group.page += 1;
      renderPage(group.name);
    });
  }

  function renderPage(name: (typeof groups)[number]['name']): void {
    const group = groups.find((entry) => entry.name === name);
    if (!group || !group.list) return;
    const groupCards = sortGroupCards(
      cards.filter((card) => card.closest('[data-agenda-list]') === group.list && matches(card)),
      group.name,
    );
    const pageCount = Math.max(1, Math.ceil(groupCards.length / PAGE_SIZE));
    group.page = Math.min(group.page, pageCount);
    if (group.section instanceof HTMLDetailsElement) group.section.open = true;
    const start = (group.page - 1) * PAGE_SIZE;
    for (const card of cards) {
      if (card.closest('[data-agenda-list]') === group.list) card.hidden = true;
    }
    for (const card of groupCards.slice(start, start + PAGE_SIZE)) card.hidden = false;
    if (group.previous) group.previous.disabled = group.page <= 1;
    if (group.next) group.next.disabled = group.page >= pageCount;
    if (group.label) group.label.textContent = `Página ${group.page} de ${pageCount}`;
    if (status)
      status.textContent = `Página ${group.page} de ${pageCount}. ${groupCards.length} fechas en esta sección.`;
    syncUrl();
  }

  update(false);
  for (const group of groups) {
    const page = Number(params.get(`${group.name}Page`));
    if (Number.isSafeInteger(page) && page > 1 && group.list) {
      group.page = page;
      renderPage(group.name);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAgenda, { once: true });
} else {
  initAgenda();
}
