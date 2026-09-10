import React, { useState, useRef, useEffect } from 'react';
import { Package, Search, Plus, Barcode, ScanLine, X, ChevronDown, Check } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatINR } from '../../utils/formatters';
import ProductCard from './ProductCard';
import VariantModal from './VariantModal';
import CheckoutModal from './CheckoutModal';
import ReceiptModal from './ReceiptModal';

const POSTerminal = () => {
  const {
    products,
    categories,
    loadingProducts,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    isCheckoutOpen,
    setIsCheckoutOpen,
    checkoutMethod,
    isReceiptOpen,
    setIsReceiptOpen,
    lastOrder,
    theme,
    setActiveTab,
    addToCart,
    showToast
  } = usePOS();

  const isLight = theme === 'light';
  const [activeDetailProduct, setActiveDetailProduct] = useState(null);
  const [barcodeScanInput, setBarcodeScanInput] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for the live search dropdown
  const searchResults = searchQuery.trim()
    ? products.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 8)
    : [];

  // Handle direct barcode scanner submission (hardware scanner or manual enter)
  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeScanInput.trim();
      if (!code) return;

      const foundProduct = products.find(p =>
        (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === code.toLowerCase())
      );

      if (foundProduct) {
        addToCart(foundProduct);
        setBarcodeScanInput('');
        showToast(`Scanned and added "${foundProduct.title}" to cart`, 'success');
      } else {
        showToast(`No item matching barcode / SKU "${code}"`, 'warning');
      }
    }
  };

  // Combine dynamic categories with 'All'
  const categoryList = ['All', ...categories];

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden select-none transition-colors duration-300 min-w-0 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Filters Header Bar: Horizontally Aligned Search Dropdown & Barcode Input */}
      <div className={`p-3 sm:p-4 border-b space-y-3 shrink-0 transition-colors duration-300 ${
        isLight ? 'bg-[#f8eed1]/95 border-[#d6b866]' : 'bg-[#09251a]/90 border-[#144833]'
      }`}>
        {/* Horizontal Alignment: Search Dropdown/Input + Barcode Scan Field */}
        <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
          {/* Item Search Dropdown & Input */}
          <div ref={searchContainerRef} className="relative flex-1 min-w-0">
            <Search className={`w-4 h-4 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'
            }`} />
            <input
              type="text"
              placeholder="Search items by name, SKU, or category..."
              value={searchQuery}
              onFocus={() => { if (searchQuery.trim()) setShowSearchDropdown(true); }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(e.target.value.trim().length > 0);
              }}
              className={`w-full pl-9 sm:pl-10 pr-8 py-2 sm:py-2.5 rounded-xl border text-xs font-medium focus:outline-none transition-all ${
                isLight
                  ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14] focus:border-[#072618] placeholder-[#0f442e]/50'
                  : 'bg-[#061a11] border-[#144833] text-[#fef08a] focus:border-amber-400 placeholder-[#fbbf24]/40'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:opacity-75 ${
                  isLight ? 'text-[#072618]' : 'text-amber-400'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Interactive Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl border shadow-2xl overflow-hidden max-h-72 overflow-y-auto ${
                isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#1a5a40]'
              }`}>
                <div className={`px-3 py-1.5 border-b text-[10px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-[#f4e4b9] text-[#0f442e] border-[#d6b866]' : 'bg-[#061a11] text-amber-400 border-[#144833]'
                }`}>
                  Matching Items ({searchResults.length})
                </div>
                <div className="p-1 space-y-0.5">
                  {searchResults.map((prod) => (
                    <div
                      key={prod._id || prod.id}
                      onClick={() => {
                        addToCart(prod);
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isLight ? 'hover:bg-[#f4e4b9] text-[#051f14]' : 'hover:bg-[#0c2f21] text-[#fef3c7]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {prod.image ? (
                          <img src={prod.image} alt={prod.title} className="w-8 h-8 rounded-lg object-cover border shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                            isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]' : 'bg-[#061a11] text-amber-400 border-[#144833]'
                          }`}>
                            {prod.title.charAt(0)}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold truncate">{prod.title}</p>
                          <p className={`text-[10px] ${isLight ? 'text-[#0f442e]/80' : 'text-[#fde047]/60'}`}>
                            {prod.sku ? `SKU: ${prod.sku} • ` : ''}{prod.category || 'General'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-black ${isLight ? 'text-[#072618]' : 'text-amber-400'}`}>
                          {formatINR(prod.price)}
                        </span>
                        <button
                          type="button"
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            isLight
                              ? 'bg-[#072418] text-[#fef08a] border-[#072418]'
                              : 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                          }`}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Barcode Scanner Input Field - Horizontally Aligned */}
          <div className="relative w-40 sm:w-60 md:w-72 shrink-0">
            <Barcode className={`w-4 h-4 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 ${
              isLight ? 'text-[#072618]' : 'text-amber-400'
            }`} />
            <input
              type="text"
              placeholder="Barcode [Enter]"
              value={barcodeScanInput}
              onChange={(e) => setBarcodeScanInput(e.target.value)}
              onKeyDown={handleBarcodeScan}
              className={`w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none transition-all ${
                isLight
                  ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14] focus:border-[#072618] placeholder-[#0f442e]/50'
                  : 'bg-[#061a11] border-[#144833] text-[#fef08a] focus:border-amber-400 placeholder-[#fbbf24]/40'
              }`}
            />
          </div>
        </div>

        {/* Dynamic Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className={`text-[10px] font-bold uppercase tracking-wider mr-1 shrink-0 ${
            isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'
          }`}>
            Category:
          </span>
          {categoryList.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? isLight
                      ? 'bg-[#072418] text-[#fef08a] shadow-md shadow-[#072418]/25 font-bold'
                      : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-[#051a10] font-black shadow-md shadow-amber-500/30'
                    : isLight
                    ? 'bg-[#f4e4b9] border border-[#c8a74e] text-[#051f14] hover:bg-[#ebd89f]'
                    : 'bg-[#061a11] border border-[#144833] text-[#fde047]/80 hover:text-[#fef08a] hover:border-[#1a5a40]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loadingProducts ? (
          <div className={`h-64 flex flex-col items-center justify-center text-center ${
            isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'
          }`}>
            <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-3 ${
              isLight ? 'border-[#072618]' : 'border-amber-400'
            }`}></div>
            <p className="text-xs font-semibold">Loading product catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className={`h-72 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-3xl ${
            isLight ? 'border-[#c8a74e] bg-[#f8eed1]' : 'border-[#144833] bg-[#09251a]/40'
          }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
              isLight ? 'bg-[#f4e4b9] text-[#072618]' : 'bg-[#061a11] text-amber-400 border border-[#144833]'
            }`}>
              <Package className="w-7 h-7" />
            </div>
            <p className={`text-sm font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
              {selectedCategory !== 'All' ? `No products found in "${selectedCategory}"` : 'Your store catalog is currently empty'}
            </p>
            <p className={`text-xs mt-1 max-w-sm ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
              Add your retail inventory items, prices, barcodes, and stock in the Inventory tab to start selling.
            </p>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isLight
                  ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-md shadow-[#072418]/20'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
              }`}
            >
              + Go to Inventory & Add Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((prod) => (
              <ProductCard
                key={prod._id || prod.id}
                product={prod}
                onAddToCart={(product) => addToCart(product)}
                onViewDetails={(product) => setActiveDetailProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Quick Options / Details Modal */}
      {activeDetailProduct && (
        <VariantModal
          product={activeDetailProduct}
          onClose={() => setActiveDetailProduct(null)}
        />
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          initialMethod={checkoutMethod}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

      {/* Thermal Receipt Modal */}
      {isReceiptOpen && lastOrder && (
        <ReceiptModal
          order={lastOrder}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </div>
  );
};

export default POSTerminal;
