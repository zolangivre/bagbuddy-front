/**
 * Stripe.js, charge a la demande depuis js.stripe.com — jamais embarque dans le
 * bundle : Stripe exige qu'il soit servi par ses serveurs (PCI), et seuls les
 * acheteurs qui paient en ont besoin.
 *
 * Types minimaux, limites a ce que l'ecran de paiement appelle.
 */
export interface StripeElement {
  mount(target: HTMLElement): void;
  destroy(): void;
}

export interface StripeElements {
  create(type: 'payment', options?: Record<string, unknown>): StripeElement;
  submit(): Promise<{ error?: { message?: string } }>;
}

export interface StripeClient {
  elements(options: {
    clientSecret: string;
    appearance?: Record<string, unknown>;
    locale?: string;
  }): StripeElements;
  confirmPayment(options: {
    elements: StripeElements;
    confirmParams: { return_url: string };
    redirect: 'if_required';
  }): Promise<{ error?: { message?: string; type?: string }; paymentIntent?: { status: string } }>;
}

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeClient;
  }
}

const STRIPE_JS = 'https://js.stripe.com/v3/';
let loading: Promise<void> | null = null;

export function loadStripe(publishableKey: string): Promise<StripeClient> {
  loading ??= new Promise<void>((resolve, reject) => {
    if (window.Stripe) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = STRIPE_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('Stripe.js could not be loaded'));
    };
    document.head.appendChild(script);
  });
  return loading.then(() => {
    if (!window.Stripe) throw new Error('Stripe.js did not register');
    return window.Stripe(publishableKey);
  });
}
