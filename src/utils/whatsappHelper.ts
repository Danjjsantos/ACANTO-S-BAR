import { Order, StoreSettings } from '../types';

/**
 * Replaces placeholders in a WhatsApp template string with actual order and store data
 */
export function formatWhatsAppTemplate(
  template: string,
  order: Partial<Order>,
  settings: StoreSettings,
  driverName?: string
): string {
  if (!template) return '';

  const customerName = order.customer?.name || 'Cliente';
  const orderCode = order.code || '#0000';
  const orderTotal = order.total ? `R$ ${order.total.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
  const storeName = settings.name || 'Nossa Loja';
  const pixKey = settings.pixKey || '';
  const motoboy = driverName || 'nosso entregador';

  return template
    .replace(/\[NOME\]/g, customerName)
    .replace(/\[CODIGO\]/g, orderCode)
    .replace(/\[VALOR\]/g, orderTotal)
    .replace(/\[LOJA\]/g, storeName)
    .replace(/\[MOTOBOY\]/g, motoboy)
    .replace(/\[PIX\]/g, pixKey);
}

/**
 * Cleans phone number string to numbers only (E.164 compatible)
 */
export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  // Strip leading zeros (e.g. 011999998888 -> 11999998888)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.replace(/^0+/, '');
  }
  // If it's a Brazilian 10 or 11 digit number without country code, prepend 55
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = `55${cleaned}`;
  }
  return cleaned;
}

/**
 * Builds a direct wa.me link for sending a message
 */
export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Generates a full formatted order summary text for WhatsApp
 */
export function generateOrderSummaryText(order: Order, settings: StoreSettings): string {
  const storeName = settings.name || "BAR DO ACANTO";
  const customerName = order.customer?.name || 'Cliente';
  const orderCode = order.code || `#${order.id}`;

  let itemsText = '';
  if (order.items && order.items.length > 0) {
    itemsText = order.items
      .map((item) => {
        let line = `• *${item.quantity}x ${item.name}* - R$ ${((item.unitTotal || item.price) * item.quantity).toFixed(2).replace('.', ',')}`;
        if (item.selectedExtras && item.selectedExtras.length > 0) {
          const extrasStr = item.selectedExtras.map((e) => e.optionName).join(', ');
          line += `\n   └ _Adicionais: ${extrasStr}_`;
        }
        if (item.observations) {
          line += `\n   └ _Obs: ${item.observations}_`;
        }
        return line;
      })
      .join('\n');
  }

  const subtotalStr = (order.subtotal || 0).toFixed(2).replace('.', ',');
  const feeStr = (order.deliveryFee || 0).toFixed(2).replace('.', ',');
  const totalStr = (order.total || 0).toFixed(2).replace('.', ',');

  let paymentLabel = (order.paymentMethod || 'pix').toUpperCase().replace('_', ' ');
  if (order.paymentMethod === 'pg') paymentLabel = '📌 PG (A RECEBER)';
  if (order.paymentMethod === 'pix') paymentLabel = '⚡ PIX';
  if (order.paymentMethod === 'cartao_credito') paymentLabel = '💳 CARTÃO CRÉDITO';
  if (order.paymentMethod === 'cartao_debito') paymentLabel = '💳 CARTÃO DÉBITO';
  if (order.paymentMethod === 'dinheiro') paymentLabel = '💵 DINHEIRO';

  const payStatusStr = order.paymentStatus === 'pago' ? '✅ PAGO' : '⏳ PENDENTE';

  let typeLabel = '🛵 Delivery';
  if (order.type === 'pdv') typeLabel = '🏪 Balcão / PDV';
  if (order.type === 'mesa') typeLabel = `🍽️ Salão (Mesa ${order.tableNumber || '1'})`;
  if (order.type === 'retirada') typeLabel = '🛍️ Retirada no Balcão';

  let msg = `🛍️ *NOVO PEDIDO ${orderCode}* - *${storeName}*\n\n`;
  msg += `👤 *Cliente:* ${customerName}\n`;
  if (order.customer?.phone) msg += `📱 *Telefone:* ${order.customer.phone}\n`;
  msg += `📍 *Tipo:* ${typeLabel}\n`;
  if (order.customer?.address) msg += `🏠 *Endereço:* ${order.customer.address}\n`;
  if (order.tableNumber) msg += `🪑 *Mesa:* ${order.tableNumber}\n`;

  msg += `\n📋 *ITENS DO PEDIDO:*\n${itemsText}\n\n`;

  if (order.deliveryFee && order.deliveryFee > 0) {
    msg += `💵 Subtotal: R$ ${subtotalStr}\n`;
    msg += `🛵 Taxa Entrega: R$ ${feeStr}\n`;
  }
  msg += `💰 *TOTAL:* *R$ ${totalStr}*\n\n`;

  msg += `💳 *Forma de Pagamento:* ${paymentLabel} (${payStatusStr})\n`;

  if (order.notes) {
    msg += `📝 *Observações:* ${order.notes}\n`;
  }

  msg += `\nAgradecemos a preferência! Qualquer dúvida responda por aqui. 😊`;

  return msg;
}

/**
 * Returns the distinct public cardápio URL for customer access
 */
export function getPublicCardapioUrl(settings?: StoreSettings): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=public`;
  }
  const slug = (settings?.menuSlug || 'acantosbar').toLowerCase().trim();
  return `https://${slug}.fazopedido.com?view=public`;
}

/**
 * Returns the store administration management panel URL
 */
export function getAdminStoreUrl(settings?: StoreSettings): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=admin`;
  }
  const slug = (settings?.menuSlug || 'acantosbar').toLowerCase().trim();
  return `https://${slug}.fazopedido.com?view=admin`;
}

/**
 * Generates status notification message based on order status and store templates
 */
export function generateStatusNotificationText(
  order: Order,
  settings: StoreSettings,
  driverName?: string
): string {
  const status = order.status;

  if (status === 'confirmado' && settings.orderConfirmedMsg) {
    return formatWhatsAppTemplate(settings.orderConfirmedMsg, order, settings, driverName);
  }

  if (status === 'entregue' && settings.orderDispatchedMsg) {
    return formatWhatsAppTemplate(settings.orderDispatchedMsg, order, settings, driverName);
  }

  if (status === 'pronto_para_retirada' && settings.orderReadyMsg) {
    return formatWhatsAppTemplate(settings.orderReadyMsg, order, settings, driverName);
  }

  // Fallback status text
  const statusLabels: Record<string, string> = {
    confirmado: '🔔 Confirmado e em Preparo',
    pronto_para_retirada: '✅ Pronto para Retirada no Balcão',
    entregue: '🎉 Entregue com Sucesso',
    cancelado: '❌ Cancelado',
  };

  const statusLabel = statusLabels[status] || status;
  const storeName = settings.name || "BAR DO ACANTO";
  const customerName = order.customer?.name || 'Cliente';

  return (
    `Olá *${customerName}*! 👋\n\n` +
    `Atualização do seu pedido *${order.code || `#${order.id}`}* em *${storeName}*:\n` +
    `Status: *${statusLabel}*\n` +
    `Total: *R$ ${(order.total || 0).toFixed(2).replace('.', ',')}*\n\n` +
    `Estamos à disposição no WhatsApp para qualquer dúvida! 😊`
  );
}

/**
 * Direct link helper that opens WhatsApp safely
 */
export function openWhatsAppLink(phone: string, text: string): void {
  const link = buildWhatsAppLink(phone, text);
  window.open(link, '_blank');
}
