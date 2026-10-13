export interface SetLoanLimitBody {
  userId: string;
  loanLimit: number; // KES allocation manually inserted by Compinance staff
  reason?: string;
}
