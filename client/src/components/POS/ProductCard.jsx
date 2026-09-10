import React from 'react';
import { Plus, Info, Layers, Tag } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatINR } from '../../utils/formatters';

const ProductCard = ({ product, onAddToCart, onViewDetails, onSelectVariant }) => {
  const { theme, addToCart } = usePOS();
  const isLight = theme === 'light';

  const stock = product.stock !== undefined ? product.stock : (product.totalStock || 0);
  const minStockAlert = product.minStockAlert !== undefined ? product.minStockAlert : 5;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= minStockAlert;
  const unit = product.unit || 'pcs';
  const hasAttributes = Array.isArray(product.attributes) && product.attributes.length > 0;

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else if (onSelectVariant) {
      onSelectVariant(product);
    } else {
      addToCart(product);
    }
  };

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
    } else if (onSelectVariant) {
      onSelectVariant(product);
    }
  };

  return (
    <div
      onClick={hasAttributes ? handleDetailsClick : handleAddClick}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between border cursor-pointer ${
        isLight
          ? 'bg-[#fffaf0] border-[#d6b866] shadow-sm hover:border-[#072618] hover:shadow-xl'
          : 'bg-[#09251a]/90 border-[#144833] hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/10'
      }`}
    >
      {/* Product Image */}
      <div className={`relative aspect-[4/3] w-full overflow-hidden ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#061a11]'}`}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-xs opacity-40 uppercase tracking-wider">
            {product.category || 'Retail Item'}
          </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-80 ${
          isLight ? 'from-[#fbf4dc]/60' : 'from-[#05170f]'
        }`} />

        {/* Category Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md border ${
            isLight
              ? 'bg-[#f4e4b9]/95 text-[#051f14] border-[#c8a74e] shadow-sm'
              : 'bg-[#061a11]/90 text-[#fef08a] border-[#1a5a40]'
          }`}>
            {product.category || 'General'}
          </span>
          {product.subcategory && (
            <span className={`hidden sm:inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold backdrop-blur-md border ${
              isLight
                ? 'bg-[#f8eed1]/95 text-[#083020] border-[#d6b866] shadow-sm'
                : 'bg-[#061a11]/90 text-[#fde047]/80 border-[#144833]'
            }`}>
              {product.subcategory}
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isOutOfStock ? (
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md border ${
              isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
            }`}>
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md border animate-pulse ${
              isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-950/90 text-amber-300 border-amber-500/40'
            }`}>
              Low: {stock} {unit}
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md border ${
              isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
            }`}>
              {stock} {unit}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {product.brand && (
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
              isLight ? 'text-[#0f442e]' : 'text-amber-400'
            }`}>
              {product.brand}
            </p>
          )}
          <h3 className={`text-xs font-semibold line-clamp-1 transition-colors ${
            isLight ? 'text-[#051f14] group-hover:text-[#072618]' : 'text-[#fef3c7] group-hover:text-amber-300'
          }`}>
            {product.title}
          </h3>
          <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'}`}>
            SKU: {product.sku}
          </p>

          {/* Quick Attribute Pills */}
          {hasAttributes && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {product.attributes.slice(0, 2).map((attr, idx) => (
                <span
                  key={idx}
                  className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${
                    isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]' : 'bg-[#061a11] text-amber-300 border-[#144833]'
                  }`}
                >
                  {attr.name}: {attr.value}
                </span>
              ))}
              {product.attributes.length > 2 && (
                <span className={`text-[9px] px-1 font-bold ${isLight ? 'text-[#0f442e]' : 'text-amber-400'}`}>
                  +{product.attributes.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & Add Action */}
        <div className={`mt-3 pt-2.5 border-t flex items-center justify-between ${
          isLight ? 'border-[#d6b866]/50' : 'border-[#144833]'
        }`}>
          <div>
            <span className={`text-[10px] block ${isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'}`}>
              Price
            </span>
            <span className={`text-sm font-black ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
              {formatINR(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddClick}
            disabled={isOutOfStock}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
              isOutOfStock
                ? isLight
                  ? 'bg-[#f4e4b9] text-[#051f14]/40 cursor-not-allowed border border-[#d6b866]'
                  : 'bg-[#061a11] text-[#fde047]/30 cursor-not-allowed border border-[#144833]'
                : isLight
                ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-md shadow-[#072418]/25 font-bold'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] font-black shadow-md shadow-amber-500/30'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
