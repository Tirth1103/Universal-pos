import React, { useState } from 'react';
import { Download, Upload, X, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { inventoryAdvancedAPI } from '../../services/api';

const BulkImportExportModal = ({ isOpen, onClose, onSuccess }) => {
  const { showToast, theme } = usePOS();
  const isLight = theme === 'light';

  const [importJsonText, setImportJsonText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    window.open(inventoryAdvancedAPI.exportCatalogUrl(), '_blank');
    showToast('Catalog Excel download initiated', 'success');
  };

  const handleBulkImport = async () => {
    if (!importJsonText.trim()) {
      showToast('Please provide JSON or CSV data', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const parsed = JSON.parse(importJsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      const res = await inventoryAdvancedAPI.importCatalog(items);
      if (res.data?.success) {
        showToast(res.data.message || 'Catalog imported successfully!', 'success');
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      showToast('Invalid JSON format. Check template sample.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const sampleTemplate = JSON.stringify([
    {
      "sku": "TSH-COT-001",
      "title": "Classic Cotton T-Shirt",
      "category": "Clothing",
      "price": 799,
      "costPrice": 350,
      "stock": 50,
      "hsnCode": "6109",
      "taxRate": 5
    },
    {
      "sku": "JNS-DEN-002",
      "title": "Slim Fit Denim Jeans",
      "category": "Clothing",
      "price": 1499,
      "costPrice": 700,
      "stock": 30,
      "hsnCode": "6203",
      "taxRate": 12
    }
  ], null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${
        isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
      }`}>
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
        }`}>
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-black">Bulk Excel Catalog Import & Export</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl cursor-pointer hover:bg-current/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Export Section */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
          }`}>
            <div>
              <h3 className="font-black text-sm">Download Existing Store Catalog</h3>
              <p className="opacity-70 mt-0.5">Export all products, batches, prices, HSN, and stock counts to `.xlsx`</p>
            </div>
            <button
              onClick={handleExportExcel}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold border shadow-sm transition-transform active:scale-98 cursor-pointer ${
                isLight ? 'bg-[#072418] text-[#fef08a] border-[#072418]' : 'bg-emerald-600 text-white border-emerald-500'
              }`}
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>
          </div>

          {/* Import Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider">Bulk Import Payload (JSON / Catalog Array)</label>
              <button
                type="button"
                onClick={() => setImportJsonText(sampleTemplate)}
                className="text-amber-500 hover:underline font-bold cursor-pointer"
              >
                Load Sample Template
              </button>
            </div>

            <textarea
              rows="8"
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste JSON array of items here..."
              className={`w-full p-3 rounded-2xl border font-mono text-xs focus:outline-none resize-none ${
                isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#05170f] border-[#1a5a40] text-white'
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
              type="button"
              onClick={handleBulkImport}
              disabled={submitting}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black shadow-lg cursor-pointer ${
                isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'
              }`}
            >
              <Upload className="w-4 h-4" />
              {submitting ? 'Importing...' : 'Run Bulk Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportExportModal;
