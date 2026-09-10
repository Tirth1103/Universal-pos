import React, { useState } from 'react';
import { X, Banknote, CreditCard, QrCode, CheckCircle2, DollarSign, ArrowRight, Layers } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatINR } from '../../utils/formatters';

const CheckoutModal = ({ onClose, initialMethod = 'Cash' }) => {
  const { grandTotal, handleCheckout, selectedCustomer, appliedCoupon, couponDiscount, theme } = usePOS();
  const isLight = theme === 'light';

  const [paymentMethod, setPaymentMethod] = useState(initialMethod); // 'Cash', 'Credit Card', 'UPI / QR', 'Split'
  const [cashReceived, setCashReceived] = useState(grandTotal);
  const [splitCash, setSplitCash] = useState(Math.round(grandTotal / 2));
  const [splitDigitalMode, setSplitDigitalMode] = useState('UPI / QR'); // 'UPI / QR' or 'Credit Card'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const splitDigital = Math.max(0, grandTotal - splitCash);
  const changeDue = paymentMethod === 'Cash' ? Math.max(0, Number(cashReceived) - grandTotal) : 0;

  const quickCashOptions = [
    grandTotal,
    Math.ceil(grandTotal / 50) * 50,
    Math.ceil(grandTotal / 100) * 100,
    Math.ceil(grandTotal / 500) * 500,
    500,
    1000,
    2000
  ].filter((v, i, self) => self.indexOf(v) === i && v >= grandTotal);

  const onSubmit = async () => {
    if (paymentMethod === 'Cash' && Number(cashReceived) < grandTotal) {
      alert('Cash received is less than total amount due.');
      return;
    }

    setIsSubmitting(true);
    await handleCheckout({
      method: paymentMethod,
      amountPaid: paymentMethod === 'Cash' ? Number(cashReceived) : grandTotal,
      changeGiven: changeDue,
      splitDetails: paymentMethod === 'Split' ? { cash: splitCash, digital: splitDigital, digitalMode: splitDigitalMode } : null
    });
    setIsSubmitting(false);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in select-none ${
      isLight ? 'bg-[#051f14]/40' : 'bg-[#05170f]/85'
    }`}>
      <div className={`border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transition-colors duration-300 ${
        isLight ? 'bg-[#fffaf0] border-[#d6b866] text-[#051f14]' : 'bg-[#09251a] border-[#144833] text-[#fef3c7]'
      }`}>
        {/* Modal Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
        }`}>
          <div>
            <h3 className={`text-base font-black ${isLight ? 'text-[#051f14]' : 'text-white'}`}>Payment & Checkout</h3>
            <p className={`text-xs ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
              Customer: <span className={`font-bold ${isLight ? 'text-[#072618]' : 'text-amber-400'}`}>{selectedCustomer ? selectedCustomer.name : 'Walk-in Guest'}</span>
              {appliedCoupon && (
                <span className="ml-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  🎟️ {appliedCoupon.coupon.code} (-{formatINR(couponDiscount)})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isLight ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14]' : 'bg-[#061a11] hover:bg-[#0c2f21] text-[#fef08a]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Due Banner */}
        <div className={`p-6 border-b text-center ${
          isLight ? 'bg-gradient-to-r from-[#fbf4dc] via-[#f8eed1] to-[#f4e4b9] border-[#d6b866]' : 'bg-gradient-to-r from-[#061a11] via-[#09251a] to-[#0c2e21] border-[#144833]'
        }`}>
          <span className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-[#0f442e]' : 'text-amber-400'}`}>Total Amount Due</span>
          <h2 className={`text-4xl font-black mt-1 ${isLight ? 'text-[#051f14]' : 'text-amber-300'}`}>{formatINR(grandTotal)}</h2>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Payment Method Selector */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'Cash', label: 'Cash', icon: Banknote },
                { id: 'Credit Card', label: 'Card', icon: CreditCard },
                { id: 'UPI / QR', label: 'UPI / QR', icon: QrCode },
                { id: 'Split', label: 'Split Bill', icon: Layers }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = paymentMethod === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPaymentMethod(item.id);
                      if (item.id === 'Cash') setCashReceived(grandTotal);
                      else if (item.id === 'Split') setSplitCash(Math.round(grandTotal / 2));
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-[#072418] border-[#072418] text-[#fef08a] shadow-md font-bold'
                          : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 border-amber-500 text-[#051a10] font-black shadow-lg shadow-amber-500/30'
                        : isLight
                        ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14] hover:bg-[#ebd89f]'
                        : 'bg-[#061a11] border-[#144833] text-[#fde047] hover:border-[#1a5a40]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${
                      isSelected
                        ? isLight ? 'text-[#fef08a]' : 'text-[#051a10]'
                        : isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'
                    }`} />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Bill Payment Details */}
          {paymentMethod === 'Split' && (
            <div className={`space-y-3.5 p-4 rounded-2xl border ${
              isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              <div className="flex justify-between items-center text-xs font-bold">
                <span>Split Bill Breakdown</span>
                <span className="text-amber-500">Total: {formatINR(grandTotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[10px] font-bold block mb-1 uppercase ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Cash Share (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={grandTotal}
                    value={splitCash}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(grandTotal, Number(e.target.value)));
                      setSplitCash(val);
                    }}
                    className={`w-full border rounded-xl px-3 py-2 text-sm font-black focus:outline-none ${
                      isLight
                        ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14] focus:border-[#072618]'
                        : 'bg-[#09251a] border-[#144833] text-[#fde047] focus:border-amber-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold block mb-1 uppercase ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Digital Share (₹)
                  </label>
                  <div className={`w-full border rounded-xl px-3 py-2 text-sm font-black flex items-center justify-between ${
                    isLight ? 'bg-[#fffaf0] border-[#c8a74e] text-emerald-800' : 'bg-[#09251a] border-[#144833] text-emerald-400'
                  }`}>
                    <span>{formatINR(splitDigital)}</span>
                    <select
                      value={splitDigitalMode}
                      onChange={(e) => setSplitDigitalMode(e.target.value)}
                      className="bg-transparent text-[10px] font-bold focus:outline-none"
                    >
                      <option value="UPI / QR">UPI / QR</option>
                      <option value="Credit Card">Card</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cash Payment Details */}
          {paymentMethod === 'Cash' && (
            <div className={`space-y-3 p-4 rounded-2xl border ${
              isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              <label className={`block text-xs font-semibold ${isLight ? 'text-[#051f14]' : 'text-[#fde047]'}`}>Quick Cash Buttons</label>
              <div className="flex flex-wrap gap-2">
                {quickCashOptions.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-[#fffaf0] hover:bg-[#f4e4b9] border-[#c8a74e] text-[#072618] shadow-sm'
                        : 'bg-[#09251a] hover:bg-[#0c2f21] border-[#1a5a40] text-amber-300'
                    }`}
                  >
                    {formatINR(amount)}
                  </button>
                ))}
              </div>

              <div className="pt-2 grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>Cash Tendered (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min={grandTotal}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-2 text-sm font-bold focus:outline-none ${
                      isLight
                        ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14] focus:border-[#072618]'
                        : 'bg-[#09251a] border-[#144833] text-[#fde047] focus:border-amber-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[10px] font-semibold block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>Change Due</label>
                  <div className={`w-full border rounded-xl px-3 py-2 text-sm font-extrabold ${
                    isLight ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800' : 'bg-[#09251a] border-[#144833] text-emerald-400'
                  }`}>
                    {formatINR(changeDue)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card Reader Prompt */}
          {paymentMethod === 'Credit Card' && (
            <div className={`p-5 rounded-2xl border flex items-center gap-4 text-left ${
              isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <CreditCard className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className={`text-xs font-bold ${isLight ? 'text-[#051f14]' : 'text-white'}`}>Terminal Ready</h4>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>Swipe, insert, or tap RuPay / Visa / Mastercard on POS terminal.</p>
              </div>
            </div>
          )}

          {/* QR Payment Prompt */}
          {paymentMethod === 'UPI / QR' && (
            <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center space-y-2 ${
              isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              <div className="w-28 h-28 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
                <QrCode className="w-full h-full text-slate-950" />
              </div>
              <p className={`text-xs font-bold ${isLight ? 'text-[#051f14]' : 'text-amber-300'}`}>Scan with any UPI App to Pay {formatINR(grandTotal)}</p>
              <p className={`text-[10px] ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`}>Google Pay • PhonePe • Paytm • BHIM UPI</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-5 border-t flex items-center justify-between ${
          isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isLight ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14] border border-[#c8a74e]' : 'bg-[#061a11] hover:bg-[#0c2f21] text-[#fef08a] border border-[#144833]'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg ${
              isLight
                ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Processing...' : 'Complete Transaction'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
