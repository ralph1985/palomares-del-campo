export const MAX_DISPLAY_NAME_LENGTH = 80;
export const MAX_CITY_LENGTH = 80;
export const MAX_COUNTRY_LENGTH = 80;
export const MAX_STORY_LENGTH = 1200;
export const MAX_CONTACT_EMAIL_LENGTH = 254;
export const MAX_SUBMISSIONS_PER_EMAIL_WINDOW = 3;
export const SUBMISSION_RATE_WINDOW_MS = 60 * 60 * 1000;

export type PalomarenoSubmissionInput = {
  displayName: string;
  city: string;
  country: string;
  story: string;
  contactEmail: string;
  consent: boolean;
  website?: string;
  latitude?: number;
  longitude?: number;
};

export type PendingPalomareno = {
  displayName: string;
  city: string;
  country: string;
  story: string;
  contactEmail: string;
  contactEmailKey: string;
  consentGivenAt: number;
  createdAt: number;
  status: 'pending';
  notificationStatus: 'pending';
  creatorNotificationStatus: 'pending';
};

export const isSubmissionRateLimited = (recentSubmissionCount: number): boolean =>
  recentSubmissionCount >= MAX_SUBMISSIONS_PER_EMAIL_WINDOW;
const trimRequired = (value: string, errorCode: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(errorCode);
  return normalized;
};

const assertMaxLength = (value: string, maxLength: number, errorCode: string): void => {
  if ([...value].length > maxLength) throw new Error(errorCode);
};

export const normalizePalomarenoSubmission = (
  input: PalomarenoSubmissionInput,
  now: number,
): PendingPalomareno => {
  if (!Number.isFinite(now) || now < 0) throw new Error('timestamp-invalid');
  if (input.website?.trim()) throw new Error('honeypot-filled');
  if (!input.consent) throw new Error('consent-required');
  if (input.latitude !== undefined || input.longitude !== undefined) {
    throw new Error('coordinates-not-accepted');
  }

  const displayName = trimRequired(input.displayName, 'display-name-required');
  const city = trimRequired(input.city, 'city-required');
  const country = trimRequired(input.country, 'country-required');
  const story = trimRequired(input.story, 'story-required');
  const contactEmail = trimRequired(input.contactEmail, 'contact-email-required');
  const contactEmailKey = contactEmail.normalize('NFKC').toLocaleLowerCase('en-US');

  assertMaxLength(displayName, MAX_DISPLAY_NAME_LENGTH, 'display-name-too-long');
  assertMaxLength(city, MAX_CITY_LENGTH, 'city-too-long');
  assertMaxLength(country, MAX_COUNTRY_LENGTH, 'country-too-long');
  assertMaxLength(story, MAX_STORY_LENGTH, 'story-too-long');
  assertMaxLength(contactEmail, MAX_CONTACT_EMAIL_LENGTH, 'contact-email-too-long');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error('contact-email-invalid');
  }

  return {
    displayName,
    city,
    country,
    story,
    contactEmail,
    contactEmailKey,
    consentGivenAt: now,
    createdAt: now,
    status: 'pending',
    notificationStatus: 'pending',
    creatorNotificationStatus: 'pending',
  };
};
