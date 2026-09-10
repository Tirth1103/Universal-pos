import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Share2,
  Trash2,
  Calendar,
  Percent,
  IndianRupee,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  X,
  MessageCircle,
  Clock,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { couponAPI } from '../../services/api';
import { formatINR } from '../../utils/formatters';

const CouponManager = () => {
  const { coupons, fetchCoupons, showToast, theme } = usePOS();
  const isLight = theme === 'light';

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'percent', 'fixed'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for creating a new coupon
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discountType: 'percent',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    expiryDate: '',
    usageLimit: ''
  });

  // Filtered list
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.title && c.title.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === 'all' || c.discountType === filterType;
    return matchesSearch && matchesType;
  });

  // Copy code to clipboard
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon "${code}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(''), 2500);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (coupon) => {
    const discountText =
      coupon.discountType === 'percent'
        ? `${coupon.discountValue}% OFF`
        : `Flat ${formatINR(coupon.discountValue)} OFF`;
    const minText =
      coupon.minOrderAmount > 0
        ? ` on orders above ${formatINR(coupon.minOrderAmount)}`
        : '';
    const message = encodeURIComponent(
      `🎉 Special Offer from SATVASTRA (Men's Wear & Accessories), Bhuj!\nUse coupon code: *${coupon.code}* to get *${discountText}*${minText}!\nVisit our store today!`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  // Toggle active status
  const handleToggleStatus = async (id) => {
    try {
      const res = await couponAPI.toggleStatus(id);
      if (res.data?.success) {
        showToast(
          `Coupon status updated to ${res.data.data.isActive ? 'Active' : 'Disabled'}`,
          'info'
        );
        fetchCoupons();
      }
    } catch (err) {
      showToast('Failed to toggle coupon status', 'error');
    }
  };

  // Delete coupon
  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      const res = await couponAPI.delete(id);
      if (res.data?.success) {
        showToast(`Coupon "${code}" deleted successfully`, 'success');
        fetchCoupons();
      }
    } catch (err) {
      showToast('Failed to delete coupon', 'error');
    }
  };

  // Create new coupon submit
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      showToast('Code and discount value are required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : 0,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : 0
      };

      const res = await couponAPI.create(payload);
      if (res.data?.success) {
        showToast(`Coupon "${payload.code}" created successfully!`, 'success');
        setIsCreateModalOpen(false);
        setFormData({
          code: '',
          title: '',
          discountType: 'percent',
          discountValue: '',
          minOrderAmount: '',
          maxDiscountAmount: '',
          expiryDate: '',
          usageLimit: ''
        });
        fetchCoupons();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create coupon', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const activeCount = coupons.filter(c => c.isActive).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.timesUsed || 0), 0);

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]' : 'bg-[#061a11] text-amber-400 border-[#144833]'
            }`}>
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl font-black tracking-tight ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
                Promotional Coupons & Discounts
              </h2>
              <p className={`text-xs ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                Create promo codes, define discount rules, and distribute offers to customers.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer self-start sm:self-auto ${
            isLight
              ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] shadow-amber-500/30'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
        }`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
            Total Active Coupons
          </span>
          <div className="flex items-center justify-between mt-2">
            <h3 className={`text-2xl font-black ${isLight ? 'text-[#051f14]' : 'text-amber-400'}`}>{activeCount}</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
              isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]' : 'bg-[#061a11] text-amber-400 border-[#144833]'
            }`}>
              {coupons.length} Total
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
        }`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
            Total Times Redeemed
          </span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalUses}</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
            }`}>
              Redemptions
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
        }`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
            Ready to Distribute
          </span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-black text-amber-500">{activeCount > 0 ? 'Ready' : 'None'}</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
              isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-950 text-amber-300 border-amber-500/30'
            }`}>
              WhatsApp / SMS
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-[#0f442e]' : 'text-[#fbbf24]/70'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by coupon code (e.g. FESTIVE20) or title..."
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none transition-all ${
              isLight
                ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/60 shadow-sm focus:border-[#072618]'
                : 'bg-[#061a11] border-[#144833] text-[#fde047] placeholder-[#fbbf24]/50 focus:border-amber-400'
            }`}
          />
        </div>

        <div className={`flex items-center border rounded-xl p-1 shrink-0 ${
          isLight ? 'bg-[#fffaf0] border-[#c8a74e]' : 'bg-[#061a11] border-[#144833]'
        }`}>
          {[
            { id: 'all', label: 'All Discounts' },
            { id: 'percent', label: '% Percentage' },
            { id: 'fixed', label: '₹ Flat Rupee' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === tab.id
                  ? isLight
                    ? 'bg-[#072418] text-[#fef08a] shadow-sm'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 shadow-sm'
                  : isLight ? 'text-[#083020] hover:text-[#041a10]' : 'text-[#fde047]/70 hover:text-[#fef08a]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupon Cards Grid */}
      {filteredCoupons.length === 0 ? (
        <div className={`h-72 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-3xl ${
          isLight ? 'border-[#c8a74e] bg-[#fffaf0]' : 'border-[#144833] bg-[#09251a]/30'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
            isLight ? 'bg-[#f4e4b9] text-[#072618]' : 'bg-[#061a11] text-amber-400'
          }`}>
            <Tag className="w-7 h-7" />
          </div>
          <p className={`text-sm font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
            No promotional coupons found
          </p>
          <p className={`text-xs mt-1 max-w-sm ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
            Create your first coupon code to offer special festival or seasonal discounts to customers at checkout.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className={`mt-4 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-lg ${
              isLight
                ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] shadow-amber-500/30'
            }`}
          >
            + Create Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => {
            const cid = coupon._id || coupon.id;
            const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
            const isLimitReached = coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit;
            const isCopied = copiedCode === coupon.code;

            return (
              <div
                key={cid}
                className={`relative rounded-3xl border p-5 flex flex-col justify-between transition-all duration-300 shadow-sm ${
                  !coupon.isActive || isExpired || isLimitReached
                    ? isLight ? 'bg-[#f4e4b9]/50 border-[#d6b866]/50 opacity-75' : 'bg-[#09251a]/40 border-[#144833]/60 opacity-60'
                    : isLight
                    ? 'bg-[#fffaf0] border-[#d6b866] hover:border-[#072618] hover:shadow-xl'
                    : 'bg-[#09251a] border-[#144833] hover:border-amber-400/50 hover:shadow-xl'
                }`}
              >
                <div>
                  {/* Top Row: Badge & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 border ${
                      isLight
                        ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]'
                        : 'bg-[#061a11] text-amber-300 border-[#144833]'
                    }`}>
                      {coupon.discountType === 'percent' ? (
                        <>
                          <Percent className="w-3 h-3" /> {coupon.discountValue}% OFF
                        </>
                      ) : (
                        <>
                          <IndianRupee className="w-3 h-3" /> {formatINR(coupon.discountValue)} OFF
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(cid)}
                      className="flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors"
                      title={coupon.isActive ? 'Click to disable' : 'Click to activate'}
                    >
                      {coupon.isActive ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <ToggleRight className="w-5 h-5" /> Active
                        </span>
                      ) : (
                        <span className={isLight ? 'text-[#0f442e]/60 flex items-center gap-1' : 'text-[#fde047]/40 flex items-center gap-1'}>
                          <ToggleLeft className="w-5 h-5" /> Disabled
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Coupon Code Block */}
                  <div className={`p-3 rounded-2xl border flex items-center justify-between font-mono ${
                    isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
                  }`}>
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`}>Code</p>
                      <p className={`text-base font-black tracking-wider ${isLight ? 'text-[#072618]' : 'text-amber-400'}`}>{coupon.code}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className={`p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : isLight ? 'bg-[#fffaf0] hover:bg-[#ebd89f] text-[#051f14] border border-[#c8a74e]' : 'bg-[#09251a] hover:bg-[#0c2f21] text-[#fef08a]'
                      }`}
                      title="Copy code to clipboard"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Title & Terms */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    {coupon.title && (
                      <p className={`font-bold ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
                        {coupon.title}
                      </p>
                    )}
                    <div className={`space-y-1 text-[11px] ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                      <p className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3 h-3 opacity-60" />
                        <span>Min Purchase: <strong>{coupon.minOrderAmount > 0 ? formatINR(coupon.minOrderAmount) : 'None'}</strong></span>
                      </p>
                      {coupon.discountType === 'percent' && coupon.maxDiscountAmount > 0 && (
                        <p className="flex items-center gap-1.5">
                          <IndianRupee className="w-3 h-3 opacity-60" />
                          <span>Max Discount Cap: <strong>{formatINR(coupon.maxDiscountAmount)}</strong></span>
                        </p>
                      )}
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 opacity-60" />
                        <span>
                          Expires:{' '}
                          <strong>
                            {coupon.expiryDate
                              ? new Date(coupon.expiryDate).toLocaleDateString('en-IN')
                              : 'Never'}
                          </strong>
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                  isLight ? 'border-[#d6b866]/50' : 'border-[#144833]'
                }`}>
                  <span className={`text-[11px] font-semibold ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Used: <strong>{coupon.timesUsed || 0}</strong> {coupon.usageLimit > 0 ? `/ ${coupon.usageLimit}` : 'times'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleShareWhatsApp(coupon)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Share offer on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>

                    <button
                      onClick={() => handleDelete(cid, coupon.code)}
                      className="p-1.5 rounded-xl transition-colors text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Coupon Modal */}
      {isCreateModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
          isLight ? 'bg-[#051f14]/40' : 'bg-[#05170f]/85'
        }`}>
          <div className={`border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transition-colors ${
            isLight ? 'bg-[#fffaf0] border-[#d6b866] text-[#051f14]' : 'bg-[#09251a] border-[#144833] text-[#fef3c7]'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
                <Tag className={`w-4 h-4 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
                Create New Coupon Code
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  isLight ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14]' : 'bg-[#061a11] hover:bg-[#0c2f21] text-[#fef08a]'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    placeholder="e.g. FESTIVE20 or WELCOME100"
                    className={`w-full border rounded-xl px-3 py-2 uppercase font-mono font-bold tracking-wider focus:outline-none ${
                      isLight
                        ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/60 focus:border-[#072618]'
                        : 'bg-[#061a11] border-[#144833] text-[#fde047] placeholder-[#fbbf24]/50 focus:border-amber-400'
                    }`}
                  />
                </div>

                <div className="col-span-2">
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Promotion Title / Description
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Festive Discount 20% Off on all Products"
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight
                        ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/60 focus:border-[#072618]'
                        : 'bg-[#061a11] border-[#144833] text-[#fde047] placeholder-[#fbbf24]/50 focus:border-amber-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  >
                    <option value="percent">% Percentage Discount</option>
                    <option value="fixed">₹ Flat Rupee Discount</option>
                  </select>
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Discount Value ({formData.discountType === 'percent' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.discountType === 'percent' ? '100' : undefined}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === 'percent' ? '20' : '150'}
                    className={`w-full border rounded-xl px-3 py-2 font-bold focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Min Purchase Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    placeholder="e.g. 999 (0 for any)"
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>

                {formData.discountType === 'percent' && (
                  <div>
                    <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="e.g. 500 (0 for no cap)"
                      className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                        isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                      }`}
                    />
                  </div>
                )}

                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Usage Limit (Max Uses)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="0 for unlimited"
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>
              </div>

              <div className={`pt-4 border-t flex justify-end gap-3 ${isLight ? 'border-[#d6b866]' : 'border-[#144833]'}`}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                    isLight ? 'bg-[#f4e4b9] text-[#051f14] hover:bg-[#ebd89f] border border-[#c8a74e]' : 'bg-[#061a11] text-[#fef08a] hover:bg-[#0c2f21] border border-[#144833]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-xl font-black shadow-lg cursor-pointer disabled:opacity-50 ${
                    isLight
                      ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
                      : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] shadow-amber-500/30'
                  }`}
                >
                  {isSubmitting ? 'Creating...' : 'Save & Publish Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManager;
