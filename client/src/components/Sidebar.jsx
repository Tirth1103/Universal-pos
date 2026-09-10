import React from 'react';
import {
  ShoppingBag,
  Package,
  Receipt,
  Users,
  BarChart3,
  Tag,
  Store,
  Palette,
  FileText,
  AlertOctagon,
  ShoppingCart,
  Truck,
  Landmark,
  Wallet,
  ShieldCheck,
  Award
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { formatINR } from '../utils/formatters';
import { getContrastTextColor } from '../utils/colorExtractor';

const Sidebar = () => {
  const {
    activeTab,
    setActiveTab,
    cart,
    theme,
    registerBalance,
    currentUser,
    setIsBrandingModalOpen
  } = usePOS();
  const isLight = theme === 'light';
  const brandPrimary = currentUser?.themeColors?.primary;
  const brandAccent = currentUser?.themeColors?.accent;
  const brandContrastText = brandPrimary ? getContrastTextColor(brandPrimary) : null;

  const navSections = [
    {
      title: 'Point of Sale & Billing',
      items: [
        { id: 'pos', label: 'POS Counter', icon: ShoppingBag, badge: cart.length > 0 ? cart.length : null },
        { id: 'documents', label: 'Invoices & Docs', icon: FileText },
        { id: 'orders', label: 'Sales History', icon: Receipt },
      ]
    },
    {
      title: 'Inventory & Stock',
      items: [
        { id: 'inventory', label: 'Product Catalog', icon: Package },
        { id: 'batchInventory', label: 'Batches & Expiry', icon: AlertOctagon },
      ]
    },
    {
      title: 'Purchases & Vendors',
      items: [
        { id: 'purchases', label: 'Purchase Bills', icon: ShoppingCart },
        { id: 'vendorKhata', label: 'Vendor Khata', icon: Truck },
      ]
    },
    {
      title: 'Parties & Khata',
      items: [
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'customerStatement', label: 'Customer Khata', icon: Award },
      ]
    },
    {
      title: 'GST, Finance & Audit',
      items: [
        { id: 'gst', label: 'GST & Tax Center', icon: Landmark },
        { id: 'finance', label: 'Cash & Accounts', icon: Wallet },
        { id: 'coupons', label: 'Offers & Coupons', icon: Tag },
        { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
        { id: 'audit', label: 'Security & Audit', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <aside className={`w-64 border-r flex flex-col justify-between p-3 select-none shrink-0 transition-colors duration-300 ${
      isLight ? 'bg-[#f8eed1] border-[#d6b866] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dynamic Brand Card in Sidebar */}
        <div
          onClick={() => setIsBrandingModalOpen && setIsBrandingModalOpen(true)}
          title="Click to customize store branding & theme"
          className={`p-2.5 rounded-2xl border mb-3 flex items-center gap-2.5 cursor-pointer group transition-transform active:scale-98 shrink-0 ${
            isLight ? 'bg-[#f4e4b9] border-[#c8a74e] hover:border-[#072418]' : 'bg-[#09251a] border-[#1a5a40] hover:border-amber-400/60'
          }`}
          style={brandPrimary ? { borderColor: `${brandPrimary}66` } : undefined}
        >
          <div
            className="w-10 h-10 rounded-xl overflow-hidden border shadow-sm shrink-0 flex items-center justify-center relative transition-all"
            style={{
              borderColor: brandPrimary || 'rgba(245, 158, 11, 0.4)',
              boxShadow: brandPrimary ? `0 0 8px ${brandPrimary}25` : undefined
            }}
          >
            {currentUser?.storeLogo ? (
              <img
                src={currentUser.storeLogo}
                alt={currentUser?.storeName || 'Store'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-black text-sm uppercase"
                style={{
                  backgroundColor: brandPrimary || '#10b981',
                  color: brandContrastText || '#ffffff'
                }}
              >
                {(currentUser?.storeName || 'P').charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Palette className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={`font-black text-xs tracking-wider truncate group-hover:underline ${
              isLight ? 'text-[#051f14]' : 'text-amber-300'
            }`}>
              {currentUser?.storeName || 'Universal Store'}
            </h2>
            <p className={`text-[10px] truncate ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
              {currentUser?.storeBranch || 'Main Branch'}
            </p>
            <span
              className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                isLight ? 'bg-[#ebd89f] text-[#072618] border-[#c8a74e]' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
              style={brandAccent ? {
                borderColor: `${brandAccent}55`,
                color: isLight ? undefined : brandAccent
              } : undefined}
            >
              {currentUser?.storeCategory || 'General Retail'}
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-2">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className={`px-2.5 text-[10px] font-black tracking-wider uppercase ${
                isLight ? 'text-[#0f442e]/80' : 'text-[#fde047]/60'
              }`}>
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={
                      isActive && brandPrimary
                        ? {
                            backgroundColor: brandPrimary,
                            color: brandContrastText,
                            boxShadow: `0 4px 12px ${brandPrimary}40`
                          }
                        : undefined
                    }
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? !brandPrimary
                          ? isLight
                            ? 'bg-[#072418] text-[#fef08a] shadow-sm shadow-[#072418]/25'
                            : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-[#051a10] font-black shadow-md shadow-amber-500/30'
                          : 'font-black'
                        : isLight
                        ? 'text-[#083020] hover:text-[#041a10] hover:bg-[#ebd9a5]'
                        : 'text-[#fde047]/80 hover:text-[#fef08a] hover:bg-[#0c2f21]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className="w-3.5 h-3.5 shrink-0"
                        style={{
                          color: isActive && brandPrimary ? brandContrastText : undefined
                        }}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[9px] font-bold shadow-xs shrink-0"
                        style={
                          brandAccent
                            ? {
                                backgroundColor: brandAccent,
                                color: getContrastTextColor(brandAccent)
                              }
                            : undefined
                        }
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Store Status Card */}
      <div className={`p-3.5 rounded-2xl border text-left ${
        isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[11px] font-bold truncate ${
            isLight ? 'text-[#051f14]' : 'text-[#fde047]'
          }`}>
            {currentUser?.storeName || 'Store Register'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
        </div>
        <p className={`text-[10px] ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
          {currentUser?.name || 'Operator'} • {currentUser?.role || 'Staff'}
        </p>
        <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
          isLight ? 'border-[#d6b866]/80 text-[#0f442e]' : 'border-[#144833] text-[#fde047]/70'
        }`}>
          <span>Register Balance</span>
          <span className={`font-black ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
            {formatINR(registerBalance || 0)}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
