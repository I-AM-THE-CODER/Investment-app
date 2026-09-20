/**
 * Currency and Number Formatting Utilities
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF ',
  JPY: '¥',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  CNY: '¥',
  SEK: 'kr ',
  NOK: 'kr ',
};

export function getCurrencySymbol(currency: string = 'USD'): string {
  if (!currency) return '$';
  const clean = currency.trim();
  const upper = clean.toUpperCase();
  if (CURRENCY_SYMBOLS[upper]) {
    return CURRENCY_SYMBOLS[upper];
  }
  // If user entered a custom symbol like € or £ or $
  if (clean.length <= 2 && !/^[a-zA-Z]+$/.test(clean)) {
    return clean;
  }
  return `${upper} `;
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  decimals: number = 2
): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '-';
  const sym = getCurrencySymbol(currency);
  return `${sym}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
