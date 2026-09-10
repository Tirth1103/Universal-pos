import { formatINR } from './formatters';

/**
 * Generates a beautifully formatted plain-text invoice for WhatsApp.
 * Uses WhatsApp-compatible formatting: *bold*, _italic_, ~strikethrough~
 */
export const generateWhatsAppInvoice = (order) => {
  if (!order) return '';

  const storeTitle = order.storeName || 'RETAIL STORE';
  const branch = order.storeBranch || '';

  const date = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const customerName = order.customer?.name || 'Walk-in Guest';
  const cashier = order.cashierName || 'Register #01';

  // Build items list
  const itemLines = (order.items || []).map((item, idx) => {
    let attrStr = '';
    if (Array.isArray(item.attributes) && item.attributes.length > 0) {
      attrStr = ` (${item.attributes.map(a => `${a.name}: ${a.value}`).join(', ')})`;
    } else if (item.size || item.color) {
      const variant = [item.size, item.color].filter(Boolean).join(' / ');
      if (variant) attrStr = ` (${variant})`;
    }
    const itemTitle = item.title || item.productTitle || 'Item';
    return `${idx + 1}. ${itemTitle}${attrStr} × ${item.quantity}\n   ${formatINR(item.itemTotal)}`;
  }).join('\n');

  // Build the invoice message
  let msg = '';
  msg += `🧾 *${storeTitle.toUpperCase()} — TAX INVOICE*\n`;
  if (branch) {
    msg += `📍 Branch: ${branch}\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 Invoice: *${order.invoiceNumber}*\n`;
  msg += `📅 Date: ${date}\n`;
  msg += `👤 Customer: ${customerName}\n`;
  msg += `💼 Cashier: ${cashier}\n`;
  msg += `\n`;
  msg += `🛍️ *ITEMS PURCHASED*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += itemLines;
  msg += `\n\n`;
  msg += `📊 *BILLING SUMMARY*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `   Subtotal:  ${formatINR(order.subtotal)}\n`;

  if (order.couponCode) {
    msg += `   🎟️ Coupon (${order.couponCode}): -${formatINR(order.couponDiscount || 0)}\n`;
  }
  if (order.discountAmount > 0) {
    msg += `   Discount:  -${formatINR(order.discountAmount)}\n`;
  }

  msg += `   GST:       ${formatINR(order.taxAmount)}\n`;
  msg += `   *TOTAL:    ${formatINR(order.grandTotal)}*\n`;
  msg += `\n`;
  msg += `💳 Paid via: *${order.paymentMethod}*\n`;

  if (order.paymentMethod === 'Cash') {
    msg += `💵 Tendered: ${formatINR(order.amountPaid)}\n`;
    msg += `🔄 Change:   ${formatINR(order.changeGiven)}\n`;
  }

  if (order.pointsEarned > 0) {
    msg += `⭐ Points Earned: +${order.pointsEarned} Pts\n`;
  }

  msg += `\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📍 ${storeTitle}${branch ? ` • ${branch}` : ''}\n`;
  msg += `📦 Please retain invoice for return/exchange\n`;
  msg += `\n`;
  msg += `_Thank you for shopping with ${storeTitle}!_ 🙏`;

  return msg;
};

/**
 * Sanitizes an Indian phone number and opens WhatsApp with a pre-filled message.
 * Handles formats: 9876543210, 09876543210, +919876543210, 919876543210
 * @param {string} phone - The customer's phone number
 * @param {string} message - The pre-formatted invoice text
 */
export const openWhatsApp = (phone, message) => {
  // Strip all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle Indian numbers
  if (cleaned.length === 10) {
    // Bare 10-digit Indian mobile number
    cleaned = '91' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // 0-prefixed Indian number
    cleaned = '91' + cleaned.slice(1);
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    // Already has 91 prefix
    // keep as-is
  } else if (cleaned.length === 13 && cleaned.startsWith('091')) {
    cleaned = '91' + cleaned.slice(3);
  }
  // For any other format, use as-is (supports international)

  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleaned}?text=${encodedMessage}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
