import React, { useState, useEffect, useCallback } from 'react';
import { AlertOctagon, Clock, SlidersHorizontal, QrCode, FileSpreadsheet, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { inventoryAdvancedAPI } from '../../services/api';
import { formatINR } from '../../utils/formatters';
import StockAdjustmentModal from './StockAdjustmentModal';
import BarcodeLabelGenerator from './BarcodeLabelGenerator';
import BulkImportExportModal from './BulkImportExportModal';

const BatchExpiryManager = () => {
  const { showToast, theme, fetchProducts } = usePOS();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState('lowStock'); // 'lowStock' | 'expiry'
  const [data, setData] = useState({ lowStock: [], nearExpiryOrExpired: [] });
  const [loading, setLoading] = useState(false);
  const [expiryDays, setExpiryDays] = useState(60);

  // Modals
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedProductForAdj, setSelectedProductForAdj] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAdvancedAPI.getLowStockAndExpiry(expiryDays);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load stock alerts', 'error');
    } finally {
      setLoading(false);
    }
  }, [expiryDays]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleOpenAdjustment = (prod = null) => {
    setSelectedProductForAdj(prod);
    setIsAdjustmentOpen(true);
  };

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black flex items-center gap-2.5 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <AlertOctagon className="w-7 h-7 text-amber-500" />
            Advanced Inventory & Stock Controls
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-amber-400/80'}`}>
            Monitor batch expiry timelines, reorder points, sticker barcode generation, and physical audit adjustments
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleOpenAdjustment()}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm transition-transform active:scale-98 cursor-pointer ${
              isLight ? 'bg-[#ebd89f] border-[#baa04e] text-[#051f14]' : 'bg-[#09251a] border-[#1a5a40] text-amber-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
            Stock Adjustment
          </button>

          <button
            onClick={() => setIsBarcodeOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm transition-transform active:scale-98 cursor-pointer ${
              isLight ? 'bg-[#ebd89f] border-[#baa04e] text-[#051f14]' : 'bg-[#09251a] border-[#1a5a40] text-amber-300'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-500" />
            Barcode Generator
          </button>

          <button
            onClick={() => setIsBulkOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm transition-transform active:scale-98 cursor-pointer ${
              isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10] font-black'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('lowStock')}
            className={`flex items-center gap-2 pb-2 px-1 text-xs font-black border-b-2 transition-all cursor-pointer ${
              activeTab === 'lowStock'
                ? isLight ? 'border-[#072418] text-[#072418]' : 'border-amber-400 text-amber-400'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Low Stock Alerts ({data.lowStock?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('expiry')}
            className={`flex items-center gap-2 pb-2 px-1 text-xs font-black border-b-2 transition-all cursor-pointer ${
              activeTab === 'expiry'
                ? isLight ? 'border-[#072418] text-[#072418]' : 'border-amber-400 text-amber-400'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            Batch & Expiry Tracker ({data.nearExpiryOrExpired?.length || 0})
          </button>
        </div>

        {activeTab === 'expiry' && (
          <select
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value))}
            className={`px-3 py-1 rounded-xl border text-xs font-bold focus:outline-none ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-amber-300'
            }`}
          >
            <option value={30}>Expiring in 30 days</option>
            <option value={60}>Expiring in 60 days</option>
            <option value={90}>Expiring in 90 days</option>
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-xs font-bold animate-pulse">Scanning stock & batches...</div>
      ) : activeTab === 'lowStock' ? (
        /* Low Stock Items Grid */
        data.lowStock?.length === 0 ? (
          <div className={`p-12 rounded-3xl border text-center ${
            isLight ? 'bg-[#f4e4b9]/60 border-[#c8a74e]' : 'bg-[#09251a]/40 border-[#1a5a40]'
          }`}>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-80" />
            <h3 className="font-bold text-sm">All Inventory Well Stocked</h3>
            <p className="text-xs opacity-70 mt-1">No products are currently at or below their reorder threshold.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.lowStock.map((prod) => (
              <div
                key={prod._id || prod.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs ${
                  isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                      {prod.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-500 border border-red-500/30">
                      Low Stock
                    </span>
                  </div>
                  <h3 className="font-black text-sm">{prod.title}</h3>
                  <p className="text-xs opacity-60 font-mono mt-0.5">SKU: {prod.sku}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-current/15 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span>Available Stock:</span>
                    <span className="font-black text-red-500 text-sm">
                      {prod.stock} {prod.unit || 'pcs'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center opacity-80 text-[11px]">
                    <span>Reorder Point:</span>
                    <span className="font-bold">{prod.reorderPoint || prod.minStockAlert || 5} {prod.unit || 'pcs'}</span>
                  </div>

                  <button
                    onClick={() => handleOpenAdjustment(prod)}
                    className={`w-full py-1.5 rounded-xl font-bold border transition-colors cursor-pointer text-center ${
                      isLight ? 'border-[#c8a74e] hover:bg-[#ebd89f]' : 'border-[#1a5a40] hover:bg-[#0e3524] text-amber-300'
                    }`}
                  >
                    Adjust Stock Count
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Expiry Tracker Grid */
        data.nearExpiryOrExpired?.length === 0 ? (
          <div className={`p-12 rounded-3xl border text-center ${
            isLight ? 'bg-[#f4e4b9]/60 border-[#c8a74e]' : 'bg-[#09251a]/40 border-[#1a5a40]'
          }`}>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-80" />
            <h3 className="font-bold text-sm">No Batches Near Expiry</h3>
            <p className="text-xs opacity-70 mt-1">All catalog product batches have comfortable shelf lives.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.nearExpiryOrExpired.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs ${
                  item.isExpired
                    ? 'bg-red-950/20 border-red-500/40'
                    : isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/20">
                      Batch: {item.batchNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      item.isExpired
                        ? 'bg-red-500/20 text-red-500 border-red-500/40'
                        : 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                    }`}>
                      {item.isExpired ? 'EXPIRED' : 'Near Expiry'}
                    </span>
                  </div>
                  <h3 className="font-black text-sm">{item.title}</h3>
                  <p className="text-xs opacity-60 font-mono mt-0.5">SKU: {item.sku}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-current/15 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span>Expiry Date:</span>
                    <span className={`font-black ${item.isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Batch Quantity:</span>
                    <span className="font-bold">{item.quantity} pcs</span>
                  </div>
                  {item.mrp > 0 && (
                    <div className="flex justify-between items-center opacity-80 text-[11px]">
                      <span>Batch MRP:</span>
                      <span>{formatINR(item.mrp)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modals */}
      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        onSuccess={() => {
          fetchAlerts();
          fetchProducts();
        }}
        initialProduct={selectedProductForAdj}
      />

      <BarcodeLabelGenerator
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
      />

      <BulkImportExportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => {
          fetchAlerts();
          fetchProducts();
        }}
      />
    </div>
  );
};

export default BatchExpiryManager;
