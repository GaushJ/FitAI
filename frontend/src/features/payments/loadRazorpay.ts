import type { CheckoutConfig, RazorpayCheckoutResult } from "@/features/payments/types";

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayOptions extends CheckoutConfig {
  handler: (result: RazorpayCheckoutResult) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Loads Razorpay's checkout.js once, caching the in-flight promise so
 * repeated calls (e.g. double-clicks) don't inject the script twice. */
function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load Razorpay checkout"));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/** Opens Razorpay Checkout; resolves with the result once the user completes
 * payment, or rejects if they dismiss the modal or the script fails to load. */
export async function openRazorpayCheckout(checkout: CheckoutConfig): Promise<RazorpayCheckoutResult> {
  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error("Razorpay checkout script did not load");

  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay!({
      ...checkout,
      handler: resolve,
      modal: { ondismiss: () => reject(new Error("dismissed")) },
    });
    razorpay.open();
  });
}
