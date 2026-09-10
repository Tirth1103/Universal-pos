import React, { useState, useEffect } from 'react';
import { Receipt, Search, Eye, Calendar, Printer, Filter } from 'lucide-react';
import { orderAPI } from '../../services/api';
import { usePOS } from '../../context/POSContext';
import ReceiptModal from '../POS/ReceiptModal';
import { formatINR } from '../../utils/formatters';
import { generateWhatsAppInvoice, openWhatsApp } from '../../utils/whatsappInvoice';

const OrderHistory = () => {
  const { lastOrder, theme, showToast } = usePOS();
  const isLight = theme === 'light';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getAll({ paymentMethod: paymentFilter });
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [paymentFilter, lastOrder]);

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <Receipt className={`w-6 h-6 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
            Sales & Order Transaction History
          </h2>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
            Audit billing transactions, verify payment types, and reprint receipts.
          </p>
        </div>

        {/* Payment Filter */}
        <div className="flex items-center gap-2">
          <Filter className={`w-4 h-4 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`} />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className={`border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14] shadow-sm focus:border-[#072618]'
                : 'bg-[#061a11] border-[#144833] text-[#fde047] focus:border-amber-400'
            }`}
          >
            <option value="All">All Payment Methods</option>
            <option value="Cash">Cash Payments</option>
            <option value="Credit Card">Credit / Debit Card</option>
            <option value="UPI / QR">UPI / QR Payments</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`border rounded-3xl overflow-hidden shadow-xl transition-colors duration-300 ${
        isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-bold border-b uppercase tracking-wider text-[10px] ${
              isLight ? 'bg-[#f8eed1] text-[#051f14] border-[#d6b866]' : 'bg-[#061a11] text-[#fde047] border-[#144833]'
            }`}>
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Purchased Items</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-[#d6b866]/40' : 'divide-[#144833]'}`}>
              {loading ? (
                <tr>
                  <td colSpan="7" className={`text-center py-12 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`}>
                    Loading order history...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`text-center py-16 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`}>
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-xs">No transactions recorded yet</p>
                    <p className="text-[11px] mt-0.5 opacity-70">Completed customer orders will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const oid = ord._id || ord.id;
                  const totalItems = (ord.items || []).reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <tr key={oid} className={`transition-colors ${isLight ? 'hover:bg-[#f4e4b9]/40' : 'hover:bg-[#0c2f21]/60'}`}>
                      <td className={`py-3.5 px-4 font-mono font-bold ${
                        isLight ? 'text-[#072618]' : 'text-amber-400'
                      }`}>
                        {ord.invoiceNumber}
                      </td>
                      <td className={`py-3.5 px-4 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                        {new Date(ord.createdAt || Date.now()).toLocaleString('en-IN')}
                      </td>
                      <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
                        {ord.customer?.name || 'Walk-in Guest'}
                      </td>
                      <td className={`py-3.5 px-4 ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
                        <span className="font-semibold">{totalItems} items</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isLight
                            ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]'
                            : 'bg-[#061a11] text-amber-400 border-[#144833]'
                        }`}>
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 font-black ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
                        {formatINR(ord.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          {/* WhatsApp Share Button */}
                          <button
                            onClick={() => {
                              const invoice = generateWhatsAppInvoice(ord);
                              const phone = ord.customer?.phone || '';
                              if (phone) {
                                openWhatsApp(phone, invoice);
                                showToast(`Invoice shared with ${ord.customer?.name || 'customer'}`, 'success');
                              } else {
                                const inputPhone = window.prompt('Enter WhatsApp number (e.g., 9876543210):');
                                if (inputPhone && inputPhone.replace(/\D/g, '').length >= 10) {
                                  openWhatsApp(inputPhone, invoice);
                                  showToast('Invoice shared on WhatsApp', 'success');
                                }
                              }
                            }}
                            title="Share invoice on WhatsApp"
                            className="p-2 rounded-xl border transition-all active:scale-95 cursor-pointer bg-[#25D366] hover:bg-[#20BD5A] text-white border-[#25D366]/50 shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </button>

                          {/* View Receipt Button */}
                          <button
                            onClick={() => setSelectedReceiptOrder(ord)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-[11px] border transition-all active:scale-95 cursor-pointer ${
                              isLight
                                ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14] border-[#c8a74e]'
                                : 'bg-[#061a11] hover:bg-[#0c2f21] text-[#fef08a] border-[#144833]'
                            }`}
                          >
                            <Printer className={`w-3.5 h-3.5 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
                            <span>View Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Viewing Popover Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
};

export default OrderHistory;
