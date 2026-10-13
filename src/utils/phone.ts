/**
 * Validates and normalizes Kenya M-Pesa phone numbers.
 * Supports:
 * - 07XXXXXXXX or 01XXXXXXXX (10 digits)
 * - 2547XXXXXXXX or 2541XXXXXXXX (12 digits)
 * - +2547XXXXXXXX or +2541XXXXXXXX
 * Returns standard international format: +254XXXXXXXXX
 */
export function normalizeKenyaPhone(input: string): { valid: boolean; phone: string; error?: string } {
  if (!input) return { valid: false, phone: '', error: 'Phone number is required' };
  
  let cleaned = input.trim().replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Check 07... or 01...
  if (/^0[71]\d{8}$/.test(cleaned)) {
    return { valid: true, phone: `+254${cleaned.substring(1)}` };
  }

  // Check 254[71]...
  if (/^254[71]\d{8}$/.test(cleaned)) {
    return { valid: true, phone: `+${cleaned}` };
  }

  return {
    valid: false,
    phone: input,
    error: 'Invalid Kenya M-Pesa phone number. Must start with 07, 01, 2547, or 2541 (9 subsequent digits)',
  };
}
