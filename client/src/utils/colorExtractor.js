/**
 * Color Extraction & Dynamic Theming Utility
 * 
 * Extracts dominant primary & accent colors from image using HTML5 Canvas pixel sampling.
 * Includes automated contrast checks (WCAG relative luminance) and CSS variable injection.
 */

/**
 * Converts RGB components to hex string (#rrggbb)
 */
export const rgbToHex = (r, g, b) => {
  const toHex = (c) => {
    const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Converts Hex string to RGB object { r, g, b }
 */
export const hexToRgb = (hex) => {
  if (!hex) return { r: 16, g: 185, b: 129 };
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 16, g: 185, b: 129 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

/**
 * Converts Hex to RGBA string
 */
export const hexToRgba = (hex, alpha = 1) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Calculates WCAG 2.0 relative luminance for an sRGB color.
 * Returns value between 0 (darkest black) and 1 (lightest white).
 */
export const getLuminance = (r, g, b) => {
  const a = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

/**
 * Automated contrast check: ensures text rendered over the background color remains readable.
 * Returns '#ffffff' for dark backgrounds or '#0f172a' (dark charcoal) for light backgrounds.
 */
export const getContrastTextColor = (hexColor) => {
  const { r, g, b } = hexToRgb(hexColor);
  const luminance = getLuminance(r, g, b);
  // Threshold: colors with relative luminance > 0.42 are light backgrounds
  return luminance > 0.42 ? '#0f172a' : '#ffffff';
};

/**
 * Adjusts color brightness (positive percent = lighten, negative = darken)
 */
export const adjustColorBrightness = (hex, percent) => {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  return rgbToHex(newR, newG, newB);
};

/**
 * Convert RGB to HSL for color clustering and saturation checks
 */
const rgbToHsl = (r, g, b) => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

/**
 * Converts HSL back to Hex string
 */
const hslToHex = (h, s, l) => {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
};

/**
 * Extracts dominant primary & accent colors from an image source
 * (supports HTMLImageElement, HTMLCanvasElement, Data URL, Object URL, or Image File).
 * 
 * @param {HTMLImageElement|HTMLCanvasElement|string|File} imageSource
 * @returns {Promise<{ primaryColor: string, accentColor: string, isDefault: boolean }>}
 */
export const extractColorsFromImage = (imageSource) => {
  return new Promise((resolve) => {
    const DEFAULT_COLORS = {
      primaryColor: '#10b981',
      accentColor: '#047857',
      isDefault: true
    };

    if (!imageSource) {
      return resolve(DEFAULT_COLORS);
    }

    const processCanvas = (canvas) => {
      try {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(DEFAULT_COLORS);

        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Bins for grouping colors (quantize hue into 16 bins: 360 / 16 = 22.5 deg)
        const colorClusters = {};

        // Sample pixels with a step for fast & smooth processing
        const step = 4 * 2; // sample every 2nd pixel
        for (let i = 0; i < data.length; i += step) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Filter 1: Semi-transparent or fully transparent pixels
          if (a < 180) continue;

          // Filter 2: Extreme whites / near whites
          if (r > 235 && g > 235 && b > 235) continue;

          // Filter 3: Extreme blacks / deep shadows
          if (r < 25 && g < 25 && b < 25) continue;

          const hsl = rgbToHsl(r, g, b);

          // Filter 4: Dull grays (unless no vibrant colors exist)
          if (hsl.s < 12 && (hsl.l > 80 || hsl.l < 20)) continue;

          // Bucket by Hue (16 buckets) and Lightness category (3 buckets: dark, mid, bright)
          const hueBin = Math.floor(hsl.h / 22.5);
          const lightBin = hsl.l < 35 ? 'd' : hsl.l > 65 ? 'l' : 'm';
          const clusterKey = `${hueBin}_${lightBin}`;

          if (!colorClusters[clusterKey]) {
            colorClusters[clusterKey] = {
              rTotal: 0,
              gTotal: 0,
              bTotal: 0,
              count: 0,
              hue: hsl.h,
              saturation: hsl.s,
              lightness: hsl.l
            };
          }

          colorClusters[clusterKey].rTotal += r;
          colorClusters[clusterKey].gTotal += g;
          colorClusters[clusterKey].bTotal += b;
          colorClusters[clusterKey].count += 1;
        }

        const clustersArray = Object.values(colorClusters);
        if (clustersArray.length === 0) {
          return resolve(DEFAULT_COLORS);
        }

        // Score clusters based on both pixel frequency and saturation/vibrancy
        clustersArray.forEach((c) => {
          c.avgR = Math.round(c.rTotal / c.count);
          c.avgG = Math.round(c.gTotal / c.count);
          c.avgB = Math.round(c.bTotal / c.count);
          c.hex = rgbToHex(c.avgR, c.avgG, c.avgB);
          const hsl = rgbToHsl(c.avgR, c.avgG, c.avgB);
          c.hue = hsl.h;
          c.saturation = hsl.s;
          c.lightness = hsl.l;

          // Score: count * (1 + saturation weight) * penalty if too dark or too washed out
          const satMultiplier = 1 + (c.saturation / 100) * 1.5;
          const lightPenalty = c.lightness < 20 || c.lightness > 85 ? 0.5 : 1.0;
          c.score = c.count * satMultiplier * lightPenalty;
        });

        // Sort clusters by score descending
        clustersArray.sort((a, b) => b.score - a.score);

        const primaryCluster = clustersArray[0];
        const primaryColor = primaryCluster.hex;

        // Pick Accent Color:
        // Find a distinct secondary cluster that differs noticeably in hue (>= 35 degrees)
        let accentColor = '';
        for (let i = 1; i < clustersArray.length; i++) {
          const candidate = clustersArray[i];
          const hueDiff = Math.abs(candidate.hue - primaryCluster.hue);
          const shortestHueDiff = Math.min(hueDiff, 360 - hueDiff);

          if (shortestHueDiff >= 35 && candidate.count >= primaryCluster.count * 0.05) {
            accentColor = candidate.hex;
            break;
          }
        }

        // If no distinct secondary hue cluster found, generate an harmonious accent:
        if (!accentColor) {
          if (clustersArray.length > 1) {
            // Pick the next highest scoring shade
            accentColor = clustersArray[1].hex;
          } else {
            // Synthesize complementary or contrasting shade
            const complementaryHue = (primaryCluster.hue + 160) % 360;
            const accentSat = Math.max(50, primaryCluster.saturation);
            const accentLight = primaryCluster.lightness > 50 ? 35 : 65;
            accentColor = hslToHex(complementaryHue, accentSat, accentLight);
          }
        }

        resolve({
          primaryColor,
          accentColor,
          isDefault: false
        });
      } catch (err) {
        console.error('Error during color extraction:', err);
        resolve(DEFAULT_COLORS);
      }
    };

    // Handle HTMLCanvasElement directly
    if (imageSource instanceof HTMLCanvasElement) {
      return processCanvas(imageSource);
    }

    // Handle File or Blob
    let srcUrl = '';
    let shouldRevoke = false;
    if (typeof imageSource === 'object' && imageSource instanceof Blob) {
      srcUrl = URL.createObjectURL(imageSource);
      shouldRevoke = true;
    } else if (typeof imageSource === 'string') {
      srcUrl = imageSource;
    } else if (imageSource && imageSource.src) {
      srcUrl = imageSource.src;
    }

    if (!srcUrl) {
      return resolve(DEFAULT_COLORS);
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDimension = 120; // 120x120 is optimal for fast color quantization
        let w = img.naturalWidth || img.width || 120;
        let h = img.naturalHeight || img.height || 120;

        if (w > h) {
          if (w > maxDimension) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          }
        } else {
          if (h > maxDimension) {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }

        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        processCanvas(canvas);
      } finally {
        if (shouldRevoke) URL.revokeObjectURL(srcUrl);
      }
    };

    img.onerror = () => {
      if (shouldRevoke) URL.revokeObjectURL(srcUrl);
      resolve(DEFAULT_COLORS);
    };

    img.src = srcUrl;
  });
};

/**
 * Injects dynamic CSS variables into document.documentElement for live UI theming
 * 
 * @param {{ primary?: string, accent?: string }} themeColors 
 */
export const applyThemeToCss = (themeColors) => {
  if (typeof document === 'undefined') return;

  const primary = themeColors?.primary || '#10b981';
  const accent = themeColors?.accent || '#047857';

  // Compute contrast text colors
  const primaryText = getContrastTextColor(primary);
  const accentText = getContrastTextColor(accent);

  // Compute hover shades (-12% brightness for hover)
  const primaryHover = adjustColorBrightness(primary, -12);
  const accentHover = adjustColorBrightness(accent, -12);

  // Compute subtle translucent background tints
  const primary10 = hexToRgba(primary, 0.1);
  const primary20 = hexToRgba(primary, 0.2);
  const accent15 = hexToRgba(accent, 0.15);

  const root = document.documentElement;
  root.style.setProperty('--brand-primary', primary);
  root.style.setProperty('--brand-accent', accent);
  root.style.setProperty('--brand-primary-hover', primaryHover);
  root.style.setProperty('--brand-accent-hover', accentHover);
  root.style.setProperty('--brand-primary-text', primaryText);
  root.style.setProperty('--brand-accent-text', accentText);
  root.style.setProperty('--brand-primary-10', primary10);
  root.style.setProperty('--brand-primary-20', primary20);
  root.style.setProperty('--brand-accent-15', accent15);
};
