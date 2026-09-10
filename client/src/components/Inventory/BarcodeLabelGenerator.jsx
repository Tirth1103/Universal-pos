import React, { useState } from 'react';
import { QrCode, Printer, X, Copy, Check } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatINR } from '../../utils/formatters';

// Clean deterministic Code-128 style barcode SVG generator
const SvgBarcode = ({ value = '12345678', height = 48 }) => {
  // Generate repeatable pseudo-binary bar pattern from string
  const bars = [];
  let code = value.toString().toUpperCase();
  if (!code) code = 'SKU-001';

  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) % 1000000;
  }

  // Create pattern of lines
  for (let i = 0; i < 48; i++) {
    const isThick = ((hash >> (i % 20)) & 1) === 1;
    const isSpace = ((hash >> ((i + 3) % 20)) & 1) === 1 && i % 3 === 0;
    if (!isSpace) {
      bars.push({ x: i * 3.5 + 10, width: isThick ? 2.5 : 1.2 });
    }
  }

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height={height} className="overflow-visible">
        {bars.map((b, idx) => (
          <rect key={idx} x={b.x} y="2" width={b.width} height={height - 12} fill="currentColor" />
        ))}
        <text x="100" y={height} textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" fontFamily="monospace">
          {code}
        </text>
      </svg>
    </div>
  );
};

const BarcodeLabelGenerator = ({ isOpen, onClose }) => {
  const { products, currentUser, theme } = usePOS();
  const isLight = theme === 'light';

  const [selectedProductId, setSelectedProductId] = useState(products[0]?._id || products[0]?.id || '');
  const [customSku, setCustomSku] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [copies, setCopies] = useState(12);
  const [layout, setLayout] = useState('sheet'); // 'sheet' or 'single'

  if (!isOpen) return null;

  const currentProduct = products.find(p => p._id === selectedProductId || p.id === selectedProductId);

  const skuToRender = customSku || currentProduct?.sku || 'SKU-001';
  const titleToRender = customTitle || currentProduct?.title || 'Product Label';
  const priceToRender = customPrice !== '' ? Number(customPrice) : (currentProduct?.price || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between print:hidden ${
          isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
        }`}>
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-black">SKU Barcode & Sticker Label Generator</h2>
              <p className="text-[11px] opacity-70">Design and print thermal adhesive barcode tags</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl cursor-pointer hover:bg-current/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls Bar */}
          <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs print:hidden ${
            isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
          }`}>
            <div>
              <label className="block font-bold uppercase mb-1">Pick Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setCustomSku('');
                  setCustomTitle('');
                  setCustomPrice('');
                }}
                className={`w-full p-2 rounded-xl border font-medium focus:outline-none ${
                  isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                }`}
              >
                {products.map(p => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.title} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">SKU / Barcode Text</label>
              <input
                type="text"
                value={customSku || currentProduct?.sku || ''}
                onChange={(e) => setCustomSku(e.target.value)}
                className={`w-full p-2 rounded-xl border font-bold focus:outline-none ${
                  isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Print Copies</label>
              <input
                type="number"
                min="1"
                max="60"
                value={copies}
                onChange={(e) => setCopies(Math.min(60, Math.max(1, Number(e.target.value))))}
                className={`w-full p-2 rounded-xl border font-bold focus:outline-none ${
                  isLight ? 'bg-[#fbf4dc] border-[#c8a74e]' : 'bg-[#05170f] border-[#1a5a40] text-white'
                }`}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handlePrint}
                className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-black shadow-lg cursor-pointer ${
                  isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'
                }`}
              >
                <Printer className="w-4 h-4" />
                Print Labels
              </button>
            </div>
          </div>

          {/* Sticker Preview Grid (Printable Area) */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider mb-2 print:hidden">
              Label Sheet Preview ({copies} Stickers)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white text-black p-6 rounded-2xl border border-dashed border-gray-400 print:p-0 print:border-none">
              {Array.from({ length: copies }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-gray-300 flex flex-col items-center justify-between text-center bg-white shadow-xs hover:border-black transition-colors"
                  style={{ width: '100%', minHeight: '130px' }}
                >
                  <span className="text-[10px] uppercase font-black tracking-widest text-gray-700">
                    {currentUser?.storeName || 'RETAIL STORE'}
                  </span>
                  <p className="text-xs font-bold truncate max-w-[160px] text-gray-900 mt-0.5">
                    {titleToRender}
                  </p>
                  <div className="my-1 text-black">
                    <SvgBarcode value={skuToRender} height={42} />
                  </div>
                  <span className="text-xs font-black text-black">
                    MRP: {formatINR(priceToRender)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeLabelGenerator;
