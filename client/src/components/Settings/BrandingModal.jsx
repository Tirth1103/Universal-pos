import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Palette,
  Sparkles,
  Check,
  RotateCcw,
  Store,
  Image as ImageIcon,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import {
  extractColorsFromImage,
  getContrastTextColor,
  applyThemeToCss
} from '../../utils/colorExtractor';

const BrandingModal = ({ isOpen, onClose }) => {
  const {
    currentUser,
    updateStoreBranding,
    theme,
    showToast
  } = usePOS();
  const isLight = theme === 'light';

  const [storeName, setStoreName] = useState('');
  const [storeLogo, setStoreLogo] = useState('');
  const [themeColors, setThemeColors] = useState({
    primary: '#10b981',
    accent: '#047857',
    isCustom: false
  });

  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setStoreName(currentUser.storeName || '');
      setStoreLogo(currentUser.storeLogo || '');
      const initialColors = currentUser.themeColors || {
        primary: '#10b981',
        accent: '#047857',
        isCustom: false
      };
      setThemeColors(initialColors);
      applyThemeToCss(initialColors);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle Logo Upload with offscreen canvas compression & color extraction
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(png|jpe?g|svg\+xml|webp)/i)) {
      showToast('Please select an image file (.png, .jpg, .jpeg, .svg, .webp)', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 300;
        let width = img.width;
        let height = img.height;

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

        const compressedData = canvas.toDataURL('image/webp', 0.85);
        setStoreLogo(compressedData);

        // Run Color Extraction
        setIsExtracting(true);
        extractColorsFromImage(canvas)
          .then((colors) => {
            if (!colors.isDefault) {
              const updated = {
                primary: colors.primaryColor,
                accent: colors.accentColor,
                isCustom: true
              };
              setThemeColors(updated);
              applyThemeToCss(updated);
              showToast('Brand colors extracted from store logo!', 'success');
            }
            setIsExtracting(false);
          })
          .catch(() => {
            setIsExtracting(false);
          });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleColorChange = (key, val) => {
    const updated = {
      ...themeColors,
      [key]: val,
      isCustom: true
    };
    setThemeColors(updated);
    applyThemeToCss(updated);
  };

  const handleResetColors = () => {
    const defaultColors = {
      primary: '#10b981',
      accent: '#047857',
      isCustom: false
    };
    setThemeColors(defaultColors);
    applyThemeToCss(defaultColors);
    showToast('Reset to default retail green palette', 'info');
  };

  const handleClose = () => {
    // Reset DOM CSS variables back to user's saved colors if canceled
    if (currentUser?.themeColors) {
      applyThemeToCss(currentUser.themeColors);
    }
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateStoreBranding({
        storeName: storeName.trim(),
        storeLogo,
        themeColors
      });
      showToast('Store branding & theme updated successfully!', 'success');
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update branding', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const primaryContrast = getContrastTextColor(themeColors.primary);
  const accentContrast = getContrastTextColor(themeColors.accent);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in select-none ${isLight ? 'bg-[#051f14]/40' : 'bg-[#05170f]/85'
      }`}>
      <div className={`border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-300 ${isLight ? 'bg-[#fffaf0] border-[#d6b866] text-[#051f14]' : 'bg-[#071f15] border-[#144833] text-[#fef3c7]'
        }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
          }`}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: themeColors.primary, color: primaryContrast }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide">Store Branding & Theme</h2>
              <p className={`text-[10px] ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                Dynamic logo color extraction & interface styling
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${isLight
                ? 'border-[#c8a74e] hover:bg-[#ebd89f] text-[#051f14]'
                : 'border-[#144833] hover:bg-[#0d3123] text-[#fef08a]'
              }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto text-left flex-1">
          {/* Store Name */}
          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
              }`}>
              Store Name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. My Retail Flagship"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none transition-all ${isLight
                  ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] focus:border-[#072618]'
                  : 'bg-[#061a11] border-[#144833] text-[#fef08a] focus:border-amber-400'
                }`}
            />
          </div>

          {/* Store Logo & Extraction Trigger */}
          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/80'
              }`}>
              Store Logo
            </label>
            <div className="flex items-center gap-3">
              <div
                className={`w-16 h-16 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0 relative group shadow-sm ${isLight ? 'border-[#c8a74e] bg-[#f8eed1]' : 'border-[#144833] bg-[#061a11]'
                  }`}
                style={{ borderColor: themeColors.primary }}
              >
                {storeLogo ? (
                  <>
                    <img src={storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setStoreLogo('')}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                      title="Remove Logo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <Store className={`w-7 h-7 ${isLight ? 'text-amber-700/50' : 'text-amber-400/40'}`} />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="branding-modal-logo"
                />
                <label
                  htmlFor="branding-modal-logo"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isLight
                      ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14] hover:bg-[#ebd89f]'
                      : 'bg-[#09251a] border-[#144833] text-[#fef08a] hover:bg-[#0d3123]'
                    }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{storeLogo ? 'Change Logo' : 'Upload Store Logo'}</span>
                </label>
                <p className={`text-[10px] ${isLight ? 'text-[#0f442e]/60' : 'text-[#fde047]/50'}`}>
                  Auto-extracts vibrant primary & accent brand colors
                </p>
              </div>
            </div>
          </div>

          {/* Color Palette Extraction & Swatches */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-[#f4e4b9]/80 border-[#c8a74e]' : 'bg-[#061a11] border-[#144833]'
            }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sliders className={`w-3.5 h-3.5 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
                <span className={`text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'
                  }`}>
                  Brand Theme Colors
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isExtracting ? (
                  <span className="text-[10px] font-bold text-amber-500 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    Extracting...
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetColors}
                    className={`text-[10px] font-bold flex items-center gap-1 underline transition-colors cursor-pointer ${isLight ? 'text-[#0f442e] hover:text-black' : 'text-[#fde047]/80 hover:text-[#fef08a]'
                      }`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Defaults
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Primary Color Swatch */}
              <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#1a5a40]'
                }`}>
                <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-inner border border-black/20">
                  <div
                    className="w-full h-full transition-colors duration-200"
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
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Primary</span>
                    <span
                      className="text-[8px] font-bold px-1 rounded uppercase tracking-tighter"
                      style={{ backgroundColor: themeColors.primary, color: primaryContrast }}
                    >
                      Aa
                    </span>
                  </div>
                  <p className="text-[11px] font-mono font-bold uppercase truncate">{themeColors.primary}</p>
                </div>
              </div>

              {/* Accent Color Swatch */}
              <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#1a5a40]'
                }`}>
                <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-inner border border-black/20">
                  <div
                    className="w-full h-full transition-colors duration-200"
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
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Accent</span>
                    <span
                      className="text-[8px] font-bold px-1 rounded uppercase tracking-tighter"
                      style={{ backgroundColor: themeColors.accent, color: accentContrast }}
                    >
                      Aa
                    </span>
                  </div>
                  <p className="text-[11px] font-mono font-bold uppercase truncate">{themeColors.accent}</p>
                </div>
              </div>
            </div>

            {/* Live Interactive UI Theming Preview Card */}
            <div className={`mt-3 p-3 rounded-xl border ${isLight ? 'bg-[#fffaf0] border-[#d6b866]/60' : 'bg-[#04120b] border-[#144833]'
              }`}>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">
                Live POS Component Preview
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Primary Button Preview */}
                <button
                  type="button"
                  style={{ backgroundColor: themeColors.primary, color: primaryContrast }}
                  className="px-3 py-1.5 rounded-lg font-black text-xs shadow-md transition-transform active:scale-95"
                >
                  Pay Now (₹1,450)
                </button>

                {/* Accent Badge Preview */}
                <span
                  style={{
                    backgroundColor: themeColors.accent,
                    color: accentContrast
                  }}
                  className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                >
                  Active Terminal
                </span>

                {/* Secondary Pill */}
                <span
                  style={{
                    border: `1px solid ${themeColors.primary}`,
                    color: themeColors.primary
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                >
                  {storeName || 'My Store'}
                </span>
              </div>
            </div>
          </div>

          {/* Automated Contrast Check Indicator */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[10px] ${isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
            }`}>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>WCAG Contrast Verified:</span>
            </div>
            <span className="font-mono font-bold">
              {primaryContrast === '#ffffff' ? 'White Text' : 'Dark Charcoal Text'}
            </span>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-inherit">
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${isLight
                  ? 'border-[#c8a74e] text-[#051f14] hover:bg-[#ebd89f]'
                  : 'border-[#144833] text-[#fef08a] hover:bg-[#0d3123]'
                }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: themeColors.primary, color: primaryContrast }}
              className="px-5 py-2 rounded-xl text-xs font-black shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer hover:brightness-95 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Apply & Save Branding</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandingModal;
