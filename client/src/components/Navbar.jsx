import React from 'react';
import { Store, Search, RefreshCw, Sun, Moon, LogOut, User, Palette } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import BrandingModal from './Settings/BrandingModal';

const Navbar = () => {
  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    theme,
    toggleTheme,
    fetchProducts,
    fetchCategories,
    fetchCustomers,
    fetchDashboardStats,
    showToast,
    currentUser,
    isBrandingModalOpen,
    setIsBrandingModalOpen,
    logout
  } = usePOS();

  const isLight = theme === 'light';

  return (
    <>
      <header className={`h-16 border-b px-6 flex items-center justify-between z-30 select-none transition-colors duration-300 ${
        isLight ? 'bg-[#f8eed1]/95 border-[#d6b866] text-[#051f14]' : 'bg-[#061a11]/95 border-[#144833] text-[#fef3c7] backdrop-blur-md'
      }`}>
        {/* Dynamic Store Brand & Logo with Theme Settings Trigger */}
        <div
          onClick={() => setIsBrandingModalOpen(true)}
          title="Click to customize store logo & branding theme"
          className="flex items-center gap-3 cursor-pointer group transition-transform active:scale-98"
        >
          <div
            className={`relative w-11 h-11 rounded-xl overflow-hidden shadow-md border flex items-center justify-center shrink-0 transition-all ${
              isLight ? 'border-[#c8a74e] bg-[#fbf4dc]' : 'border-amber-500/40 bg-[#05170f]'
            }`}
            style={{
              borderColor: currentUser?.themeColors?.primary || undefined,
              boxShadow: currentUser?.themeColors?.primary ? `0 0 10px ${currentUser.themeColors.primary}33` : undefined
            }}
          >
            {currentUser?.storeLogo ? (
              <img
                src={currentUser.storeLogo}
                alt={currentUser?.storeName || 'Store Logo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-black text-base uppercase transition-colors"
                style={{
                  backgroundColor: currentUser?.themeColors?.primary || '#10b981',
                  color: '#ffffff'
                }}
              >
                {(currentUser?.storeName || 'P').charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Palette className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-black text-lg tracking-wider group-hover:underline ${
                isLight ? 'text-[#051f14]' : 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent'
              }`}>
                {currentUser?.storeName || 'Universal Retail POS'}
              </h1>
              {currentUser?.storeCategory && (
                <span
                  className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                    isLight ? 'bg-[#f3e3b7] text-[#051f14] border-[#c8a74e]' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                  style={currentUser?.themeColors?.accent ? {
                    borderColor: `${currentUser.themeColors.accent}66`,
                    color: isLight ? undefined : currentUser.themeColors.accent
                  } : undefined}
                >
                  {currentUser.storeCategory}
                </span>
              )}
            </div>
            <p className={`text-[10px] font-medium tracking-widest uppercase truncate max-w-[240px] flex items-center gap-1.5 ${
              isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'
            }`}>
              <span>{currentUser?.storeBranch ? `${currentUser.storeBranch} • Terminal` : 'Universal Retail POS Terminal'}</span>
              <span className="text-[9px] opacity-70 underline hidden md:inline">Edit Theme</span>
            </p>
          </div>
        </div>

      {/* Search Input (visible in POS & Inventory tabs) */}
      {(activeTab === 'pos' || activeTab === 'inventory') && (
        <div className="relative w-96">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
            isLight ? 'text-[#0f442e]' : 'text-[#fbbf24]/70'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, SKU, barcode, brand..."
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none transition-all ${
              isLight
                ? 'bg-[#f3e3b7] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/60 focus:border-[#072618]'
                : 'bg-[#09251a] border-[#1a5a40] text-[#fde047] placeholder-[#fbbf24]/50 focus:border-amber-400'
            }`}
          />
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14] hover:bg-[#ebd89f]'
              : 'bg-[#09251a] border-[#144833] text-[#fef08a] hover:bg-[#0d3123]'
          }`}
        >
          {isLight ? (
            <>
              <Sun className="w-4 h-4 text-[#b45309]" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-amber-400" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Sync Data Button */}
        <button
          onClick={() => {
            fetchProducts();
            fetchCategories();
            fetchCustomers();
            fetchDashboardStats();
            showToast('Catalog & store data refreshed', 'info');
          }}
          title="Refresh store catalog & orders from database"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14] border-[#c8a74e]'
              : 'bg-[#09251a] hover:bg-[#0d3123] text-[#fef08a] border-[#144833]'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
          <span className="hidden md:inline">Sync</span>
        </button>

        {/* Brand Theme Customizer Button */}
        <button
          onClick={() => setIsBrandingModalOpen(true)}
          title="Customize Store Logo & Brand Theme Colors"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14] border-[#c8a74e]'
              : 'bg-[#09251a] hover:bg-[#0d3123] text-[#fef08a] border-[#144833]'
          }`}
          style={currentUser?.themeColors?.primary ? {
            borderColor: `${currentUser.themeColors.primary}66`
          } : undefined}
        >
          <Palette
            className="w-3.5 h-3.5"
            style={{ color: currentUser?.themeColors?.primary || '#10b981' }}
          />
          <span className="hidden md:inline">Theme</span>
        </button>

        {/* Terminal Station / Current User Identity */}
        <div className={`flex items-center gap-2.5 pl-3 border-l ${
          isLight ? 'border-[#d6b866]' : 'border-[#144833]'
        }`}>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-md transition-colors ${
              isLight
                ? 'bg-[#072618] text-[#fef08a] shadow-[#072618]/20'
                : 'text-[#051a10] shadow-amber-500/20'
            }`}
            style={{
              backgroundColor: currentUser?.themeColors?.primary || undefined,
              color: currentUser?.themeColors?.primary ? undefined : undefined
            }}
          >
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block max-w-[120px]">
            <p className={`text-xs font-bold truncate ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
              {currentUser?.name || 'Store User'}
            </p>
            <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="truncate">{currentUser?.role || 'Operator'}</span>
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out of store register"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300'
              : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-rose-500/40'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Sign Out</span>
        </button>
      </div>
    </header>

    {/* In-App Store Branding & Theme Modal */}
    <BrandingModal
      isOpen={isBrandingModalOpen}
      onClose={() => setIsBrandingModalOpen(false)}
    />
  </>
  );
};

export default Navbar;
