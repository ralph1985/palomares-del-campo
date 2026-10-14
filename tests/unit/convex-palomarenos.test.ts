import { describe, expect, it } from 'vitest';
import {
  isSubmissionRateLimited,
  normalizePalomarenoSubmission,
} from '../../convex/palomarenos_validation';
import { toPublicPalomareno } from '../../convex/palomarenos';

const validInput = {
  displayName: '  Ana López  ',
  city: 'Madrid',
  country: 'España',
  story: 'Vivo fuera, pero vuelvo al pueblo siempre que puedo.',
  contactEmail: 'ana@example.com',
  consent: true,
};

describe('normalizePalomarenoSubmission', () => {
  it('normalizes text and creates a pending record without coordinates', () => {
    const result = normalizePalomarenoSubmission(validInput, 1_700_000_000_000);

    expect(result).toEqual({
      displayName: 'Ana López',
      city: 'Madrid',
      country: 'España',
      story: 'Vivo fuera, pero vuelvo al pueblo siempre que puedo.',
      contactEmail: 'ana@example.com',
      contactEmailKey: 'ana@example.com',
      consentGivenAt: 1_700_000_000_000,
      createdAt: 1_700_000_000_000,
      status: 'pending',
      notificationStatus: 'pending',
      creatorNotificationStatus: 'pending',
    });
  });

  it('normalizes the retained email and builds a private rate-limit key', () => {
    const result = normalizePalomarenoSubmission(
      { ...validInput, contactEmail: ' Ana@Example.COM ' },
      1_700_000_000_000,
    );

    expect(result.contactEmail).toBe('Ana@Example.COM');
    expect(result.contactEmailKey).toBe('ana@example.com');
  });

  it('rejects a filled honeypot server-side', () => {
    expect(() =>
      normalizePalomarenoSubmission(
        { ...validInput, website: 'https://bot.example' },
        1_700_000_000_000,
      ),
    ).toThrow('honeypot-filled');
  });

  it('rate-limits after the configured number of recent submissions', () => {
    expect(isSubmissionRateLimited(2)).toBe(false);
    expect(isSubmissionRateLimited(3)).toBe(true);
  });

  it('rejects a submission without consent', () => {
    expect(() =>
      normalizePalomarenoSubmission({ ...validInput, consent: false }, 1_700_000_000_000),
    ).toThrow('consent-required');
  });

  it('rejects empty required fields', () => {
    expect(() =>
      normalizePalomarenoSubmission({ ...validInput, displayName: '   ' }, 1_700_000_000_000),
    ).toThrow('display-name-required');

    expect(() =>
      normalizePalomarenoSubmission({ ...validInput, city: '' }, 1_700_000_000_000),
    ).toThrow('city-required');

    expect(() =>
      normalizePalomarenoSubmission({ ...validInput, country: '' }, 1_700_000_000_000),
    ).toThrow('country-required');

    expect(() =>
      normalizePalomarenoSubmission({ ...validInput, story: ' ' }, 1_700_000_000_000),
    ).toThrow('story-required');
  });

  it('rejects malformed or oversized contact data', () => {
    expect(() =>
      normalizePalomarenoSubmission(
        { ...validInput, contactEmail: 'not-an-email' },
        1_700_000_000_000,
      ),
    ).toThrow('contact-email-invalid');

    expect(() =>
      normalizePalomarenoSubmission(
        { ...validInput, displayName: 'x'.repeat(81) },
        1_700_000_000_000,
      ),
    ).toThrow('display-name-too-long');

    expect(() =>
      normalizePalomarenoSubmission({ ...validInput, story: 'x'.repeat(1201) }, 1_700_000_000_000),
    ).toThrow('story-too-long');
  });

  it('rejects client-provided coordinates', () => {
    expect(() =>
      normalizePalomarenoSubmission(
        { ...validInput, latitude: 40.4168, longitude: -3.7038 },
        1_700_000_000_000,
      ),
    ).toThrow('coordinates-not-accepted');
  });

  it('returns only public fields for an approved record', () => {
    const result = toPublicPalomareno({
      _id: 'palomareno-1',
      _creationTime: 1_700_000_000_000,
      displayName: 'Ana López',
      city: 'Madrid',
      country: 'España',
      latitude: 40.4168,
      longitude: -3.7038,
      story: 'Vivo fuera, pero vuelvo al pueblo siempre que puedo.',
      contactEmail: 'ana@example.com',
      consentGivenAt: 1_700_000_000_000,
      createdAt: 1_700_000_000_000,
      status: 'approved',
      notificationStatus: 'sent',
      reviewedAt: 1_700_000_100_000,
      reviewNote: 'Coordenadas revisadas.',
    });

    expect(result).toEqual({
      id: 'palomareno-1',
      displayName: 'Ana López',
      city: 'Madrid',
      country: 'España',
      latitude: 40.4168,
      longitude: -3.7038,
      story: 'Vivo fuera, pero vuelvo al pueblo siempre que puedo.',
    });
    expect(result).not.toHaveProperty('contactEmail');
    expect(result).not.toHaveProperty('reviewNote');
  });

  it('does not expose pending records or records without coordinates', () => {
    expect(
      toPublicPalomareno({
        _id: 'palomareno-pending',
        _creationTime: 1_700_000_000_000,
        displayName: 'Ana López',
        city: 'Madrid',
        country: 'España',
        story: 'Historia pendiente.',
        contactEmail: 'ana@example.com',
        consentGivenAt: 1_700_000_000_000,
        createdAt: 1_700_000_000_000,
        status: 'pending',
        notificationStatus: 'pending',
        creatorNotificationStatus: 'pending',
      }),
    ).toBeNull();

    expect(
      toPublicPalomareno({
        _id: 'palomareno-unlocated',
        _creationTime: 1_700_000_000_000,
        displayName: 'Ana López',
        city: 'Madrid',
        country: 'España',
        story: 'Historia sin posición.',
        contactEmail: 'ana@example.com',
        consentGivenAt: 1_700_000_000_000,
        createdAt: 1_700_000_000_000,
        status: 'approved',
        notificationStatus: 'sent',
      }),
    ).toBeNull();
  });
});
