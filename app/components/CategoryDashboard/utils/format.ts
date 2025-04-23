export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}; 