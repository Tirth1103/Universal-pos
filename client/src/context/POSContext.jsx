import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { productAPI, customerAPI, orderAPI, seedAPI, dashboardAPI, couponAPI, authAPI } from '../services/api';
import { applyThemeToCss } from '../utils/colorExtractor';

const POSContext = createContext();

export const POSProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'inventory', 'orders', 'customers', 'dashboard', 'coupons'
  
  // Terminal Operator / Store Authentication State
  const [token, setToken] = useState(() => localStorage.getItem('pos_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pos_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!token && !!currentUser;

  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { coupon, discountAmount }
  const [systemConnected, setSystemConnected] = useState(true);
  const [isMongo, setIsMongo] = useState(false);
  const [registerBalance, setRegisterBalance] = useState(0.00);

  // POS Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // null = Guest
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percent'
  const [taxRate, setTaxRate] = useState(5); // 5% default tax
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  // Modals & Receipts
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState('Cash');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => localStorage.getItem('pos_theme') || 'dark');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    localStorage.setItem('pos_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Dynamic Theme Colors Effect (CSS variables injection)
  useEffect(() => {
    if (currentUser?.themeColors) {
      applyThemeToCss(currentUser.themeColors);
    } else {
      applyThemeToCss({ primary: '#10b981', accent: '#047857' });
    }
  }, [currentUser?.themeColors]);

  // Toasts
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Dynamic Dashboard Stats & Register Balance
  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await dashboardAPI.getStats();
      if (res.data?.success) {
        if (res.data.data?.registerBalance !== undefined) {
          setRegisterBalance(res.data.data.registerBalance);
        }
      }
    } catch (err) {
      console.error('Error fetching register stats:', err);
    }
  }, []);

  // Check Backend System Health
  const checkHealth = useCallback(async () => {
    try {
      const res = await seedAPI.checkHealth();
      setSystemConnected(true);
      setIsMongo(res.data?.mongoConnected || false);
    } catch {
      setSystemConnected(false);
    }
  }, []);

  // Fetch Categories dynamically from store products
  const fetchCategories = useCallback(async () => {
    try {
      const res = await productAPI.getCategories();
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedSubcategory !== 'All') params.subcategory = selectedSubcategory;
      if (searchQuery) params.search = searchQuery;

      const res = await productAPI.getAll(params);
      if (res.data?.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedCategory, selectedSubcategory, searchQuery]);

  // Fetch Customers
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customerAPI.getAll();
      if (res.data?.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  }, []);

  // Fetch Coupons
  const fetchCoupons = useCallback(async () => {
    try {
      setLoadingCoupons(true);
      const res = await couponAPI.getAll();
      if (res.data?.success) {
        setCoupons(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  }, []);

  // Auth Session Verification on mount
  useEffect(() => {
    const verifySession = async () => {
      if (!token) return;
      try {
        const res = await authAPI.getMe();
        if (res.data?.success && res.data.data) {
          setCurrentUser(res.data.data);
          localStorage.setItem('pos_user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        logout();
      }
    };

    verifySession();
  }, [token]);

  // Global handler for 401 unauthorized events from Axios
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      showToast('Session expired. Please sign in again.', 'warning');
    };

    window.addEventListener('pos:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pos:unauthorized', handleUnauthorized);
  }, []);

  // Auth Methods
  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.data?.success) {
      const receivedToken = res.data.token || res.data.data?.token;
      const user = res.data.data?.user || res.data.user;
      localStorage.setItem('pos_token', receivedToken);
      localStorage.setItem('pos_user', JSON.stringify(user));
      setToken(receivedToken);
      setCurrentUser(user);
      showToast(res.data.message || `Welcome, ${user.name}!`, 'success');
      return user;
    }
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.data?.success) {
      const receivedToken = res.data.token || res.data.data?.token;
      const user = res.data.data?.user || res.data.user;
      localStorage.setItem('pos_token', receivedToken);
      localStorage.setItem('pos_user', JSON.stringify(user));
      setToken(receivedToken);
      setCurrentUser(user);
      showToast(res.data.message || 'Store registered successfully!', 'success');
      return user;
    }
  };

  const updateStoreBranding = async (brandingData) => {
    const res = await authAPI.updateStore(brandingData);
    if (res.data?.success) {
      const user = res.data.data;
      setCurrentUser(user);
      localStorage.setItem('pos_user', JSON.stringify(user));
      showToast('Store branding updated successfully!', 'success');
      return user;
    }
  };

  const logout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setToken(null);
    setCurrentUser(null);
    setProducts([]);
    setCategories([]);
    setCustomers([]);
    setCoupons([]);
    setCart([]);
    setAppliedCoupon(null);
    setDiscountValue(0);
    setActiveTab('pos');
    authAPI.logout().catch(() => {});
  };

  useEffect(() => {
    checkHealth();
    if (isAuthenticated) {
      fetchProducts();
      fetchCategories();
      fetchCustomers();
      fetchCoupons();
      fetchDashboardStats();
    }
  }, [isAuthenticated, fetchProducts, fetchCategories, fetchCustomers, fetchCoupons, checkHealth, fetchDashboardStats]);

  // Universal Cart Operations
  const addToCart = (product, qtyOrVariant = 1, customAttributes = []) => {
    const availableStock = product.stock !== undefined ? product.stock : (product.totalStock || 0);
    if (availableStock <= 0) {
      showToast('Product is out of stock', 'warning');
      return;
    }

    let quantityToAdd = 1;
    let selectedAttrs = customAttributes;

    // Graceful backward compatibility if an object with size/color was passed
    if (typeof qtyOrVariant === 'object' && qtyOrVariant !== null) {
      if (qtyOrVariant.stock !== undefined && qtyOrVariant.stock <= 0) {
        showToast('Selected item is out of stock', 'warning');
        return;
      }
      if (qtyOrVariant.size || qtyOrVariant.color) {
        selectedAttrs = [
          ...(qtyOrVariant.size ? [{ name: 'Size', value: qtyOrVariant.size }] : []),
          ...(qtyOrVariant.color ? [{ name: 'Color', value: qtyOrVariant.color }] : [])
        ];
      }
    } else if (typeof qtyOrVariant === 'number') {
      quantityToAdd = Math.max(1, qtyOrVariant);
    }

    const productId = product._id || product.id;
    const existingIndex = cart.findIndex(item => item.productId === productId);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].quantity + quantityToAdd;
      if (newQty > availableStock) {
        showToast(`Cannot add more than available stock (${availableStock})`, 'warning');
        return;
      }
      updatedCart[existingIndex].quantity = newQty;
      updatedCart[existingIndex].itemTotal = Number((newQty * updatedCart[existingIndex].unitPrice).toFixed(2));
      setCart(updatedCart);
    } else {
      if (quantityToAdd > availableStock) {
        showToast(`Cannot add more than available stock (${availableStock})`, 'warning');
        return;
      }
      const unitPrice = product.price;
      const newItem = {
        productId,
        title: product.title,
        productTitle: product.title,
        sku: product.sku || '',
        brand: product.brand || '',
        category: product.category || '',
        unit: product.unit || 'pcs',
        attributes: selectedAttrs && selectedAttrs.length > 0 ? selectedAttrs : (product.attributes || []),
        unitPrice,
        quantity: quantityToAdd,
        maxStock: availableStock,
        itemTotal: Number((unitPrice * quantityToAdd).toFixed(2)),
        image: product.image || ''
      };
      setCart([...cart, newItem]);
    }

    showToast(`Added ${product.title} to cart`, 'success');
  };

  const updateCartQuantity = (index, newQty) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.maxStock) {
      showToast(`Only ${item.maxStock} units available in stock`, 'warning');
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    updated[index].itemTotal = Number((newQty * updated[index].unitPrice).toFixed(2));
    setCart(updated);
  };

  const removeFromCart = (index) => {
    const item = cart[index];
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
    showToast(`Removed ${item.title || item.productTitle} from cart`, 'info');
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setUseLoyaltyPoints(false);
    setSelectedCustomer(null);
    setAppliedCoupon(null);
  };

  // Apply Coupon Code
  const applyCoupon = async (code) => {
    if (!code || !code.trim()) {
      showToast('Please enter a coupon code', 'warning');
      return false;
    }
    if (cart.length === 0) {
      showToast('Add items to cart before applying coupon', 'warning');
      return false;
    }
    try {
      const res = await couponAPI.validate(code.trim(), subtotal);
      if (res.data?.success) {
        setAppliedCoupon(res.data.data);
        showToast(res.data.message || `Coupon "${code.toUpperCase()}" applied!`, 'success');
        return true;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to apply coupon';
      showToast(msg, 'error');
      return false;
    }
  };

  // Remove Applied Coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed from order', 'info');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.itemTotal, 0);

  // Loyalty calculation (1 loyalty point = ₹1 discount)
  const loyaltyDiscount = (useLoyaltyPoints && selectedCustomer)
    ? Math.min(subtotal, (selectedCustomer.loyaltyPoints || 0))
    : 0;

  // Coupon discount calculation
  let couponDiscount = 0;
  if (appliedCoupon && appliedCoupon.coupon) {
    const coup = appliedCoupon.coupon;
    if (coup.minOrderAmount > 0 && subtotal < coup.minOrderAmount) {
      couponDiscount = 0;
    } else if (coup.discountType === 'percent') {
      let disc = (subtotal * coup.discountValue) / 100;
      if (coup.maxDiscountAmount > 0) disc = Math.min(disc, coup.maxDiscountAmount);
      couponDiscount = Math.min(subtotal, Number(disc.toFixed(2)));
    } else {
      couponDiscount = Math.min(subtotal, Number(coup.discountValue));
    }
  }

  const rawDiscount = discountType === 'percent'
    ? (subtotal * (discountValue / 100))
    : Number(discountValue);

  const totalDiscount = Math.min(subtotal, rawDiscount + loyaltyDiscount + couponDiscount);
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxAmount = Number((taxableAmount * (taxRate / 100)).toFixed(2));
  const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));

  // Process Checkout
  const handleCheckout = async (paymentDetails) => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'warning');
      return false;
    }

    try {
      const orderPayload = {
        storeName: currentUser?.storeName || '',
        storeLogo: currentUser?.storeLogo || '',
        storeBranch: currentUser?.storeBranch || '',
        customer: selectedCustomer
          ? { id: selectedCustomer._id || selectedCustomer.id, name: selectedCustomer.name, phone: selectedCustomer.phone }
          : { name: 'Walk-in Guest', phone: '' },
        items: cart,
        subtotal,
        discountAmount: totalDiscount,
        couponCode: appliedCoupon ? appliedCoupon.coupon.code : '',
        couponDiscount: couponDiscount,
        taxAmount,
        grandTotal,
        paymentMethod: paymentDetails.method,
        amountPaid: paymentDetails.amountPaid,
        changeGiven: paymentDetails.changeGiven,
        pointsRedeemed: useLoyaltyPoints ? Math.min((selectedCustomer?.loyaltyPoints || 0), Math.floor(loyaltyDiscount)) : 0,
        cashierName: currentUser?.name || 'Register #01'
      };

      const res = await orderAPI.create(orderPayload);
      if (res.data?.success) {
        setLastOrder(res.data.data);
        clearCart();
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);
        fetchProducts(); // Refresh stock
        fetchCategories(); // Refresh categories
        fetchCustomers(); // Refresh loyalty points
        fetchCoupons(); // Refresh coupon usage counts
        fetchDashboardStats(); // Refresh register balance & dynamic stats
        showToast(`Transaction completed! Invoice #${res.data.data.invoiceNumber}`, 'success');
        return true;
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Checkout failed', 'error');
      return false;
    }
  };

  // Reset to fresh state
  const resetDemoData = async () => {
    try {
      const res = await seedAPI.resetData();
      if (res.data?.success) {
        showToast('Store data cleared to fresh clean state', 'success');
        fetchProducts();
        fetchCategories();
        fetchCustomers();
        fetchDashboardStats();
      }
    } catch (err) {
      showToast('Failed to reset data', 'error');
    }
  };

  return (
    <POSContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        registerBalance,
        fetchDashboardStats,
        activeTab,
        setActiveTab,
        products,
        categories,
        fetchCategories,
        customers,
        loadingProducts,
        systemConnected,
        isMongo,
        selectedCategory,
        setSelectedCategory,
        selectedSubcategory,
        setSelectedSubcategory,
        selectedSizeFilter,
        setSelectedSizeFilter,
        searchQuery,
        setSearchQuery,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
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
        subtotal,
        totalDiscount,
        taxAmount,
        grandTotal,
        isCheckoutOpen,
        setIsCheckoutOpen,
        checkoutMethod,
        setCheckoutMethod,
        isReceiptOpen,
        setIsReceiptOpen,
        isBrandingModalOpen,
        setIsBrandingModalOpen,
        lastOrder,
        setLastOrder,
        handleCheckout,
        resetDemoData,
        fetchProducts,
        fetchCustomers,
        coupons,
        loadingCoupons,
        fetchCoupons,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        couponDiscount,
        theme,
        toggleTheme,
        applyThemeToCss,
        toast,
        showToast,
        setCurrentUser,
        login,
        register,
        updateStoreBranding,
        logout
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => useContext(POSContext);
