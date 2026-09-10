import React, { useState } from 'react';
import { X, Plus, Trash2, Calculator } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { documentAPI } from '../../services/api';
import { formatINR } from '../../utils/formatters';

const CreateDocumentModal = ({ isOpen, onClose, onSuccess }) => {
  const { products, customers, showToast, theme } = usePOS();
  const isLight = theme === 'light';

  const [documentType, setDocumentType] = useState('Estimate');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerData, setCustomerData] = useState({
    name: 'Walk-in Guest',
    phone: '',
    email: '',
    gstin: '',
    billingAddress: { street: '', city: '', state: '', stateCode: '24', pincode: '' }
  });

  const [items, setItems] = useState([
    { productId: '', title: '', sku: '', quantity: 1, unit: 'pcs', unitPrice: 0, discountPercent: 0, taxRate: 5, itemTotal: 0 }
  ]);

  const [wholeBillDiscount, setWholeBillDiscount] = useState({ type: 'fixed', value: 0 });
  const [isInterState, setIsInterState] = useState(false);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment due within 15 days of issue.');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCustomerChange = (id) => {
    setSelectedCustomerId(id);
    if (!id) {
      setCustomerData({ name: 'Walk-in Guest', phone: '', email: '', gstin: '', billingAddress: {} });
      return;
    }
    const found = customers.find(c => c._id === id || c.id === id);
    if (found) {
      setCustomerData({
        name: found.name,
        phone: found.phone,
        email: found.email || '',
        gstin: found.gstin || '',
        billingAddress: found.billingAddress || {}
      });
    }
  };

  const handleProductSelect = (index, prodId) => {
    const prod = products.find(p => p._id === prodId || p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    const qty = newItems[index].quantity || 1;
    const price = prod.price || 0;
    const lineBase = qty * price;
    const disc = (lineBase * (newItems[index].discountPercent || 0)) / 100;
    const taxable = lineBase - disc;
    const tax = (taxable * (prod.taxRate || 5)) / 100;

    newItems[index] = {
      productId: prod._id || prod.id,
      title: prod.title,
      sku: prod.sku,
      quantity: qty,
      unit: prod.unit || 'pcs',
      unitPrice: price,
      discountPercent: newItems[index].discountPercent || 0,
      taxRate: prod.taxRate || 5,
      itemTotal: Number((taxable + tax).toFixed(2))
    };
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    const qty = Number(newItems[index].quantity) || 0;
    const price = Number(newItems[index].unitPrice) || 0;
    const lineBase = qty * price;
    const disc = (lineBase * (Number(newItems[index].discountPercent) || 0)) / 100;
    const taxable = lineBase - disc;
    const tax = (taxable * (Number(newItems[index].taxRate) || 0)) / 100;

    newItems[index].itemTotal = Number((taxable + tax).toFixed(2));
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { productId: '', title: '', sku: '', quantity: 1, unit: 'pcs', unitPrice: 0, discountPercent: 0, taxRate: 5, itemTotal: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  const itemDiscounts = items.reduce((sum, item) => {
    const base = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    return sum + (base * (Number(item.discountPercent || 0) / 100));
  }, 0);

  let billDisc = 0;
  if (wholeBillDiscount.type === 'percent') {
    billDisc = ((subtotal - itemDiscounts) * (Number(wholeBillDiscount.value) || 0)) / 100;
  } else {
    billDisc = Number(wholeBillDiscount.value) || 0;
  }
  const totalDiscount = itemDiscounts + billDisc;
  const taxableTotal = Math.max(0, subtotal - totalDiscount);
  const taxTotal = items.reduce((sum, item) => {
    const base = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    const disc = base * (Number(item.discountPercent || 0) / 100);
    return sum + ((base - disc) * (Number(item.taxRate || 0) / 100));
  }, 0);

  const rawGrandTotal = taxableTotal + taxTotal;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some(i => !i.title || !i.unitPrice)) {
      showToast('Please fill in valid item names and rates', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        documentType,
        customer: {
          id: selectedCustomerId || null,
          ...customerData
        },
        items,
        wholeBillDiscount,
        isInterState,
        notes,
        terms,
        dueDate: dueDate || null
      };

      const res = await documentAPI.create(payload);
      if (res.data?.success) {
        showToast(`${documentType} created successfully!`, 'success');
        onSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create document', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${
        isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
        }`}>
          <div>
            <h2 className="text-lg font-black tracking-wide">Create Sales Document</h2>
            <p className={`text-xs ${isLight ? 'text-[#0f442e]' : 'text-amber-400/80'}`}>
              Draft Estimates, Proforma Invoices, Sales Orders, Challans, and Credit Notes
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'hover:bg-[#ebd9a5] text-[#051f14]' : 'hover:bg-[#144833] text-amber-300'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">Document Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['Estimate', 'ProformaInvoice', 'SalesOrder', 'DeliveryChallan', 'CreditNote'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setDocumentType(type)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    documentType === type
                      ? isLight
                        ? 'bg-[#072418] text-[#fef08a] border-[#072418] shadow-md'
                        : 'bg-amber-400 text-[#051a10] border-amber-400 shadow-md font-black'
                      : isLight
                      ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14] hover:border-[#072418]'
                      : 'bg-[#09251a] border-[#1a5a40] text-amber-300 hover:border-amber-400'
                  }`}
                >
                  {type === 'ProformaInvoice' ? 'Proforma Inv' : type === 'SalesOrder' ? 'Sales Order' : type === 'DeliveryChallan' ? 'Challan' : type === 'CreditNote' ? 'Credit Note' : 'Estimate'}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Selection & Details */}
          <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-4 ${
            isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#09251a]/60 border-[#144833]'
          }`}>
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none ${
                  isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                }`}
              >
                <option value="">-- Walk-in Guest (Manual) --</option>
                {customers.map(c => (
                  <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">Customer Name</label>
              <input
                type="text"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none ${
                  isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                placeholder="For WhatsApp dispatch"
                className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none ${
                  isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                }`}
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider">Line Items</label>
              <button
                type="button"
                onClick={addItemRow}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isLight ? 'bg-[#ebd89f] border-[#baa04e] hover:bg-[#dfc886]' : 'bg-[#0e3524] border-[#1a5a40] hover:bg-[#154a32] text-amber-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border grid grid-cols-12 gap-2 items-center ${
                    isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
                  }`}
                >
                  <div className="col-span-12 sm:col-span-4">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className={`w-full p-2 rounded-xl border text-xs focus:outline-none mb-1 ${
                        isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                      }`}
                    >
                      <option value="">-- Quick Pick Product --</option>
                      {products.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>{p.title} (₹{p.price})</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Item Title"
                      value={item.title}
                      onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                      className={`w-full p-1.5 rounded-lg border text-xs focus:outline-none ${
                        isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                      }`}
                      required
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[9px] uppercase font-bold mb-0.5">Qty & Unit</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className={`w-14 p-1.5 rounded-lg border text-xs font-bold text-center focus:outline-none ${
                          isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                        }`}
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className={`w-12 p-1.5 rounded-lg border text-xs text-center focus:outline-none ${
                          isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[9px] uppercase font-bold mb-0.5">Unit Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className={`w-full p-1.5 rounded-lg border text-xs font-bold focus:outline-none ${
                        isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                      }`}
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-[9px] uppercase font-bold mb-0.5">Disc %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                      className={`w-full p-1.5 rounded-lg border text-xs font-bold focus:outline-none ${
                        isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                      }`}
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-[9px] uppercase font-bold mb-0.5">Tax %</label>
                    <input
                      type="number"
                      min="0"
                      value={item.taxRate}
                      onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                      className={`w-full p-1.5 rounded-lg border text-xs font-bold focus:outline-none ${
                        isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                      }`}
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-1 text-right">
                    <span className="block text-[9px] uppercase font-bold mb-0.5">Total</span>
                    <span className="font-black text-xs">₹{item.itemTotal}</span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length === 1}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        items.length === 1
                          ? 'opacity-30 cursor-not-allowed'
                          : isLight
                          ? 'hover:bg-red-100 text-red-600'
                          : 'hover:bg-red-950/40 text-red-400'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discounts, Tax & Totals Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-dashed">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Whole-Bill Flat Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={wholeBillDiscount.value}
                  onChange={(e) => setWholeBillDiscount({ ...wholeBillDiscount, value: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none ${
                    isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Notes / Terms</label>
                <textarea
                  rows="2"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none resize-none ${
                    isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <div className="flex justify-between">
                <span>Subtotal (Base Items):</span>
                <span className="font-bold">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Total Discounts:</span>
                <span className="font-bold">-{formatINR(totalDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxable Amount:</span>
                <span className="font-bold">{formatINR(taxableTotal)}</span>
              </div>
              <div className="flex justify-between text-amber-500">
                <span>Total Tax (GST):</span>
                <span className="font-bold">+{formatINR(taxTotal)}</span>
              </div>
              {roundOff !== 0 && (
                <div className="flex justify-between text-[11px] opacity-80">
                  <span>Auto Cash Round Off:</span>
                  <span>{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
                </div>
              )}
              <div className={`pt-3 border-t flex justify-between items-center text-base font-black ${
                isLight ? 'border-[#c8a74e] text-[#051f14]' : 'border-[#1a5a40] text-amber-300'
              }`}>
                <span>Grand Total:</span>
                <span>{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isLight ? 'border-[#c8a74e] hover:bg-[#ebd89f]' : 'border-[#1a5a40] hover:bg-[#0e3524]'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition-transform active:scale-98 cursor-pointer ${
                isLight
                  ? 'bg-[#072418] text-[#fef08a] hover:bg-[#0c3725]'
                  : 'bg-amber-400 text-[#051a10] hover:bg-amber-300'
              }`}
            >
              {submitting ? 'Creating...' : `Save ${documentType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDocumentModal;
