export const DEFAULT_INTEREST_RATE = 0.08; // 8% student micro-credit rate
export const DEFAULT_FIRST_TIME_LOAN = 30; // Default first-time loan is always KES 30
export const MIN_FIRST_TIME_LOAN = 20; // First-time bounds: KES 20
export const MAX_FIRST_TIME_LOAN = 50; // First-time bounds: KES 50 max
export const MIN_LOAN_AMOUNT = 20; // Minimum platform loan: KES 20
export const MAX_PLATFORM_LOAN = 50000; // Platform upper ceiling: KES 50,000

export function calculateLoanTerms(amount: number, durationDays: number, rate: number = DEFAULT_INTEREST_RATE) {
  // Interest is 8%, with a minimum fee of KES 2 on micro loans
  const calculatedInterest = Math.round(amount * rate);
  const interest = Math.max(2, calculatedInterest);
  const totalPayable = amount + interest;
  const dueDate = Date.now() + durationDays * 24 * 3600 * 1000;
  return { interest, totalPayable, dueDate };
}

export function isFloatAdequate(
  companyFloatBalance: number,
  disbursementAmount: number,
  minReserve: number = 50000
): { adequate: boolean; shortfall?: number } {
  const remaining = companyFloatBalance - disbursementAmount;
  if (remaining < minReserve) {
    return { adequate: false, shortfall: minReserve - remaining };
  }
  return { adequate: true };
}
