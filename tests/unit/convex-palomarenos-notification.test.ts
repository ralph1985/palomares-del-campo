import { describe, expect, it } from 'vitest';
import { buildPalomarenoNotification } from '../../convex/palomarenos_notification_content';

const submission = {
  id: 'palomareno-test',
  displayName: 'Ana <López>',
  city: 'Madrid',
  country: 'España',
  story: 'Vuelvo al pueblo & hablo de <Palomares>.',
  contactEmail: 'ana@example.com',
};

describe('buildPalomarenoNotification', () => {
  it('builds an actionable subject and text notification', () => {
    const notification = buildPalomarenoNotification(submission);

    expect(notification.subject).toBe('Palomares: nueva propuesta de Palomareños por el mundo');
    expect(notification.text).toContain('ID: palomareno-test');
    expect(notification.text).toContain('Ana <López>');
    expect(notification.text).toContain('Madrid, España');
    expect(notification.text).toContain('Vuelvo al pueblo & hablo de <Palomares>.');
    expect(notification.text).toContain('ana@example.com');
    expect(notification.text).toContain('pendiente de moderación');
  });

  it('escapes user content in the HTML notification', () => {
    const notification = buildPalomarenoNotification(submission);

    expect(notification.html).toContain('Ana &lt;López&gt;');
    expect(notification.html).toContain('Vuelvo al pueblo &amp; hablo de &lt;Palomares&gt;.');
    expect(notification.html).not.toContain('<López>');
  });
});
