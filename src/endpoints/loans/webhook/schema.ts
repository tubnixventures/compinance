export interface PawaPayWebhookPayload {
  depositId?: string;
  payoutId?: string;
  status: 'COMPLETED' | 'FAILED';
  amount?: number;
  currency?: string;
  failureReason?: string;
  transactionId?: string;
}
