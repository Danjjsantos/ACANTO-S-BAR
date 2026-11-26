import { BasePaymentMethod, Order, PaymentMethod } from '../types';

export function getOrderPaidAmount(order: Pick<Order, 'total' | 'paymentMethod' | 'paymentStatus' | 'paidAmount'>): number {
  const total = Math.max(0, Number(order.total) || 0);
  if (order.paymentStatus === 'pago') {
    return total;
  }
  if (order.paymentMethod === 'parcial') {
    return Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
  }
  if (order.paymentMethod === 'pg') {
    return Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
  }
  if (order.paidAmount !== undefined) {
    return Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
  }
  return total;
}

export function getOrderRemainingAmount(order: Pick<Order, 'total' | 'paymentMethod' | 'paymentStatus' | 'paidAmount' | 'remainingAmount'>): number {
  const total = Math.max(0, Number(order.total) || 0);
  if (order.paymentStatus === 'pago') {
    return 0;
  }
  if (order.paymentMethod === 'parcial') {
    const paid = Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
    const rem = order.remainingAmount !== undefined ? Number(order.remainingAmount) : total - paid;
    return Math.max(0, +rem.toFixed(2));
  }
  if (order.paymentMethod === 'pg') {
    const paid = Math.min(total, Math.max(0, Number(order.paidAmount) || 0));
    return Math.max(0, +(total - paid).toFixed(2));
  }
  return 0;
}

export function hasOpenReceivableBalance(order: Pick<Order, 'total' | 'paymentMethod' | 'paymentStatus' | 'paidAmount' | 'remainingAmount'>): boolean {
  if (order.paymentStatus === 'pago') return false;
  if (order.paymentMethod === 'pg') return true;
  if (order.paymentMethod === 'parcial') {
    return getOrderRemainingAmount(order) > 0.009;
  }
  return false;
}

export function formatPaymentMethodLabel(method?: PaymentMethod | string): string {
  switch (method) {
    case 'pix':
      return 'PIX';
    case 'cartao_credito':
      return 'Cartão Crédito';
    case 'cartao_debito':
      return 'Cartão Débito';
    case 'dinheiro':
      return 'Dinheiro';
    case 'pg':
      return 'PG (A Receber)';
    case 'parcial':
      return 'Pagamento Parcial';
    default:
      return String(method || 'pix').replace('_', ' ').toUpperCase();
  }
}

export const BASE_PAYMENT_OPTIONS: { id: BasePaymentMethod; label: string; shortLabel: string; desc: string }[] = [
  { id: 'pix', label: '⚡ Pix', shortLabel: 'PIX', desc: 'Transferência instantânea' },
  { id: 'cartao_credito', label: '💳 Cartão Crédito', shortLabel: 'Crédito', desc: 'Maquininha balcão' },
  { id: 'cartao_debito', label: '💳 Cartão Débito', shortLabel: 'Débito', desc: 'Maquininha balcão' },
  { id: 'dinheiro', label: '💵 Dinheiro', shortLabel: 'Dinheiro', desc: 'Pagamento em espécie' },
];
