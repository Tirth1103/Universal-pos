import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Search, Trash2, X, CheckCircle, ArrowDownLeft } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { purchaseAPI, vendorAPI } from '../../services/api';
import { formatINR } from '../../utils/formatters';

const PurchaseBillManager = () => {
  const { products, showToast, theme, fetchProducts } = usePOS();
  const isLight = theme === 'light';

  const [bills, setBills] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Form State
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [itcEligible, setItcEligible] = useState(true);
  const [isInterState, setIsInterState] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    {
      productId: '',
      title: '',
      sku: '',
      quantity: 1,
      unit: 'pcs',
      purchasePrice: 0,
      mrp: 0,
      batchNumber: '',
      manufacturingDate: '',
      expiryDate: '',
      hsnCode: '',
      taxRate: 5
    }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const fetchBillsAndVendors = useCallback(async () => {
    setLoading(true);
    try {
      const [billsRes, vendorsRes] = await Promise.all([
        purchaseAPI.getBills(),
        vendorAPI.getAll()
      ]);
      if (billsRes.data?.success) setBills(billsRes.data.data);
      if (vendorsRes.data?.success) setVendors(vendorsRes.data.data);
    } catch (err) {
      showToast('Failed to load purchase records', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillsAndVendors();
  }, [fetchBillsAndVendors]);

  const handleProductSelect = (index, prodId) => {
    const prod = products.find(p => p._id === prodId || p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: prod._id || prod.id,
      title: prod.title,
      sku: prod.sku,
      purchasePrice: prod.costPrice || (prod.price * 0.7),
      mrp: prod.price,
      hsnCode: prod.hsnCode || '',
      taxRate: prod.taxRate || 5,
      batchNumber: `B-${Date.now().toString().slice(-4)}`
    };
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        productId: '',
        title: '',
        sku: '',
        quantity: 1,
        unit: 'pcs',
        purchasePrice: 0,
        mrp: 0,
        batchNumber: '',
        manufacturingDate: '',
        expiryDate: '',
        hsnCode: '',
        taxRate: 5
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Totals calculation
  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.purchasePrice || 0)), 0);
  const totalTax = items.reduce((sum, it) => {
    const line = Number(it.quantity || 0) * Number(it.purchasePrice || 0);
    return sum + (line * (Number(it.taxRate || 0) / 100));
  }, 0);
  const grandTotal = Number((subtotal + totalTax).toFixed(2));
  const paidVal = Number(amountPaid) || 0;
  const balanceDue = Math.max(0, grandTotal - paidVal);

  const handleSubmitBill = async (e) => {
    e.preventDefault();
    if (!selectedVendorId || !billNumber.trim()) {
      showToast('Vendor and Bill # are required', 'warning');
      return;
    }
    if (items.some(it => !it.title || Number(it.purchasePrice) <= 0)) {
      showToast('Please specify valid titles and purchase prices', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        vendorId: selectedVendorId,
        billNumber: billNumber.trim(),
        billDate,
        items,
        itcEligible,
        isInterState,
        amountPaid: paidVal,
        notes
      };

      const res = await purchaseAPI.createBill(payload);
      if (res.data?.success) {
        showToast(res.data.message || 'Purchase Bill recorded!', 'success');
        setIsRecordModalOpen(false);
        setBillNumber('');
        setAmountPaid('');
        fetchBillsAndVendors();
        fetchProducts(); // Refresh stocks & batches
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record purchase bill', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black flex items-center gap-2.5 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <ShoppingCart className="w-7 h-7 text-emerald-500" />
            Purchases & Supplier Bills
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-amber-400/80'}`}>
            Record purchase invoices, automatically intake inventory batches, and compute Input Tax Credit (ITC)
          </p>
        </div>

        <button
          onClick={() => {
            setBillNumber(`PB-${Date.now().toString().slice(-5)}`);
            setIsRecordModalOpen(true);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-transform active:scale-98 cursor-pointer ${
            isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-emerald-500 text-slate-950 font-black'
          }`}
        >
          <Plus className="w-4 h-4" />
          Record Purchase Bill
        </button>
      </div>

      {/* Bills Directory Table */}
      {loading ? (
        <div className="text-center py-12 text-xs font-bold animate-pulse">Loading purchase bills...</div>
      ) : bills.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center ${
          isLight ? 'bg-[#f4e4b9]/60 border-[#c8a74e]' : 'bg-[#09251a]/40 border-[#1a5a40]'
        }`}>
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <h3 className="font-bold text-sm">No Purchase Bills Recorded</h3>
          <p className="text-xs opacity-60 mt-1">Record supplier purchase bills to automatically increment stocks and batches.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bills.map((bill) => (
            <div
              key={bill._id || bill.id}
              className={`p-5 rounded-3xl border shadow-sm ${
                isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm">{bill.billNumber}</span>
                  <span className="text-xs opacity-60">
                    {new Date(bill.billDate).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                    ITC: {bill.itcEligible ? 'Eligible (Claimable)' : 'Ineligible'}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  bill.paymentStatus === 'Paid'
                    ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                    : bill.paymentStatus === 'Partially Paid'
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                    : 'bg-red-500/20 text-red-500 border-red-500/30'
                }`}>
                  {bill.paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-3 border-y border-dashed border-current/15 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold opacity-70 block mb-0.5">Supplier</span>
                  <p className="font-black">{bill.vendorName}</p>
                  {bill.vendorGstin && <p className="text-[11px] opacity-70">GSTIN: {bill.vendorGstin}</p>}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold opacity-70 block mb-0.5">Items Invoiced</span>
                  <p className="truncate font-medium">{bill.items?.map(i => `${i.quantity}x ${i.title}`).join(', ')}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold opacity-70 block mb-0.5">Tax (GST)</span>
                  <p className="font-bold text-amber-500">+{formatINR(bill.taxAmount || 0)}</p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold opacity-70 block mb-0.5">Total Amount</span>
                  <p className="text-base font-black">{formatINR(bill.totalAmount)}</p>
                  {bill.balanceDue > 0 && (
                    <span className="text-[11px] text-red-500 font-bold">Due: {formatINR(bill.balanceDue)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Purchase Bill Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <h3 className="font-black text-base">Record Inward Purchase Bill</h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmitBill} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Select Supplier / Vendor</label>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    required
                    className={`w-full p-2.5 rounded-xl border font-medium focus:outline-none ${
                      isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                    }`}
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map(v => (
                      <option key={v._id || v.id} value={v._id || v.id}>{v.name} ({v.companyName || v.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Vendor Bill Number</label>
                  <input
                    type="text"
                    required
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-bold focus:outline-none ${
                      isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Bill Date</label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                      isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold uppercase tracking-wider">Purchase Items & Batch Details</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 text-emerald-500 font-bold hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border grid grid-cols-12 gap-2 items-center ${
                        isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
                      }`}
                    >
                      <div className="col-span-12 sm:col-span-3">
                        <select
                          value={it.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className={`w-full p-1.5 rounded-lg border text-xs mb-1 ${
                            isLight ? 'bg-[#fbf4dc]' : 'bg-[#05170f] text-white'
                          }`}
                        >
                          <option value="">-- Match Catalog Item --</option>
                          {products.map(p => (
                            <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Item Name"
                          value={it.title}
                          onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                          required
                          className={`w-full p-1.5 rounded-lg border text-xs ${
                            isLight ? 'bg-[#fbf4dc]' : 'bg-[#05170f] text-white'
                          }`}
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[9px] uppercase font-bold">Qty</label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className={`w-full p-1.5 rounded-lg border font-bold ${
                            isLight ? 'bg-[#fbf4dc]' : 'bg-[#05170f] text-white'
                          }`}
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[9px] uppercase font-bold">Purchase Rate</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={it.purchasePrice}
                          onChange={(e) => handleItemChange(idx, 'purchasePrice', e.target.value)}
                          className={`w-full p-1.5 rounded-lg border font-bold ${
                            isLight ? 'bg-[#fbf4dc]' : 'bg-[#05170f] text-white'
                          }`}
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[9px] uppercase font-bold">Batch #</label>
                        <input
                          type="text"
                          placeholder="BATCH-1"
                          value={it.batchNumber}
                          onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                          className={`w-full p-1.5 rounded-lg border ${
                            isLight ? 'bg-[#fbf4dc]' : 'bg-[#05170f] text-white'
                          }`}
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-2">
                        <label className="block text-[9px] uppercase font-bold">Expiry Date</label>
                        <input
                          type="date"
                          value={it.expiryDate}
                          onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                          className={`w-full p-1.5 rounded-lg border ${
                            isLight ? 'bg-[#fbf4dc]' : 'bg-[#05170f] text-white'
                          }`}
                        />
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length === 1}
                          className="p-1 text-red-500 hover:opacity-100 opacity-60 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Totals & Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t">
                <div className="space-y-2">
                  <div>
                    <label className="block font-bold mb-1">Amount Paid Now (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00 (Leave 0 for full credit/unpaid)"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border font-bold focus:outline-none ${
                        isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="itcToggle"
                      checked={itcEligible}
                      onChange={(e) => setItcEligible(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="itcToggle" className="font-bold cursor-pointer">
                      Claim Input Tax Credit (ITC) for this purchase
                    </label>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1.5 ${
                  isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
                }`}>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-amber-500">
                    <span>Estimated GST:</span>
                    <span className="font-bold">+{formatINR(totalTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-1 border-t">
                    <span>Total Bill:</span>
                    <span>{formatINR(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-red-500 font-bold">
                    <span>Balance Due (Vendor Khata):</span>
                    <span>{formatINR(balanceDue)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2 rounded-xl font-black ${
                    isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-emerald-500 text-slate-950 font-black'
                  }`}
                >
                  {submitting ? 'Saving...' : 'Record Purchase Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseBillManager;
