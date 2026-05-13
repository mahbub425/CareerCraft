export function sendPaymentStatusEmail(
  payload: { type: 'submitted' | 'approved' | 'rejected'; payment: Record<string, unknown>; expiresAt?: string },
  env?: Record<string, string | undefined>,
): Promise<unknown>;
