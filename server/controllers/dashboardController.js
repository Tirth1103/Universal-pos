const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { getIsConnected } = require('../config/db');
const { memoryProducts } = require('./productController');
const { memoryOrders } = require('./orderController');
const { memoryCustomers } = require('./customerController');

// Helper to bucket orders into dynamic timeframe chart points
const generateDynamicTimeframeData = (orders, timeframe = '7d') => {
  const now = new Date();

  if (timeframe === 'today') {
    const slots = [
      { name: '9 AM', hourStart: 8, hourEnd: 10, revenue: 0, orders: 0 },
      { name: '11 AM', hourStart: 10, hourEnd: 12, revenue: 0, orders: 0 },
      { name: '1 PM', hourStart: 12, hourEnd: 14, revenue: 0, orders: 0 },
      { name: '3 PM', hourStart: 14, hourEnd: 16, revenue: 0, orders: 0 },
      { name: '5 PM', hourStart: 16, hourEnd: 18, revenue: 0, orders: 0 },
      { name: '7 PM', hourStart: 18, hourEnd: 20, revenue: 0, orders: 0 },
      { name: '9 PM', hourStart: 20, hourEnd: 24, revenue: 0, orders: 0 }
    ];

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    orders.forEach(o => {
      const d = new Date(o.createdAt);
      if (d >= startOfToday) {
        const hour = d.getHours();
        const slot = slots.find(s => hour >= s.hourStart && hour < s.hourEnd) || slots[slots.length - 1];
        slot.revenue += (o.grandTotal || 0);
        slot.orders += 1;
      }
    });

    return slots.map(s => ({
      name: s.name,
      revenue: Number(s.revenue.toFixed(2)),
      orders: s.orders
    }));
  }

  if (timeframe === '7d') {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({
        dateStr: d.toISOString().slice(0, 10),
        name: dayLabels[d.getDay()],
        revenue: 0,
        orders: 0
      });
    }

    orders.forEach(o => {
      const dStr = new Date(o.createdAt).toISOString().slice(0, 10);
      const match = days.find(day => day.dateStr === dStr);
      if (match) {
        match.revenue += (o.grandTotal || 0);
        match.orders += 1;
      }
    });

    return days.map(d => ({
      name: d.name,
      revenue: Number(d.revenue.toFixed(2)),
      orders: d.orders
    }));
  }

  if (timeframe === '30d') {
    const weeks = [
      { name: 'Week 1', daysAgoStart: 28, daysAgoEnd: 21, revenue: 0, orders: 0 },
      { name: 'Week 2', daysAgoStart: 21, daysAgoEnd: 14, revenue: 0, orders: 0 },
      { name: 'Week 3', daysAgoStart: 14, daysAgoEnd: 7, revenue: 0, orders: 0 },
      { name: 'Week 4', daysAgoStart: 7, daysAgoEnd: -1, revenue: 0, orders: 0 }
    ];

    const msPerDay = 24 * 60 * 60 * 1000;
    orders.forEach(o => {
      const diffDays = Math.floor((now - new Date(o.createdAt)) / msPerDay);
      const week = weeks.find(w => diffDays <= w.daysAgoStart && diffDays > w.daysAgoEnd);
      if (week) {
        week.revenue += (o.grandTotal || 0);
        week.orders += 1;
      }
    });

    return weeks.map(w => ({
      name: w.name,
      revenue: Number(w.revenue.toFixed(2)),
      orders: w.orders
    }));
  }

  if (timeframe === '1y') {
    const quarters = [
      { name: 'Q1', months: [0, 1, 2], revenue: 0, orders: 0 },
      { name: 'Q2', months: [3, 4, 5], revenue: 0, orders: 0 },
      { name: 'Q3', months: [6, 7, 8], revenue: 0, orders: 0 },
      { name: 'Q4', months: [9, 10, 11], revenue: 0, orders: 0 }
    ];

    const currentYear = now.getFullYear();
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth();
        const q = quarters.find(item => item.months.includes(m));
        if (q) {
          q.revenue += (o.grandTotal || 0);
          q.orders += 1;
        }
      }
    });

    return quarters.map(q => ({
      name: q.name,
      revenue: Number(q.revenue.toFixed(2)),
      orders: q.orders
    }));
  }

  return [];
};

const getDashboardStats = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '7d';
    const userId = req.userId;

    if (getIsConnected()) {
      const allOrders = await Order.find({ userId, status: 'Completed' });
      const allProducts = await Product.find({ userId });
      const totalCustomers = await Customer.countDocuments({ userId });

      const totalRevenue = allOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const totalOrdersCount = allOrders.length;
      const avgOrderValue = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount).toFixed(2) : 0;

      // Low stock count (items with stock <= minStockAlert or stock <= 10)
      const lowStockProducts = allProducts.filter(p => {
        const stock = p.stock !== undefined ? p.stock : (p.totalStock || 0);
        const threshold = p.minStockAlert !== undefined ? p.minStockAlert : 10;
        return stock <= threshold;
      });

      // Category Revenue Summary
      const categorySalesMap = {};
      allOrders.forEach(ord => {
        (ord.items || []).forEach(item => {
          const prod = allProducts.find(p => p._id.toString() === item.productId?.toString());
          const catName = (prod && prod.category) || 'General';
          categorySalesMap[catName] = (categorySalesMap[catName] || 0) + item.itemTotal;
        });
      });

      const categorySalesChart = Object.keys(categorySalesMap).map(cat => ({
        name: cat,
        value: Number(categorySalesMap[cat].toFixed(2))
      }));

      // Top 5 Best Selling Items
      const productSalesCountMap = {};
      allOrders.forEach(ord => {
        (ord.items || []).forEach(item => {
          const name = item.title || item.productTitle || 'Unknown Item';
          productSalesCountMap[name] = (productSalesCountMap[name] || 0) + item.quantity;
        });
      });

      const topProducts = Object.keys(productSalesCountMap)
        .map(name => ({ title: name, soldCount: productSalesCountMap[name] }))
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5);

      // Today's dynamic stats & Cash Drawer Balance
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayOrdersList = allOrders.filter(o => new Date(o.createdAt) >= startOfToday);
      const todayRevenue = todayOrdersList.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const todayCashSales = todayOrdersList
        .filter(o => o.paymentMethod === 'Cash')
        .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const BASE_DRAWER_CASH = 0.00;
      const registerBalance = Number((BASE_DRAWER_CASH + todayCashSales).toFixed(2));
      const timeframeChartData = generateDynamicTimeframeData(allOrders, timeframe);

      // Payment method breakdown
      const paymentMethodCounts = { 'Cash': 0, 'UPI / QR': 0, 'Credit Card': 0 };
      allOrders.forEach(o => {
        const pm = o.paymentMethod || 'Cash';
        if (paymentMethodCounts[pm] !== undefined) paymentMethodCounts[pm] += (o.grandTotal || 0);
        else paymentMethodCounts['Cash'] += (o.grandTotal || 0);
      });
      const paymentBreakdown = [
        { name: 'UPI / QR', value: Number(paymentMethodCounts['UPI / QR'].toFixed(2)) },
        { name: 'Cash', value: Number(paymentMethodCounts['Cash'].toFixed(2)) },
        { name: 'Card', value: Number(paymentMethodCounts['Credit Card'].toFixed(2)) }
      ];

      return res.json({
        success: true,
        data: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalOrders: totalOrdersCount,
          avgOrderValue: Number(avgOrderValue),
          totalCustomers,
          lowStockCount: lowStockProducts.length,
          categorySales: categorySalesChart,
          topProducts,
          todayRevenue: Number(todayRevenue.toFixed(2)),
          todayOrders: todayOrdersList.length,
          todayCashSales: Number(todayCashSales.toFixed(2)),
          registerBalance,
          timeframeChartData,
          paymentBreakdown
        }
      });
    } else {
      const allOrders = memoryOrders.filter(o => o.status === 'Completed' && o.userId && o.userId.toString() === userId);
      const allProducts = memoryProducts.filter(p => p.userId && p.userId.toString() === userId);

      const totalRevenue = allOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const totalOrdersCount = allOrders.length;
      const avgOrderValue = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount).toFixed(2) : 0;

      const lowStockProducts = allProducts.filter(p => {
        const stock = p.stock !== undefined ? p.stock : (p.totalStock || 0);
        const threshold = p.minStockAlert !== undefined ? p.minStockAlert : 10;
        return stock <= threshold;
      });

      const categorySalesMap = {};
      allOrders.forEach(ord => {
        (ord.items || []).forEach(item => {
          const prod = allProducts.find(p => p.id === item.productId || p._id === item.productId);
          const catName = (prod && prod.category) || 'General';
          categorySalesMap[catName] = (categorySalesMap[catName] || 0) + item.itemTotal;
        });
      });

      const categorySalesChart = Object.keys(categorySalesMap).map(cat => ({
        name: cat,
        value: Number(categorySalesMap[cat].toFixed(2))
      }));

      const productSalesCountMap = {};
      allOrders.forEach(ord => {
        (ord.items || []).forEach(item => {
          const name = item.title || item.productTitle || 'Unknown Item';
          productSalesCountMap[name] = (productSalesCountMap[name] || 0) + item.quantity;
        });
      });

      const topProducts = Object.keys(productSalesCountMap)
        .map(name => ({ title: name, soldCount: productSalesCountMap[name] }))
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5);

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayOrdersList = allOrders.filter(o => new Date(o.createdAt) >= startOfToday);
      const todayRevenue = todayOrdersList.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const todayCashSales = todayOrdersList
        .filter(o => o.paymentMethod === 'Cash')
        .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const BASE_DRAWER_CASH = 0.00;
      const registerBalance = Number((BASE_DRAWER_CASH + todayCashSales).toFixed(2));
      const timeframeChartData = generateDynamicTimeframeData(allOrders, timeframe);

      const paymentMethodCounts = { 'Cash': 0, 'UPI / QR': 0, 'Credit Card': 0 };
      allOrders.forEach(o => {
        const pm = o.paymentMethod || 'Cash';
        if (paymentMethodCounts[pm] !== undefined) paymentMethodCounts[pm] += (o.grandTotal || 0);
        else paymentMethodCounts['Cash'] += (o.grandTotal || 0);
      });
      const paymentBreakdown = [
        { name: 'UPI / QR', value: Number(paymentMethodCounts['UPI / QR'].toFixed(2)) },
        { name: 'Cash', value: Number(paymentMethodCounts['Cash'].toFixed(2)) },
        { name: 'Card', value: Number(paymentMethodCounts['Credit Card'].toFixed(2)) }
      ];

      return res.json({
        success: true,
        data: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalOrders: totalOrdersCount,
          avgOrderValue: Number(avgOrderValue),
          totalCustomers: memoryCustomers.filter(c => c.userId && c.userId.toString() === userId).length,
          lowStockCount: lowStockProducts.length,
          categorySales: categorySalesChart,
          topProducts,
          todayRevenue: Number(todayRevenue.toFixed(2)),
          todayOrders: todayOrdersList.length,
          todayCashSales: Number(todayCashSales.toFixed(2)),
          registerBalance,
          timeframeChartData,
          paymentBreakdown
        },
        isMemory: true
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats
};
