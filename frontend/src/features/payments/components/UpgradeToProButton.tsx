"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Notifier } from "@/hooks/useFeedback";
import { confirmPayment, createOrder } from "@/features/payments/api";
import { openRazorpayCheckout } from "@/features/payments/loadRazorpay";

interface UpgradeToProButtonProps {
  notify: Notifier;
  /** Called after a successful confirm — actual `is_pro` lands moments later via
   * the webhook, so this is just a prompt to refetch and show the new state. */
  onConfirmed: () => void;
}

export function UpgradeToProButton({ notify, onConfirmed }: UpgradeToProButtonProps) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    notify.clear();
    setPending(true);
    try {
      const { checkout } = await createOrder("pro_unlock");
      const result = await openRazorpayCheckout(checkout);
      const payment = await confirmPayment({
        provider_order_id: result.razorpay_order_id,
        provider_payment_id: result.razorpay_payment_id,
        signature: result.razorpay_signature,
      });
      if (payment.status === "captured") {
        notify.success("Payment received — your Pro unlock is on its way!");
      } else {
        notify.success(`Payment ${payment.status} — we'll confirm shortly.`);
      }
      onConfirmed();
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "dismissed") {
        notify.error(error instanceof Error ? error.message : "Something went wrong.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      size="sm"
      icon={<Sparkles />}
      loading={pending}
      loadingText="Opening checkout..."
      title="Upgrade to GetFitBro Pro"
      onClick={handleClick}
    >
      Upgrade to Pro
    </Button>
  );
}
