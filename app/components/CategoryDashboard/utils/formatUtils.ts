export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}; 