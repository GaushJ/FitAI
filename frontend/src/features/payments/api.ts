import { request } from "@/lib/api/client";
import type { ConfirmCheckoutPayload, CreateOrderResponse, PaymentOut } from "@/features/payments/types";

const BASE = "/api/payments";

/** Price is always decided server-side (routers/payments.py's PRICES table) —
 * `item` just names what's being bought. */
export const createOrder = (item: string) =>
  request<CreateOrderResponse>(`${BASE}/orders`, {
    method: "POST",
    json: { metadata: { item } },
    errorMessage: "Could not start checkout",
  });

export const confirmPayment = (payload: ConfirmCheckoutPayload) =>
  request<PaymentOut>(`${BASE}/confirm`, {
    method: "POST",
    json: payload,
    errorMessage: "Could not confirm payment",
  });
