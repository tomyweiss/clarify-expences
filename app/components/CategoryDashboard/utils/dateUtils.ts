export const dateUtils = {
  formatDate: (date: Date | string): string => {
    const d = new Date(date);
    // Keep manual formatter lightweight to avoid adding runtime deps
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },
};