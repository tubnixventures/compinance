export interface PawaPayDepositWebhookPayload {
  depositId: string;
  status: 'COMPLETED' | 'FAILED' | 'SUBMITTED';
  amount: number;
  currency: string;
  payer?: {
    type: string;
    address: {
      value: string;
    };
  };
  correspondent?: string;
  statementDescription?: string;
  financialTransactionId?: string;
  failureReason?: string;
  created?: string;
}

export interface PawaPayPayoutWebhookPayload {
  payoutId: string;
  status: 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  recipient?: {
    type: string;
    address: {
      value: string;
    };
  };
  correspondent?: string;
  financialTransactionId?: string;
  failureReason?: string;
  created?: string;
}

export interface PawaPayRefundWebhookPayload {
  refundId: string;
  originalDepositId: string;
  status: 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  reason?: string;
  created?: string;
}

export interface PawaPayFloatNotificationPayload {
  notificationId: string;
  accountNumber?: string;
  balanceKes: number;
  currency: string;
  alertLevel: 'NORMAL' | 'LOW_BALANCE' | 'CRITICAL';
  minThresholdKes?: number;
  message?: string;
  timestamp?: string;
}
