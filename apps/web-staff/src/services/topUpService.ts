import { getApiBaseUrl } from './api';

export interface TopUpPaymentClaim {
  userId: string;
  topUpAmountNgn: number;
  serviceFeeNgn: number;
  paymentReference: string;
  accountNumber?: string;
}

export const submitTopUpPaymentClaim = async (payload: TopUpPaymentClaim) => {
  if (!payload.userId) {
    throw new Error('User ID is missing. Please re-authenticate or complete onboarding.');
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/topup/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error) throw new Error(parsed.error);
    } catch (e: any) {
      if (e.message && !e.message.startsWith('Unexpected token') && !e.message.startsWith('JSON.parse')) {
        throw e;
      }
    }
    throw new Error(`Server returned ${response.status}: ${errorText || 'Empty response'}`);
  }

  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result;
};
