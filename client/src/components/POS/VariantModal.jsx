import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Check, Tag } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatINR } from '../../utils/formatters';

const VariantModal = ({ product, onClose }) => {
  const { addToCart, theme } = usePOS();
  const isLight = theme === 'light';

  const stock = product?.stock !== undefined ? product.stock : (product?.totalStock || 0);
  const unit = product?.unit || 'pcs';
  const attributes = Array.isArray(product?.attributes) ? product.attributes : [];
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isOutOfStock = stock <= 0;

  const handleAdd = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity);
      onClose();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
      isLight ? 'bg-[#051f14]/40' : 'bg-[#05170f]/80'
    }`}>
      <div className={`border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-colors duration-300 ${
        isLight ? 'bg-[#fffaf0] border-[#d6b866] text-[#051f14]' : 'bg-[#09251a] border-[#144833] text-[#fef3c7]'
      }`}>
        {/* Modal Header */}
        <div className={`p-5 border-b flex items-start justify-between ${
          isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
        }`}>
          <div className="flex items-center gap-3">
            {product.image ? (
              <img
                src={product.image}
                alt={product.title}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className={`w-14 h-14 object-cover rounded-xl border ${isLight ? 'border-[#d6b866]' : 'border-[#144833]'}`}
              />
            ) : (
              <div className={`w-14 h-14 rounded-xl border flex items-center justify-center font-black text-sm uppercase ${
                isLight ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#072618]' : 'bg-[#061a11] border-[#144833] text-amber-400'
              }`}>
                {(product.title || 'P').charAt(0)}
              </div>
            )}
            <div>
              {product.brand && (
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-[#0f442e]' : 'text-amber-400'}`}>
                  {product.brand}
                </span>
              )}
              <h3 className={`text-sm font-bold line-clamp-1 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
                {product.title}
              </h3>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatINR(product.price)} {unit ? `/ ${unit}` : ''}
              </p>
            </div>
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

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-left">
          {/* Product Identification Details */}
          <div className={`grid grid-cols-2 gap-2 p-3 rounded-2xl border text-xs ${
            isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
          }`}>
            <div>
              <span className={`text-[10px] block ${isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'}`}>SKU</span>
              <span className={`font-mono font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
                {product.sku || 'N/A'}
              </span>
            </div>
            <div>
              <span className={`text-[10px] block ${isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'}`}>Category</span>
              <span className={`font-semibold ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
                {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
              </span>
            </div>
          </div>

          {/* Product Attributes (if any) */}
          {attributes.length > 0 && (
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
              }`}>
                Product Specifications
              </label>
              <div className="flex flex-wrap gap-2">
                {attributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 ${
                      isLight
                        ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14]'
                        : 'bg-[#061a11] border-[#144833] text-[#fef08a]'
                    }`}
                  >
                    <span className="font-semibold opacity-70">{attr.name}:</span>
                    <span className="font-bold">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description (if any) */}
          {product.description && (
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
              }`}>
                Description
              </label>
              <p className={`text-xs ${isLight ? 'text-[#0f442e]/80' : 'text-[#fde047]/70'}`}>
                {product.description}
              </p>
            </div>
          )}

          {/* Stock & Quantity Selector */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
              }`}>
                Quantity to Add ({unit})
              </span>
              <span className={`text-xs font-bold ${
                isOutOfStock
                  ? 'text-rose-500'
                  : stock <= 5
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}>
                {isOutOfStock ? 'Out of Stock' : `${stock} ${unit} available`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center border rounded-2xl p-1 ${
                isLight ? 'bg-[#f8eed1] border-[#c8a74e]' : 'bg-[#061a11] border-[#144833]'
              }`}>
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className={`p-2 rounded-xl transition-all cursor-pointer disabled:opacity-30 ${
                    isLight ? 'hover:bg-[#ebd89f] text-[#051f14]' : 'hover:bg-[#0c2f21] text-[#fef08a]'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={stock}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setQuantity(Math.min(stock, Math.max(1, val)));
                  }}
                  className={`w-14 text-center font-black text-sm bg-transparent border-none focus:outline-none ${
                    isLight ? 'text-[#051f14]' : 'text-[#fef08a]'
                  }`}
                />
                <button
                  type="button"
                  disabled={quantity >= stock}
                  onClick={() => setQuantity(prev => Math.min(stock, prev + 1))}
                  className={`p-2 rounded-xl transition-all cursor-pointer disabled:opacity-30 ${
                    isLight ? 'hover:bg-[#ebd89f] text-[#051f14]' : 'hover:bg-[#0c2f21] text-[#fef08a]'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 text-right">
                <span className={`text-[10px] block ${isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'}`}>Item Total</span>
                <span className={`text-base font-black ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
                  {formatINR(product.price * quantity)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-5 border-t flex items-center justify-between ${
          isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isLight
                ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14] border border-[#c8a74e]'
                : 'bg-[#061a11] hover:bg-[#0c2f21] text-[#fef08a] border border-[#144833]'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-lg ${
              isLight
                ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] shadow-amber-500/30'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantModal;
