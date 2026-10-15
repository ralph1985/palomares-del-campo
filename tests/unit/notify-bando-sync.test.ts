import { describe, expect, it } from 'vitest';
import {
  buildNotificationHtml,
  buildNotificationText,
  escapeHtml,
} from '../../scripts/notify-bando-sync.ts';

describe('bando synchronization notification', () => {
  const bandos = [
    {
      title: 'Aviso <urgente>',
      url: 'https://example.com/bandos/123-aviso/',
    },
  ];

  it('escapes notification content and builds direct links', () => {
    expect(escapeHtml('A & B < C')).toBe('A &amp; B &lt; C');
    expect(
      buildNotificationText({
        commit: 'abc123',
        bandos,
        siteUrl: 'https://example.com',
      }),
    ).toContain('https://example.com/bandos/123-aviso/');

    const html = buildNotificationHtml({
      commit: 'abc123',
      bandos,
      siteUrl: 'https://example.com',
    });
    expect(html).toContain('Aviso &lt;urgente&gt;');
    expect(html).toContain('href="https://example.com/bandos/123-aviso/"');
    expect(html).toContain('Commit abc123');
  });
});
