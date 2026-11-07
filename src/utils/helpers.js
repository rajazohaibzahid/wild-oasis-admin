import { format, parseISO } from 'date-fns';

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatDate(value) {
  if (!value) return '—';
  if (value.includes('T')) return format(parseISO(getToday(new Date(value))), 'MMM d, yyyy');
  return format(parseISO(value), 'MMM d, yyyy');
}

export function getToday(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getPage(value) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
