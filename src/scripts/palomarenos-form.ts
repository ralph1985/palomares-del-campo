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
  turnstileToken: string;
};

type ActionClient = Pick<ConvexClient, 'action'>;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __PALOMARENOS_TURNSTILE_TEST__?: boolean;
    __PALOMARENOS_FORM_TEST__?: SubmissionTestHook;
  }
}

export type PalomarenoSubmissionResult = {
  status: 'submitted';
  submissionId: string;
  message: string;
};

type SubmissionTestHook = (input: PalomarenoFormInput) => Promise<PalomarenoSubmissionResult>;

export const submitPalomareno = (
  client: ActionClient,
  input: PalomarenoFormInput,
): Promise<PalomarenoSubmissionResult> =>
  client.action(api.palomarenos.submitWithTurnstile, {
    displayName: input.displayName,
    city: input.city,
    country: input.country,
    story: input.story,
    contactEmail: input.contactEmail,
    consent: input.consent,
    website: input.website,
    turnstileToken: input.turnstileToken,
  });

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
  if (message.includes('turnstile-not-configured'))
    return 'La protección anti-bots todavía no está configurada.';
  if (message.includes('turnstile-token-missing')) return 'Completa la verificación anti-bots.';
  if (message.includes('turnstile-invalid'))
    return 'No se ha podido verificar la protección anti-bots.';
  if (message.includes('turnstile-provider-unavailable'))
    return 'La protección anti-bots no está disponible. Inténtalo más tarde.';
  return 'No se ha podido enviar la propuesta. Inténtalo de nuevo más tarde.';
};

const loadTurnstile = (): Promise<TurnstileApi> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('turnstile-unavailable'));
  if (window.turnstile) return Promise.resolve(window.turnstile);

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('#cloudflare-turnstile');
    const script = existingScript ?? document.createElement('script');
    const onLoad = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('turnstile-unavailable'));
    };
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', () => reject(new Error('turnstile-unavailable')), {
      once: true,
    });

    if (!existingScript) {
      script.id = 'cloudflare-turnstile';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
};

const bindForm = (form: HTMLFormElement): void => {
  const convexUrl = form.dataset.convexUrl?.trim();
  const siteKey = form.dataset.turnstileSiteKey?.trim();
  const allowedHostnames = (form.dataset.turnstileHostnames ?? '')
    .split(',')
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);
  const statusElement = form.querySelector<HTMLElement>('[data-form-status]');
  const turnstileStatusElement = form.querySelector<HTMLElement>('[data-turnstile-status]');
  const turnstileContainer = form.querySelector<HTMLElement>('[data-turnstile-widget]');
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const testSubmit = import.meta.env.DEV ? window.__PALOMARENOS_FORM_TEST__ : undefined;

  if (!statusElement || !submitButton) return;
  if (!convexUrl && !testSubmit) {
    submitButton.disabled = true;
    statusElement.textContent =
      'El formulario estará disponible cuando se configure el servicio de datos.';
    return;
  }
  if (!siteKey || !turnstileContainer) {
    submitButton.disabled = true;
    statusElement.textContent =
      'El formulario estará disponible cuando se configure la protección anti-bots.';
    return;
  }
  const isTestWidget = import.meta.env.DEV && Boolean(window.__PALOMARENOS_TURNSTILE_TEST__);
  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  if (!isTestWidget && allowedHostnames.length > 0 && !allowedHostnames.includes(currentHostname)) {
    submitButton.disabled = true;
    statusElement.textContent =
      'Abre esta página mediante el dominio público para enviar una propuesta.';
    if (turnstileStatusElement) {
      turnstileStatusElement.dataset.state = 'error';
      turnstileStatusElement.textContent =
        'La protección anti-bots está disponible en el dominio público.';
    }
    return;
  }

  const client = testSubmit || !convexUrl ? undefined : new ConvexClient(convexUrl);
  let turnstileToken = '';
  let widgetId: string | undefined;

  const setTurnstileState = (message: string, state: 'loading' | 'ready' | 'error'): void => {
    if (turnstileStatusElement) {
      turnstileStatusElement.dataset.state = state;
      turnstileStatusElement.textContent = message;
    }
  };

  const resetTurnstile = (): void => {
    turnstileToken = '';
    submitButton.disabled = true;
    if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
  };

  setTurnstileState('Cargando protección anti-bots…', 'loading');
  void loadTurnstile()
    .then((turnstile) => {
      widgetId = turnstile.render(turnstileContainer, {
        sitekey: siteKey,
        action: 'submit-story',
        callback: (token) => {
          turnstileToken = token;
          submitButton.disabled = false;
          setTurnstileState('Protección anti-bots verificada.', 'ready');
        },
        'expired-callback': () => {
          resetTurnstile();
          setTurnstileState('La verificación ha caducado. Vuelve a intentarlo.', 'error');
        },
        'error-callback': () => {
          turnstileToken = '';
          submitButton.disabled = true;
          setTurnstileState('No se ha podido cargar la protección anti-bots.', 'error');
        },
      });
    })
    .catch(() => {
      submitButton.disabled = true;
      setTurnstileState('No se ha podido cargar la protección anti-bots.', 'error');
      statusElement.dataset.state = 'error';
      statusElement.textContent =
        'La protección anti-bots no está disponible. Inténtalo más tarde.';
    });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;

    const formData = new FormData(form);
    if (!turnstileToken) {
      statusElement.dataset.state = 'error';
      statusElement.textContent = 'Completa la verificación anti-bots.';
      return;
    }

    submitButton.disabled = true;
    statusElement.dataset.state = 'submitting';
    statusElement.textContent = 'Enviando propuesta…';

    try {
      const input: PalomarenoFormInput = {
        displayName: getFieldValue(formData, 'displayName'),
        city: getFieldValue(formData, 'city'),
        country: getFieldValue(formData, 'country'),
        story: getFieldValue(formData, 'story'),
        contactEmail: getFieldValue(formData, 'contactEmail'),
        consent: formData.get('consent') === 'on',
        website: getFieldValue(formData, 'website'),
        turnstileToken,
      };
      const result = testSubmit
        ? await testSubmit(input)
        : client
          ? await submitPalomareno(client, input)
          : (() => {
              throw new Error('convex-client-unavailable');
            })();
      statusElement.dataset.state = 'success';
      statusElement.textContent = result.message;
      form.reset();
      resetTurnstile();
      setTurnstileState('Verificación lista para otro envío.', 'loading');
    } catch (error) {
      statusElement.dataset.state = 'error';
      statusElement.textContent = getErrorMessage(error);
      submitButton.disabled = !turnstileToken;
    }
  });
};

if (typeof document !== 'undefined') {
  document.querySelectorAll<HTMLFormElement>('[data-palomarenos-form]').forEach(bindForm);
}
