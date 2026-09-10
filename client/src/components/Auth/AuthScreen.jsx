import React, { useState, useRef } from 'react';
import {
  Store,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShieldCheck,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  X,
  Tag,
  Palette,
  Sparkles
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { extractColorsFromImage, getContrastTextColor, applyThemeToCss } from '../../utils/colorExtractor';

const STORE_CATEGORY_PRESETS = [
  'General Retail',
  'Clothing & Apparel',
  'Electronics & Gadgets',
  'Grocery & Supermarket',
  'Footwear & Leather',
  'Pharmacy & Healthcare',
  'Books & Stationery',
  'Jewelry & Watches',
  'Home & Kitchen',
  'Cafe & Bakery'
];

const AuthScreen = () => {
  const { login, register, theme, toggleTheme } = usePOS();
  const isLight = theme === 'light';

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    storeBranch: '',
    storeCategory: 'General Retail',
    storeLogo: ''
  });

  const [themeColors, setThemeColors] = useState({
    primary: '#10b981',
    accent: '#047857',
    isCustom: false
  });
  const [isExtractingColors, setIsExtractingColors] = useState(false);

  const [logoPreview, setLogoPreview] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMsg) setErrorMsg('');
  };

  // Image upload with compression (< 500 KB)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(png|jpe?g|svg\+xml|webp)/i)) {
      setErrorMsg('Please select a valid image file (.png, .jpg, .jpeg, .svg, .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 300; // Optimal square dimension for POS logo

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);
        setLogoPreview(compressedDataUrl);
        setFormData(prev => ({ ...prev, storeLogo: compressedDataUrl }));

        // Run Client-Side Color Extraction on the canvas
        setIsExtractingColors(true);
        extractColorsFromImage(canvas).then((extracted) => {
          if (!extracted.isDefault) {
            const updated = {
              primary: extracted.primaryColor,
              accent: extracted.accentColor,
              isCustom: true
            };
            setThemeColors(updated);
            applyThemeToCss(updated);
          }
          setIsExtractingColors(false);
        }).catch(() => {
          setIsExtractingColors(false);
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, storeLogo: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    const resetTheme = { primary: '#10b981', accent: '#047857', isCustom: false };
    setThemeColors(resetTheme);
    applyThemeToCss(resetTheme);
  };

  const handleColorChange = (key, value) => {
    const updated = {
      ...themeColors,
      [key]: value,
      isCustom: true
    };
    setThemeColors(updated);
    applyThemeToCss(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        if (!formData.name.trim()) {
          throw new Error('Please provide your operator name.');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          storeName: formData.storeName || 'My Retail Store',
          storeBranch: formData.storeBranch || 'Main Branch',
          storeCategory: formData.storeCategory || 'General Retail',
          storeLogo: formData.storeLogo || '',
          themeColors
        });
      }
    } catch (err) {
      console.error('Auth error:', err);
      const message =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify your credentials.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setFormData({
      name: 'Store Owner',
      email: 'admin@pos.local',
      password: 'password123',
      storeName: 'Prime Retail Mart',
      storeBranch: 'Main Branch',
      storeCategory: 'General Retail',
      storeLogo: ''
    });
    setMode('login');
    setErrorMsg('');
  };

  return (
    <div
      className={`min-h-screen w-screen flex flex-col justify-between relative overflow-x-hidden transition-colors duration-500 select-none ${
        isLight
          ? 'bg-[#fbf4dc] text-[#051f14]'
          : 'bg-[#04120b] text-[#fef3c7]'
      }`}
    >
      {/* Background Ambient Glows */}
      <div
        className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40 ${
          isLight ? 'bg-amber-300/60' : 'bg-emerald-600/20'
        }`}
      />
      <div
        className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40 ${
          isLight ? 'bg-yellow-400/50' : 'bg-amber-500/15'
        }`}
      />

      {/* Top Header Bar */}
      <header className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl overflow-hidden shadow-lg border flex items-center justify-center p-0.5 ${
              isLight
                ? 'border-[#c8a74e] bg-[#f8eed1]'
                : 'border-amber-500/40 bg-[#061a11]'
            }`}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Store className={`w-6 h-6 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-black text-lg tracking-widest ${
                  isLight
                    ? 'text-[#051f14]'
                    : 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent'
                }`}
              >
                UNIVERSAL POS
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                  isLight
                    ? 'bg-[#f3e3b7] text-[#072618] border-[#c8a74e]'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                Retail Cloud
              </span>
            </div>
            <p
              className={`text-[10px] font-medium tracking-widest uppercase ${
                isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'
              }`}
            >
              Universal Point of Sale • Any Retail Business
            </p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14] hover:bg-[#ebd89f]'
              : 'bg-[#09251a] border-[#144833] text-[#fef08a] hover:bg-[#0d3123]'
          }`}
        >
          {isLight ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-700" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 my-4">
        <div
          className={`w-full max-w-md rounded-3xl border shadow-2xl p-7 transition-all duration-300 ${
            isLight
              ? 'bg-[#fffaf0]/95 border-[#d6b866] shadow-[#072418]/10 backdrop-blur-xl'
              : 'bg-[#071f15]/95 border-[#144833] shadow-black/60 backdrop-blur-xl'
          }`}
        >
          {/* Mode Switcher Tabs */}
          <div
            className={`grid grid-cols-2 p-1 rounded-2xl mb-6 border ${
              isLight
                ? 'bg-[#f4e4b9] border-[#d6b866]'
                : 'bg-[#05170f] border-[#144833]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? isLight
                    ? 'bg-[#072418] text-[#fef08a] shadow-md'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-[#051a10] font-black shadow-md'
                  : isLight
                  ? 'text-[#083020] hover:text-[#041a10]'
                  : 'text-[#fde047]/70 hover:text-[#fef08a]'
              }`}
            >
              Store Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? isLight
                    ? 'bg-[#072418] text-[#fef08a] shadow-md'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-[#051a10] font-black shadow-md'
                  : isLight
                  ? 'text-[#083020] hover:text-[#041a10]'
                  : 'text-[#fde047]/70 hover:text-[#fef08a]'
              }`}
            >
              Register New Store
            </button>
          </div>

          {/* Form Title & Subtitle */}
          <div className="mb-5 text-left">
            <h2
              className={`text-xl font-black tracking-tight ${
                isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'
              }`}
            >
              {mode === 'login' ? 'Access Your Store POS' : 'Register Store & Brand'}
            </h2>
            <p
              className={`text-xs mt-1 ${
                isLight ? 'text-[#0f442e]/80' : 'text-[#fde047]/70'
              }`}
            >
              {mode === 'login'
                ? 'Sign in to access your store inventory, dynamic categories, and checkout terminal.'
                : 'Customize your store name, logo branding, and category. Everything is isolated to your account.'}
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            {mode === 'register' && (
              <>
                {/* Store Logo File Upload */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
                    }`}
                  >
                    Store Logo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0 relative group ${
                        isLight ? 'border-[#c8a74e] bg-[#f8eed1]' : 'border-[#144833] bg-[#061a11]'
                      }`}
                    >
                      {logoPreview ? (
                        <>
                          <img src={logoPreview} alt="Store Logo Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <ImageIcon className={`w-6 h-6 ${isLight ? 'text-amber-700/50' : 'text-amber-400/40'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="store-logo-input"
                      />
                      <label
                        htmlFor="store-logo-input"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          isLight
                            ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14] hover:bg-[#ebd89f]'
                            : 'bg-[#09251a] border-[#144833] text-[#fef08a] hover:bg-[#0d3123]'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                      </label>
                      <p className={`text-[10px] mt-1 ${isLight ? 'text-[#0f442e]/60' : 'text-[#fde047]/50'}`}>
                        PNG, JPG, SVG or WEBP (Auto-optimized)
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Brand Color Swatches & Fine-Tuning */}
                  <div className={`mt-3 p-3 rounded-2xl border transition-all duration-300 ${
                    isLight ? 'bg-[#f4e4b9]/80 border-[#c8a74e]' : 'bg-[#061a11] border-[#144833]'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Palette className={`w-3.5 h-3.5 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-wider ${
                          isLight ? 'text-[#051f14]' : 'text-[#fef08a]'
                        }`}>
                          Brand Color Palette
                        </span>
                      </div>
                      {isExtractingColors ? (
                        <span className="text-[10px] font-bold text-amber-500 animate-pulse flex items-center gap-1">
                          <Sparkles className="w-3 h-3 animate-spin" />
                          Extracting colors...
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          themeColors.isCustom
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : isLight
                            ? 'bg-[#ebd89f] text-[#0f442e] border-[#c8a74e]'
                            : 'bg-[#09251a] text-[#fde047]/70 border-[#144833]'
                        }`}>
                          {themeColors.isCustom ? 'Extracted from Logo' : 'Default Colors'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Primary Swatch */}
                      <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                        isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#1a5a40]'
                      }`}>
                        <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 shadow-inner border border-black/20">
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: themeColors.primary }}
                          />
                          <input
                            type="color"
                            value={themeColors.primary}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            title="Fine-tune Primary Color"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Primary</span>
                            <span
                              className="text-[8px] font-bold px-1 rounded uppercase tracking-tighter"
                              style={{
                                backgroundColor: themeColors.primary,
                                color: getContrastTextColor(themeColors.primary)
                              }}
                            >
                              Aa
                            </span>
                          </div>
                          <p className="text-[10px] font-mono font-bold uppercase truncate">{themeColors.primary}</p>
                        </div>
                      </div>

                      {/* Accent Swatch */}
                      <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                        isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#1a5a40]'
                      }`}>
                        <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 shadow-inner border border-black/20">
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: themeColors.accent }}
                          />
                          <input
                            type="color"
                            value={themeColors.accent}
                            onChange={(e) => handleColorChange('accent', e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            title="Fine-tune Accent Color"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Accent</span>
                            <span
                              className="text-[8px] font-bold px-1 rounded uppercase tracking-tighter"
                              style={{
                                backgroundColor: themeColors.accent,
                                color: getContrastTextColor(themeColors.accent)
                              }}
                            >
                              Aa
                            </span>
                          </div>
                          <p className="text-[10px] font-mono font-bold uppercase truncate">{themeColors.accent}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[9px] opacity-70">
                      <span>Click swatch box to pick custom hex</span>
                      <span>Text: {getContrastTextColor(themeColors.primary) === '#ffffff' ? 'White' : 'Dark Charcoal'}</span>
                    </div>
                  </div>
                </div>

                {/* Operator Name */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
                    }`}
                  >
                    Operator / Admin Name
                  </label>
                  <div className="relative">
                    <User
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                        isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'
                      }`}
                    />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Patel"
                      className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                        isLight
                          ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/50 focus:border-[#072618]'
                          : 'bg-[#061a11] border-[#144833] text-[#fef08a] placeholder-[#fbbf24]/40 focus:border-amber-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Store Name & Category */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                        isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
                      }`}
                    >
                      Store Name
                    </label>
                    <div className="relative">
                      <Store
                        className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                          isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'
                        }`}
                      />
                      <input
                        type="text"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleChange}
                        placeholder="e.g. Prime Store"
                        className={`w-full pl-9 pr-2.5 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                          isLight
                            ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/50 focus:border-[#072618]'
                            : 'bg-[#061a11] border-[#144833] text-[#fef08a] placeholder-[#fbbf24]/40 focus:border-amber-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                        isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
                      }`}
                    >
                      Business Type
                    </label>
                    <div className="relative">
                      <select
                        name="storeCategory"
                        value={formData.storeCategory}
                        onChange={handleChange}
                        className={`w-full px-2.5 py-2 rounded-xl border text-xs focus:outline-none transition-all cursor-pointer ${
                          isLight
                            ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] focus:border-[#072618]'
                            : 'bg-[#061a11] border-[#144833] text-[#fef08a] focus:border-amber-400'
                        }`}
                      >
                        {STORE_CATEGORY_PRESETS.map((cat) => (
                          <option key={cat} value={cat} className={isLight ? 'bg-[#fffaf0] text-[#051f14]' : 'bg-[#061a11] text-[#fef08a]'}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Branch Location */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
                    }`}
                  >
                    Branch / Location
                  </label>
                  <input
                    type="text"
                    name="storeBranch"
                    value={formData.storeBranch}
                    onChange={handleChange}
                    placeholder="e.g. Downtown Flagship, Market Road"
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                      isLight
                        ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/50 focus:border-[#072618]'
                        : 'bg-[#061a11] border-[#144833] text-[#fef08a] placeholder-[#fbbf24]/40 focus:border-amber-400'
                    }`}
                  />
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
                }`}
              >
                Store Operator Email
              </label>
              <div className="relative">
                <Mail
                  className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'
                  }`}
                />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@pos.local"
                  className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                    isLight
                      ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/50 focus:border-[#072618]'
                      : 'bg-[#061a11] border-[#144833] text-[#fef08a] placeholder-[#fbbf24]/40 focus:border-amber-400'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
                }`}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'
                  }`}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                    isLight
                      ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/50 focus:border-[#072618]'
                      : 'bg-[#061a11] border-[#144833] text-[#fef08a] placeholder-[#fbbf24]/40 focus:border-amber-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs transition-colors cursor-pointer ${
                    isLight
                      ? 'text-[#0f442e]/70 hover:text-[#051f14]'
                      : 'text-[#fde047]/60 hover:text-[#fef08a]'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={
                mode === 'register' && !loading
                  ? {
                      backgroundColor: themeColors.primary,
                      color: getContrastTextColor(themeColors.primary)
                    }
                  : undefined
              }
              className={`w-full mt-4 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xl cursor-pointer ${
                loading
                  ? 'opacity-60 cursor-not-allowed bg-[#072418] text-[#fef08a]'
                  : mode === 'register'
                  ? 'shadow-lg hover:brightness-95'
                  : isLight
                  ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] shadow-amber-500/30'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Register' : 'Create Branded Store'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div
            className={`mt-5 pt-3.5 border-t flex items-center justify-between text-[11px] ${
              isLight ? 'border-[#d6b866]/50 text-[#0f442e]/80' : 'border-[#144833] text-[#fde047]/70'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Multi-Tenant JWT Secured</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className={`underline font-bold transition-colors cursor-pointer ${
                isLight ? 'text-[#072618] hover:text-black' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              Fill Demo Login
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 text-center text-[10px] opacity-60 z-10">
        Universal Retail POS System • Multi-Tenant Architecture
      </footer>
    </div>
  );
};

export default AuthScreen;
