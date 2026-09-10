import React, { useState } from 'react';
import { X, Printer, CheckCircle2, QrCode, Phone, Store } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatINR } from '../../utils/formatters';
import { generateWhatsAppInvoice, openWhatsApp } from '../../utils/whatsappInvoice';

const ReceiptModal = ({ order, onClose }) => {
  const { theme, showToast, currentUser } = usePOS();
  const isLight = theme === 'light';
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const storeTitle = order.storeName || currentUser?.storeName || 'Retail Store';
  const storeLogo = order.storeLogo || currentUser?.storeLogo || '';
  const storeBranch = order.storeBranch || currentUser?.storeBranch || '';
  const storeCategory = order.storeCategory || currentUser?.storeCategory || 'General Retail';
  const customerPhone = order.customer?.phone || '';

  const handleWhatsAppShare = () => {
    const invoice = generateWhatsAppInvoice({
      ...order,
      storeName: storeTitle,
      storeBranch
    });

    if (customerPhone) {
      // Customer has a phone number — share directly
      openWhatsApp(customerPhone, invoice);
      showToast(`Invoice sent to ${order.customer?.name || 'customer'} on WhatsApp`, 'success');
    } else if (whatsappPhone.replace(/\D/g, '').length >= 10) {
      // Walk-in guest with manually entered phone
      openWhatsApp(whatsappPhone, invoice);
      showToast('Invoice shared on WhatsApp', 'success');
      setShowPhoneInput(false);
      setWhatsappPhone('');
    } else {
      // No phone — show input prompt
      setShowPhoneInput(true);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in select-none ${
      isLight ? 'bg-[#051f14]/40' : 'bg-[#05170f]/85'
    }`}>
      <div className={`border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-300 ${
        isLight ? 'bg-[#fffaf0] border-[#d6b866] text-[#051f14]' : 'bg-[#09251a] border-[#144833] text-[#fef3c7]'
      }`}>
        {/* Top Controls */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
        }`}>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sale Completed Successfully</span>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isLight ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14]' : 'bg-[#061a11] hover:bg-[#0c2f21] text-[#fef08a]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Container */}
        <div className={`p-6 overflow-y-auto flex-1 space-y-4 ${
          isLight ? 'bg-[#fbf4dc]' : 'bg-[#05170f]'
        }`}>
          <div id="printable-receipt" className="p-6 rounded-2xl bg-white text-slate-900 shadow-xl font-mono text-xs space-y-4 border border-slate-200">
            {/* Header Store Details */}
            <div className="text-center space-y-1 pb-3 border-b border-slate-300">
              <div className="flex justify-center mb-1.5">
                {storeLogo ? (
                  <img
                    src={storeLogo}
                    alt={storeTitle}
                    className="w-14 h-14 object-contain rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-base uppercase bg-amber-500 text-slate-950">
                    {storeTitle.charAt(0)}
                  </div>
                )}
              </div>
              <h2 className="font-black text-base tracking-widest uppercase">{storeTitle}</h2>
              <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                {storeCategory} {storeBranch ? `• ${storeBranch}` : ''}
              </p>
              <p className="text-[10px] text-slate-500">Retail Point of Sale System</p>
            </div>

            {/* Invoice Info */}
            <div className="text-[11px] space-y-0.5 border-b border-slate-300 pb-3">
              <div className="flex justify-between font-bold">
                <span>TAX INVOICE:</span>
                <span>{order.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date:</span>
                <span>{new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span>{order.customer?.name || 'Walk-in Guest'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cashier:</span>
                <span>{order.cashierName || 'Register #01'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2 border-b border-slate-300 pb-3">
              <div className="grid grid-cols-12 font-bold text-[10px] border-b border-slate-200 pb-1">
                <span className="col-span-6">ITEM & DETAILS</span>
                <span className="col-span-2 text-center">QTY</span>
                <span className="col-span-4 text-right">TOTAL</span>
              </div>

              {(order.items || []).map((item, idx) => {
                const itemTitle = item.title || item.productTitle || 'Item';
                const attributes = Array.isArray(item.attributes) ? item.attributes : [];
                return (
                  <div key={idx} className="grid grid-cols-12 text-[10px]">
                    <div className="col-span-6 pr-1">
                      <p className="font-bold line-clamp-1">{itemTitle}</p>
                      {attributes.length > 0 ? (
                        <p className="text-[9px] text-slate-600">
                          {attributes.map(a => `${a.name}: ${a.value}`).join(' | ')}
                        </p>
                      ) : (item.size || item.color) ? (
                        <p className="text-[9px] text-slate-600">
                          {[item.size, item.color].filter(Boolean).join(' | ')}
                        </p>
                      ) : null}
                    </div>
                    <div className="col-span-2 text-center font-bold">x{item.quantity}</div>
                    <div className="col-span-4 text-right font-bold">{formatINR(item.itemTotal)}</div>
                  </div>
                );
              })}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-[11px] border-b border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              {order.couponCode && (
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span>Coupon ({order.couponCode}):</span>
                  <span>-{formatINR(order.couponDiscount || 0)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Total Discount:</span>
                  <span>-{formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST:</span>
                <span>{formatINR(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span>{formatINR(order.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="text-[10px] space-y-0.5 border-b border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold">{order.paymentMethod}</span>
              </div>
              {order.paymentMethod === 'Cash' && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span>{formatINR(order.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Change Given:</span>
                    <span>{formatINR(order.changeGiven)}</span>
                  </div>
                </>
              )}
              {order.pointsEarned > 0 && (
                <div className="flex justify-between text-indigo-700 font-bold pt-1">
                  <span>Loyalty Points Earned:</span>
                  <span>+{order.pointsEarned} Pts</span>
                </div>
              )}
            </div>

            {/* Receipt Footer & QR */}
            <div className="text-center text-[9px] space-y-2 pt-1">
              <p className="font-bold text-slate-800">Please retain this receipt for return or warranty exchange.</p>
              <div className="flex justify-center">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <p className="text-slate-500 font-semibold">Thank you for shopping with {storeTitle}!</p>
            </div>
          </div>
        </div>

        {/* WhatsApp Phone Input (for walk-in guests) */}
        {showPhoneInput && !customerPhone && (
          <div className={`px-4 pb-2 pt-3 border-t ${
            isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
          }`}>
            <label className={`block text-[10px] font-bold mb-1.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'}`}>
              Enter customer's WhatsApp number to share invoice
            </label>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold ${
                isLight ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14]' : 'bg-[#09251a] border-[#144833] text-[#fef3c7]'
              }`}>
                <Phone className="w-3.5 h-3.5" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                placeholder="98765 43210"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                maxLength={14}
                className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none transition-all ${
                  isLight
                    ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/50 focus:border-[#072618]'
                    : 'bg-[#09251a] border-[#144833] text-[#fef3c7] placeholder-[#fef3c7]/40 focus:border-[#25D366]'
                }`}
                autoFocus
              />
              <button
                onClick={handleWhatsAppShare}
                disabled={whatsappPhone.replace(/\D/g, '').length < 10}
                className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-black transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#25D366]/30"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className={`p-4 border-t flex items-center justify-between gap-2 ${
          isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              isLight ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14] border border-[#c8a74e]' : 'bg-[#09251a] hover:bg-[#0c2f21] text-[#fef08a] border border-[#144833]'
            }`}
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {/* WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg cursor-pointer active:scale-95 bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-[#25D366]/30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] shadow-amber-500/30'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
