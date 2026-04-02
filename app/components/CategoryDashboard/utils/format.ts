export const getCurrency = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('clarify_currency') || 'ILS';
  }
  return 'ILS';
};

export const setCurrency = (currency: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('clarify_currency', currency);
  }
};

export const getCurrencySymbol = (currency?: string): string => {
  const current = currency || getCurrency();
  switch (current) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'ILS': return '₪';
    default: return '₪';
  }
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export const formatCurrencyILS = (num: number): string => {
  // Maintained for backward compatibility, although we should migrate callers to dynamic formatting
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};