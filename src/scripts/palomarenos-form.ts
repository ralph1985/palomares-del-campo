import { ConvexClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

export type PalomarenoFormInput = {
  displayName: string;
  city: string;
  country: string;
  story: string;
  contactEmail: string;
  consent: boolean;
  website: string;
};

type MutationClient = {
  mutation: (reference: unknown, args: Record<string, unknown>) => Promise<unknown>;
};

export type PalomarenoSubmissionResult = {
  status: 'submitted';
  submissionId: string;
  message: string;
};

export const submitPalomareno = async (
  client: MutationClient,
  input: PalomarenoFormInput,
): Promise<PalomarenoSubmissionResult> =>
  (await client.mutation(api.palomarenos.submit, {
    displayName: input.displayName,
    city: input.city,
    country: input.country,
    story: input.story,
    contactEmail: input.contactEmail,
    consent: input.consent,
    website: input.website,
  })) as PalomarenoSubmissionResult;

const getFieldValue = (formData: FormData, name: string): string =>
  String(formData.get(name) ?? '');

const getErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('contact-email-invalid')) return 'Escribe un email válido.';
  if (message.includes('consent-required'))
    return 'Necesitamos tu consentimiento para revisar la propuesta.';
  if (message.includes('coordinates-not-accepted'))
    return 'La ubicación se asigna durante la revisión.';
  if (message.includes('submission-rate-limited'))
    return 'Espera un poco antes de enviar otra propuesta.';
  return 'No se ha podido enviar la propuesta. Inténtalo de nuevo más tarde.';
};

const bindForm = (form: HTMLFormElement): void => {
  const convexUrl = form.dataset.convexUrl?.trim();
  const statusElement = form.querySelector<HTMLElement>('[data-form-status]');
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  if (!statusElement || !submitButton) return;
  if (!convexUrl) {
    submitButton.disabled = true;
    statusElement.textContent =
      'El formulario estará disponible cuando se configure el servicio de datos.';
    return;
  }

  const client = new ConvexClient(convexUrl);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;

    const formData = new FormData(form);

    submitButton.disabled = true;
    statusElement.dataset.state = 'submitting';
    statusElement.textContent = 'Enviando propuesta…';

    try {
      const result = await submitPalomareno(client, {
        displayName: getFieldValue(formData, 'displayName'),
        city: getFieldValue(formData, 'city'),
        country: getFieldValue(formData, 'country'),
        story: getFieldValue(formData, 'story'),
        contactEmail: getFieldValue(formData, 'contactEmail'),
        consent: formData.get('consent') === 'on',
        website: getFieldValue(formData, 'website'),
      });
      statusElement.dataset.state = 'success';
      statusElement.textContent = result.message;
      form.reset();
    } catch (error) {
      statusElement.dataset.state = 'error';
      statusElement.textContent = getErrorMessage(error);
    } finally {
      submitButton.disabled = false;
    }
  });
};

if (typeof document !== 'undefined') {
  document.querySelectorAll<HTMLFormElement>('[data-palomarenos-form]').forEach(bindForm);
}
