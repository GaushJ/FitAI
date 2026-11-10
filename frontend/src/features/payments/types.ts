export interface MoneyOut {
  amount: number;
  currency: string;
}

export interface OrderOut {
  id: string;
  provider: string;
  amount: MoneyOut;
  status: string;
  receipt: string | null;
  metadata: Record<string, string>;
  created_at: string;
  updated_at: string;
}

/** Everything Razorpay Checkout needs — handed straight to `new Razorpay({...})`. */
export interface CheckoutConfig {
  provider: string;
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: Record<string, string>;
  notes: Record<string, string>;
}

export interface CreateOrderResponse {
  order: OrderOut;
  checkout: CheckoutConfig;
}

export interface PaymentOut {
  id: string;
  order_id: string | null;
  subscription_id: string | null;
  amount: MoneyOut;
  amount_refunded: number;
  status: string;
  method: string | null;
  error_code: string | null;
  error_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConfirmCheckoutPayload {
  provider_order_id?: string | null;
  provider_subscription_id?: string | null;
  provider_payment_id: string;
  signature: string;
}

/** What Razorpay Checkout's `handler` callback receives on success. */
export interface RazorpayCheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
