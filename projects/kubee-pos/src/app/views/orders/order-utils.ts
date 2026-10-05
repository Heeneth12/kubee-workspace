import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from './orders.models';

/** Device-made id that makes a create / payment safe to retry (server ignores a repeat). */
export function newClientRef(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Local date as yyyy-MM-dd (the API's date filter format). */
export function isoDate(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const ORDER_TYPES: OrderType[] = ['COUNTER', 'TAKEAWAY', 'DINE_IN', 'DELIVERY'];
export const ORDER_STATUSES: OrderStatus[] = ['OPEN', 'HELD', 'COMPLETED', 'CANCELLED'];
export const PAYMENT_STATUSES: PaymentStatus[] = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'];
export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'UPI', 'CARD', 'WALLET', 'BANK_TRANSFER', 'OTHER'];

/** "DINE_IN" -> "Dine in" */
export function label(value: string | null | undefined): string {
  if (!value) return '';
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function orderStatusClass(status: OrderStatus): string {
  switch (status) {
    case 'OPEN': return 'bg-blue-50 text-blue-700';
    case 'HELD': return 'bg-amber-50 text-amber-700';
    case 'COMPLETED': return 'bg-green-50 text-green-700';
    case 'CANCELLED': return 'bg-red-50 text-red-600';
  }
}

export function paymentStatusClass(status: PaymentStatus): string {
  switch (status) {
    case 'PAID': return 'text-green-700';
    case 'PARTIALLY_PAID': return 'text-amber-700';
    case 'UNPAID': return 'text-ez-secondary';
    default: return 'text-red-600';
  }
}
