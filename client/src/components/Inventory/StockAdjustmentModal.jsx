import React, { useState } from 'react';
import { X, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { inventoryAdvancedAPI } from '../../services/api';

const StockAdjustmentModal = ({ isOpen, onClose, onSuccess, initialProduct = null }) => {
  const { products, showToast, theme } = usePOS();
  const isLight = theme === 'light';

  const [productId, setProductId] = useState(initialProduct?._id || initialProduct?.id || '');
  const [adjustmentType, setAdjustmentType] = useState('Physical Audit Correction');
  const [quantityChanged, setQuantityChanged] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [notes, setNotes] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => (p._id === productId || p.id === productId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId) {
      showToast('Please select a product', 'warning');
      return;
    }

    const qty = Number(quantityChanged);
    if (isNaN(qty) || qty === 0) {
      showToast('Please enter a non-zero quantity change (+ for add, - for deduct)', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await inventoryAdvancedAPI.createAdjustment({
        productId,
        adjustmentType,
        quantityChanged: qty,
        reasonCode,
        notes,
        batchNumber
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Stock adjustment recorded successfully!', 'success');
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to apply adjustment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
      }`}>
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
        }`}>
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black">Stock Audit Adjustment</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl cursor-pointer ${isLight ? 'hover:bg-[#ebd9a5]' : 'hover:bg-[#144833]'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase mb-1">Select Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-bold focus:outline-none ${
                isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
              }`}
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.title} (Stock: {p.stock} {p.unit || 'pcs'})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className={`p-3 rounded-xl border flex items-center justify-between font-bold ${
              isLight ? 'bg-[#ebd89f]/60 border-[#c8a74e]' : 'bg-[#0e3524]/60 border-[#1a5a40]'
            }`}>
              <span>Current Recorded Stock:</span>
              <span className="text-sm font-black">{selectedProduct.stock} {selectedProduct.unit || 'pcs'}</span>
            </div>
          )}

          <div>
            <label className="block font-bold uppercase mb-1">Adjustment Reason / Type</label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-bold focus:outline-none ${
                isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
              }`}
            >
              <option value="Physical Audit Correction">Physical Audit Correction</option>
              <option value="Damage">Damage (Goods Damaged in Store)</option>
              <option value="Loss / Theft">Loss / Theft / Pilferage</option>
              <option value="Expired Stock Scrap">Expired Stock Scrap</option>
              <option value="Customer Return">Customer Return to Stock</option>
              <option value="Other">Other Adjustment</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase mb-1">Quantity Change</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. -2 or +5"
                value={quantityChanged}
                onChange={(e) => setQuantityChanged(e.target.value)}
                className={`w-full p-2.5 rounded-xl border font-black text-sm focus:outline-none ${
                  isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                }`}
                required
              />
              <span className="text-[10px] opacity-70 mt-1 block">Negative (-) to deduct, Positive (+) to add</span>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Batch Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. BATCH-01"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                  isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase mb-1">Notes & Reason Description</label>
            <textarea
              rows="2"
              placeholder="e.g. Discrepancy identified during weekly inventory reconciliation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full p-2.5 rounded-xl border focus:outline-none resize-none ${
                isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
              }`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl font-bold border cursor-pointer ${
                isLight ? 'border-[#c8a74e]' : 'border-[#1a5a40]'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded-xl font-black shadow-lg cursor-pointer ${
                isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'
              }`}
            >
              {submitting ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
