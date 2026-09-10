import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  UserPlus,
  Tag,
  Percent,
  CreditCard,
  Sparkles,
  Award,
  ChevronDown,
  X,
  Layers
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatINR, CURRENCY_SYMBOL } from '../../utils/formatters';
import { getContrastTextColor } from '../../utils/colorExtractor';

const Cart = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    discountValue,
    setDiscountValue,
    discountType,
    setDiscountType,
    taxRate,
    setTaxRate,
    useLoyaltyPoints,
    setUseLoyaltyPoints,
    coupons,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponDiscount,
    subtotal,
    totalDiscount,
    taxAmount,
    grandTotal,
    isCheckoutOpen,
    setIsCheckoutOpen,
    checkoutMethod,
    setCheckoutMethod,
    theme,
    currentUser
  } = usePOS();

  const isLight = theme === 'light';
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [showCouponsDropdown, setShowCouponsDropdown] = useState(false);

  return (
    <div className={`w-full sm:w-80 md:w-88 lg:w-96 max-w-full border-l flex flex-col justify-between h-full select-none shrink-0 transition-colors duration-300 min-w-0 ${
      isLight ? 'bg-[#f8eed1] border-[#d6b866] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fef3c7]'
    }`}>
      {/* Top Customer Bar */}
      <div className={`p-4 border-b ${
        isLight ? 'bg-[#f4e4b9] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[11px] font-bold tracking-wider uppercase ${
            isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'
          }`}>
            Customer Account
          </span>
          {selectedCustomer && (
            <button
              onClick={() => setSelectedCustomer(null)}
              className={`text-[10px] hover:underline font-bold ${
                isLight ? 'text-[#072618]' : 'text-amber-400'
              }`}
            >
              Change to Guest
            </button>
          )}
        </div>

        {/* Customer Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
              isLight
                ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14] hover:border-[#072618] shadow-sm'
                : 'bg-[#061a11] border-[#144833] text-[#fef08a] hover:border-[#1a5a40]'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                isLight
                  ? 'bg-[#072418] text-[#fef08a] border-[#072418]'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {selectedCustomer ? selectedCustomer.name.charAt(0) : <UserPlus className="w-3.5 h-3.5" />}
              </div>
              <div className="truncate">
                <p className={`font-semibold truncate ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
                  {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer (Guest)'}
                </p>
                {selectedCustomer && (
                  <p className="text-[10px] font-medium flex items-center gap-1 text-amber-500">
                    <Award className="w-3 h-3" />
                    {selectedCustomer.loyaltyPoints} Loyalty Points • {selectedCustomer.tier}
                  </p>
                )}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 shrink-0 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`} />
          </button>

          {/* Customer Dropdown List */}
          {showCustomerDropdown && (
            <div className={`absolute top-full left-0 right-0 mt-1 border rounded-xl shadow-2xl z-40 max-h-52 overflow-y-auto p-1.5 space-y-1 ${
              isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setShowCustomerDropdown(false);
                }}
                className={`w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-[#f4e4b9] text-[#051f14]' : 'hover:bg-[#0c2f21] text-[#fef3c7]'
                }`}
              >
                Walk-in Customer (Guest)
              </button>
              {customers.map((cust) => (
                <button
                  key={cust._id || cust.id}
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setShowCustomerDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-[#f4e4b9] text-[#051f14]' : 'hover:bg-[#0c2f21] text-[#fef3c7]'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{cust.name}</p>
                    <p className={`text-[10px] ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`}>{cust.phone}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]' : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                  }`}>
                    {cust.loyaltyPoints} pts
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loyalty Redeem Checkbox */}
        {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
          <div className={`mt-2.5 p-2 rounded-xl border flex items-center justify-between text-xs ${
            isLight
              ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]'
              : 'bg-[#09251a] border-amber-500/40 text-[#fde047]'
          }`}>
            <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold">
              <input
                type="checkbox"
                checked={useLoyaltyPoints}
                onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                className="rounded border-amber-500/50 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span>Redeem {selectedCustomer.loyaltyPoints} Points</span>
            </label>
            <span className="font-bold text-[11px]">-{formatINR(selectedCustomer.loyaltyPoints)}</span>
          </div>
        )}
      </div>

      {/* Cart Line Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className={`flex items-center justify-between pb-2 border-b ${
          isLight ? 'border-[#d6b866]/60' : 'border-[#144833]'
        }`}>
          <span className={`text-xs font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
            Cart Items ({cart.length})
          </span>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className={`text-[10px] transition-colors flex items-center gap-1 cursor-pointer ${
                isLight ? 'text-[#0f442e] hover:text-rose-700' : 'text-[#fde047]/70 hover:text-rose-400'
              }`}
            >
              <Trash2 className="w-3 h-3" /> Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className={`h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-2xl ${
            isLight ? 'border-[#c8a74e] bg-[#f4e4b9]/50' : 'border-[#144833] bg-[#09251a]/40'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              isLight ? 'bg-[#ebd89f] text-[#072618]' : 'bg-[#061a11] text-amber-400'
            }`}>
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className={`text-xs font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>Your cart is currently empty</p>
            <p className={`text-[10px] mt-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`}>Select retail products from the catalog to begin billing</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className={`p-3 rounded-2xl border flex items-center gap-3 group transition-all ${
                isLight
                  ? 'bg-[#fffaf0] border-[#d6b866] hover:border-[#072618]'
                  : 'bg-[#09251a]/90 border-[#144833] hover:border-amber-400/50'
              }`}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title || item.productTitle}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  className={`w-12 h-12 object-cover rounded-xl border shrink-0 ${
                    isLight ? 'border-[#d6b866]' : 'border-[#144833]'
                  }`}
                />
              ) : (
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 uppercase ${
                  isLight ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#072618]' : 'bg-[#061a11] border-[#144833] text-amber-400'
                }`}>
                  {(item.title || item.productTitle || 'P').charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className={`text-xs font-bold truncate ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
                  {item.title || item.productTitle}
                </h4>

                {/* Attributes or SKU */}
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {item.attributes && item.attributes.length > 0 ? (
                    item.attributes.map((attr, aIdx) => (
                      <span
                        key={aIdx}
                        className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${
                          isLight
                            ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]'
                            : 'bg-[#061a11] text-amber-300 border-[#144833]'
                        }`}
                      >
                        {attr.name}: {attr.value}
                      </span>
                    ))
                  ) : item.size || item.color ? (
                    <>
                      {item.size && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                          isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]' : 'bg-[#061a11] text-amber-400 border-[#144833]'
                        }`}>
                          {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                          isLight ? 'bg-[#f4e4b9] text-[#051f14]' : 'bg-[#061a11] text-[#fef08a]'
                        }`}>
                          {item.color}
                        </span>
                      )}
                    </>
                  ) : item.sku ? (
                    <span className={`text-[9px] font-mono ${isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'}`}>
                      {item.sku}
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className={`text-xs font-black ${isLight ? 'text-[#051f14]' : 'text-amber-400'}`}>
                    {formatINR(item.itemTotal)}
                  </span>
                  <span className={`text-[10px] ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`}>
                    {formatINR(item.unitPrice)} / {item.unit || 'unit'}
                  </span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className={`flex items-center gap-1 border rounded-lg p-0.5 ${
                  isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#061a11] border-[#144833]'
                }`}>
                  <button
                    onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isLight ? 'text-[#051f14] hover:bg-[#ebd89f]' : 'text-[#fde047] hover:bg-[#0c2f21]'
                    }`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className={`w-5 text-center text-xs font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isLight ? 'text-[#051f14] hover:bg-[#ebd89f]' : 'text-[#fde047] hover:bg-[#0c2f21]'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(idx)}
                  className="text-rose-500 hover:text-rose-700 transition-colors p-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Billing Breakdown */}
      <div className={`p-4 border-t space-y-3 ${
        isLight ? 'bg-[#f4e4b9] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
      }`}>
        {/* Promo Coupon Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'
            }`}>
              <Tag className={`w-3 h-3 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
              <span>Coupon Code</span>
            </label>
            {!appliedCoupon && coupons.filter(c => c.isActive).length > 0 && (
              <button
                type="button"
                onClick={() => setShowCouponsDropdown(!showCouponsDropdown)}
                className={`text-[10px] hover:underline font-bold cursor-pointer ${
                  isLight ? 'text-[#072618]' : 'text-amber-400'
                }`}
              >
                {showCouponsDropdown ? 'Hide Offers' : `Available Offers (${coupons.filter(c => c.isActive).length})`}
              </button>
            )}
          </div>

          {appliedCoupon ? (
            <div className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
              isLight
                ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2 overflow-hidden">
                <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <span className="font-mono font-black text-[11px] tracking-wider">{appliedCoupon.coupon.code}</span>
                  <span className="text-[10px] opacity-80 block truncate">
                    {appliedCoupon.coupon.discountType === 'percent'
                      ? `${appliedCoupon.coupon.discountValue}% OFF`
                      : `Flat ${formatINR(appliedCoupon.coupon.discountValue)} OFF`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-black text-xs">-{formatINR(couponDiscount)}</span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="p-1 rounded-lg hover:bg-emerald-200/50 cursor-pointer"
                  title="Remove coupon"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className={`flex items-center border rounded-xl overflow-hidden ${
                isLight ? 'bg-[#fffaf0] border-[#c8a74e]' : 'bg-[#061a11] border-[#144833]'
              }`}>
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="Enter Code (e.g. FESTIVE20)"
                  className={`w-full bg-transparent px-2.5 py-1.5 text-xs font-mono uppercase focus:outline-none ${
                    isLight ? 'text-[#051f14] placeholder-[#0f442e]/60' : 'text-[#fde047] placeholder-[#fbbf24]/50'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyCoupon(couponInput);
                      setCouponInput('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    applyCoupon(couponInput);
                    setCouponInput('');
                  }}
                  disabled={!couponInput.trim()}
                  className={`px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 transition-colors cursor-pointer shrink-0 ${
                    isLight
                      ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a]'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black'
                  }`}
                >
                  Apply
                </button>
              </div>

              {/* Quick Pick Offers Drawer */}
              {showCouponsDropdown && (
                <div className={`max-h-36 overflow-y-auto p-1.5 border rounded-xl space-y-1 ${
                  isLight ? 'bg-[#fffaf0] border-[#d6b866] shadow-lg' : 'bg-[#09251a] border-[#1a5a40] shadow-xl'
                }`}>
                  {coupons.filter(c => c.isActive).map(c => (
                    <div
                      key={c._id || c.id}
                      onClick={() => {
                        applyCoupon(c.code);
                        setShowCouponsDropdown(false);
                      }}
                      className={`p-1.5 rounded-lg border text-left cursor-pointer transition-colors flex items-center justify-between ${
                        isLight
                          ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] border-[#d6b866]'
                          : 'bg-[#061a11] hover:bg-[#0c2f21] border-[#144833]'
                      }`}
                    >
                      <div>
                        <span className={`font-mono font-bold text-[11px] ${
                          isLight ? 'text-[#072618]' : 'text-amber-400'
                        }`}>{c.code}</span>
                        <p className={`text-[9px] ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`}>
                          {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `Flat ${formatINR(c.discountValue)} OFF`}
                          {c.minOrderAmount > 0 ? ` (Min ${formatINR(c.minOrderAmount)})` : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold hover:underline ${
                        isLight ? 'text-[#072618]' : 'text-amber-400'
                      }`}>Apply</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Discount & Tax Controls */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className={`text-[10px] font-semibold block mb-1 ${
              isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'
            }`}>Discount</label>
            <div className={`flex items-center border rounded-xl overflow-hidden ${
              isLight ? 'bg-[#fffaf0] border-[#c8a74e]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              <input
                type="number"
                min="0"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder="0"
                className={`w-full bg-transparent px-2 py-1.5 text-xs focus:outline-none ${
                  isLight ? 'text-[#051f14]' : 'text-[#fde047]'
                }`}
              />
              <button
                onClick={() => setDiscountType(discountType === 'fixed' ? 'percent' : 'fixed')}
                className={`px-2 py-1.5 text-[10px] font-bold border-l transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e] hover:bg-[#ebd89f]'
                    : 'bg-[#09251a] text-amber-400 border-[#144833] hover:bg-[#0c2f21]'
                }`}
              >
                {discountType === 'fixed' ? CURRENCY_SYMBOL : '%'}
              </button>
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-semibold block mb-1 ${
              isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'
            }`}>GST Rate (%)</label>
            <input
              type="number"
              min="0"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className={`w-full border rounded-xl px-2 py-1.5 text-xs focus:outline-none ${
                isLight ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
              }`}
            />
          </div>
        </div>

        {/* Responsive Summary Table / Calculation Breakdown */}
        <div className="w-full overflow-x-auto min-w-0 py-0.5 no-scrollbar">
          <div className={`min-w-[220px] sm:min-w-0 w-full rounded-xl p-3 border space-y-2 text-xs transition-colors ${
            isLight ? 'bg-[#fffaf0]/80 border-[#d6b866]' : 'bg-[#061a11]/80 border-[#144833]'
          }`}>
            <div className={`flex items-center justify-between gap-2 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
              <span className="truncate">Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className={`font-semibold shrink-0 ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>{formatINR(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className={`flex items-center justify-between gap-2 font-semibold ${
                isLight ? 'text-[#072618]' : 'text-amber-400'
              }`}>
                <span className="truncate">Coupon ({appliedCoupon?.coupon?.code})</span>
                <span className="shrink-0">-{formatINR(couponDiscount)}</span>
              </div>
            )}
            {totalDiscount > 0 && (
              <div className="flex items-center justify-between gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="truncate">Total Savings</span>
                <span className="shrink-0">-{formatINR(totalDiscount)}</span>
              </div>
            )}
            <div className={`flex items-center justify-between gap-2 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
              <span className="truncate">GST / Tax ({taxRate}%)</span>
              <span className={`font-semibold shrink-0 ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>{formatINR(taxAmount)}</span>
            </div>
          </div>
        </div>

        {/* Total Amount Due Display - High Visual Hierarchy */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-lg transition-all my-1 sm:my-2 ${
          isLight
            ? 'bg-gradient-to-br from-[#fffaf0] via-[#f8eed1] to-[#f4e4b9] border-[#c8a74e] shadow-[#072418]/10'
            : 'bg-gradient-to-br from-[#0c2f21] via-[#09251a] to-[#061a11] border-amber-500/40 shadow-amber-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${
              isLight ? 'text-[#0f442e]' : 'text-amber-400/90'
            }`}>
              Total Amount Due
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isLight
                ? 'bg-[#072418] text-[#fef08a] border-[#072418]'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {cart.reduce((s, i) => s + i.quantity, 0)} Items
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isLight ? 'text-[#072618]' : 'text-amber-300'
            }`}>
              {formatINR(grandTotal)}
            </h2>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${
              isLight ? 'text-[#0f442e]/80' : 'text-[#fde047]/60'
            }`}>
              Net Payable
            </span>
          </div>
        </div>

        {/* Action Buttons: High-contrast Primary (Pay Now) and Secondary (Split Bill) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
          {/* Secondary Button: Split Bill */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              setCheckoutMethod('Split');
              setIsCheckoutOpen(true);
            }}
            className={`w-full py-3 sm:py-3.5 px-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm ${
              isLight
                ? 'bg-[#fffaf0] hover:bg-[#f4e4b9] text-[#072618] border-2 border-[#072418] hover:border-[#0c3924]'
                : 'bg-[#061a11] hover:bg-[#0c2f21] text-amber-300 border-2 border-amber-400/80 hover:border-amber-300'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Split Bill</span>
          </button>

          {/* Primary Button: Pay Now */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              setCheckoutMethod('Cash');
              setIsCheckoutOpen(true);
            }}
            style={
              currentUser?.themeColors?.primary && cart.length > 0
                ? {
                    backgroundColor: currentUser.themeColors.primary,
                    color: getContrastTextColor(currentUser.themeColors.primary),
                    boxShadow: `0 8px 20px ${currentUser.themeColors.primary}40`
                  }
                : undefined
            }
            className={`w-full py-3 sm:py-3.5 px-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xl hover:brightness-105 ${
              !currentUser?.themeColors?.primary || cart.length === 0
                ? isLight
                  ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/30 ring-1 ring-[#072418]'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-500/30 ring-1 ring-amber-400/50'
                : ''
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Pay Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
