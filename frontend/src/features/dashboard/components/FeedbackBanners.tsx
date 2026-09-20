import { Alert } from "@/components/atoms/Alert";

interface FeedbackBannersProps {
  /** Backend-unreachable notice; clears itself once a refresh succeeds. */
  connectionError: string;
  error: string;
  success: string;
  onDismissError: () => void;
  onDismissSuccess: () => void;
}

/** Page-level status messages shown above the dashboard grid. */
export function FeedbackBanners({
  connectionError,
  error,
  success,
  onDismissError,
  onDismissSuccess,
}: FeedbackBannersProps) {
  if (!connectionError && !error && !success) return null;

  return (
    <div className="space-y-3 lg:col-span-12">
      {connectionError && (
        <Alert tone="error" size="lg">
          {connectionError}
        </Alert>
      )}
      {error && (
        <Alert tone="error" size="lg" onDismiss={onDismissError}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert tone="success" size="lg" onDismiss={onDismissSuccess}>
          {success}
        </Alert>
      )}
    </div>
  );
}
