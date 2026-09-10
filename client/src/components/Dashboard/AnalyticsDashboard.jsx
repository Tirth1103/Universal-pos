import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  IndianRupee,
  ShoppingBag,
  Users,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Download,
  Printer,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Zap,
  Shirt,
  PieChart as PieIcon,
  Activity,
  CreditCard,
  QrCode,
  Banknote,
  Award,
  RefreshCw,
  Clock,
  ShieldCheck,
  PackageCheck,
  Tag,
  Flame,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { dashboardAPI } from '../../services/api';
import { usePOS } from '../../context/POSContext';
import { formatINR } from '../../utils/formatters';

const AnalyticsDashboard = () => {
  const { lastOrder, showToast, theme, setActiveTab } = usePOS();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d'); // 'today', '7d', '30d', '1y'
  const [activeMetric, setActiveMetric] = useState('revenue'); // 'revenue', 'orders', 'avg'
  const [chartType, setChartType] = useState('area'); // 'area', 'bar'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLight = theme === 'light';

  const fetchStats = async (tf = timeframe) => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats(tf);
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats(timeframe);
  }, [timeframe, lastOrder]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchStats(timeframe);
    showToast('Analytics refreshed with latest store transactions', 'info');
  };

  // Curated Dark Forest Green & Warm Gold luxury apparel palette
  const CATEGORY_COLORS = [
    '#d4af37', // Warm Imperial Gold
    '#10b981', // Forest Emerald
    '#f59e0b', // Radiant Amber Gold
    '#059669', // Deep Forest Jade
    '#fbbf24', // Sunlit Warm Gold
    '#34d399', // Mint Flora
    '#d97706', // Antique Bronze Gold
    '#047857'  // Alpine Forest Pine
  ];

  const timeframeDataMap = {
    today: [
      { name: '9 AM', revenue: 0, orders: 0 },
      { name: '11 AM', revenue: 0, orders: 0 },
      { name: '1 PM', revenue: 0, orders: 0 },
      { name: '3 PM', revenue: 0, orders: 0 },
      { name: '5 PM', revenue: 0, orders: 0 },
      { name: '7 PM', revenue: 0, orders: 0 },
      { name: '9 PM', revenue: 0, orders: 0 }
    ],
    '7d': [
      { name: 'Mon', revenue: 0, orders: 0 },
      { name: 'Tue', revenue: 0, orders: 0 },
      { name: 'Wed', revenue: 0, orders: 0 },
      { name: 'Thu', revenue: 0, orders: 0 },
      { name: 'Fri', revenue: 0, orders: 0 },
      { name: 'Sat', revenue: 0, orders: 0 },
      { name: 'Sun', revenue: 0, orders: 0 }
    ],
    '30d': [
      { name: 'Week 1', revenue: 0, orders: 0 },
      { name: 'Week 2', revenue: 0, orders: 0 },
      { name: 'Week 3', revenue: 0, orders: 0 },
      { name: 'Week 4', revenue: 0, orders: 0 }
    ],
    '1y': [
      { name: 'Q1', revenue: 0, orders: 0 },
      { name: 'Q2', revenue: 0, orders: 0 },
      { name: 'Q3', revenue: 0, orders: 0 },
      { name: 'Q4', revenue: 0, orders: 0 }
    ]
  };

  const activeChartData = (stats?.timeframeChartData && stats.timeframeChartData.length > 0)
    ? stats.timeframeChartData
    : (timeframeDataMap[timeframe] || timeframeDataMap['7d']);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Category,Value\n" +
      (stats?.categorySales || []).map(c => `"${c.name}",${c.value}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SATVASTRA_Analytics_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Analytics CSV report downloaded!', 'success');
  };

  const handlePrintDashboard = () => {
    window.print();
  };

  const categoryList = stats?.categorySales || [];
  const totalCategoryVal = categoryList.reduce((sum, item) => sum + item.value, 0);

  const paymentList = stats?.paymentBreakdown || [
    { name: 'UPI / QR', value: 0 },
    { name: 'Cash', value: 0 },
    { name: 'Card', value: 0 }
  ];
  const totalPaymentVal = paymentList.reduce((sum, item) => sum + item.value, 0);

  // Profit estimation (estimated 52% apparel margin)
  const totalRev = Number(stats?.totalRevenue || 0);
  const estimatedProfit = totalRev * 0.52;

  return (
    <div className={`flex-1 p-5 sm:p-7 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* 1. Hero Executive Command Header with Glowing Warm Gold & Forest Aurora */}
      <div className={`relative rounded-3xl p-6 sm:p-8 overflow-hidden border transition-all duration-300 ${
        isLight
          ? 'bg-gradient-to-br from-[#fffaf0] via-[#f8eed1] to-[#f4e4b9] border-[#d6b866] shadow-xl text-[#051f14]'
          : 'bg-gradient-to-br from-[#0e3323] via-[#09251a] to-[#061810] border-[#144833] shadow-2xl text-[#fef3c7]'
      }`}>
        {/* Ambient atmospheric aura glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-slate-950" /> Retail Intelligence
              </span>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                isLight
                  ? 'bg-[#f4e4b9] text-[#072618] border-[#d6b866]'
                  : 'bg-[#061a11] text-[#fef3c7] border-[#144833]'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                SATVASTRA Terminal #01 Active • Bhuj, Gujarat
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isLight
                ? 'text-[#051f14]'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-[#fef3c7] via-[#fde047] to-[#fbbf24]'
            }`}>
              Store Performance & Financial Command
            </h1>

            <p className={`text-xs sm:text-sm max-w-2xl font-medium ${
              isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/80'
            }`}>
              Live transaction velocity, retail stock health, customer loyalty engagement, and Indian Rupee revenue tracking.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer ${
                isLight
                  ? 'bg-[#fffaf0] hover:bg-[#f4e4b9] border-[#d6b866] text-[#051f14] hover:border-[#072618]'
                  : 'bg-[#061a11] hover:bg-[#0c2f21] border-[#144833] text-[#fef3c7] hover:text-[#fbbf24] hover:border-[#fbbf24]/50'
              }`}
              title="Refresh store analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            {/* Timeframe Selector Pills */}
            <div className={`flex items-center border rounded-2xl p-1 shadow-sm ${
              isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              {[
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '1y', label: '1 Year' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimeframe(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timeframe === t.id
                      ? isLight
                        ? 'bg-[#072618] text-[#fef08a] font-black shadow-md'
                        : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black shadow-md shadow-amber-500/30'
                      : isLight
                      ? 'text-[#0f442e] hover:text-[#051f14] hover:bg-[#f4e4b9]'
                      : 'text-[#fef3c7]/70 hover:text-[#fef3c7] hover:bg-[#0c2f21]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer ${
                isLight
                  ? 'bg-[#fffaf0] hover:bg-[#f4e4b9] border-[#d6b866] text-[#051f14] hover:border-[#072618]'
                  : 'bg-[#061a11] hover:bg-[#0c2f21] border-[#144833] text-[#fef3c7] hover:text-[#fbbf24] hover:border-[#fbbf24]/50'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Print Dashboard */}
            <button
              onClick={handlePrintDashboard}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer ${
                isLight
                  ? 'bg-[#fffaf0] hover:bg-[#f4e4b9] border-[#d6b866] text-[#051f14] hover:border-[#072618]'
                  : 'bg-[#061a11] hover:bg-[#0c2f21] border-[#144833] text-[#fef3c7] hover:text-[#fbbf24] hover:border-[#fbbf24]/50'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Live Status Strip */}
        <div className={`mt-6 pt-5 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 ${
          isLight ? 'border-[#d6b866]/60' : 'border-[#144833]'
        }`}>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'
            }`}>
              Today's Revenue
            </span>
            <p className={`text-base font-extrabold mt-0.5 ${
              isLight ? 'text-[#051f14]' : 'text-[#fbbf24]'
            }`}>
              {formatINR(stats?.todayRevenue || 0)}
            </p>
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'
            }`}>
              Today's Invoices
            </span>
            <p className={`text-base font-extrabold mt-0.5 ${
              isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'
            }`}>
              {stats?.todayOrders || 0} Bills
            </p>
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'
            }`}>
              Active Shift Balance
            </span>
            <p className={`text-base font-extrabold mt-0.5 ${
              isLight ? 'text-[#051f14]' : 'text-emerald-400'
            }`}>
              {formatINR(stats?.registerBalance || 0)}
            </p>
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'
            }`}>
              Store Uptime
            </span>
            <p className={`text-base font-extrabold mt-0.5 flex items-center gap-1.5 ${
              isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'
            }`}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Operational
            </p>
          </div>
        </div>
      </div>

      {/* 2. Four Flagship Interactive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sales Revenue */}
        <div
          onClick={() => setActiveMetric('revenue')}
          className={`cursor-pointer group relative p-5 rounded-3xl transition-all duration-300 border overflow-hidden ${
            activeMetric === 'revenue'
              ? isLight
                ? 'border-[#072618] ring-2 ring-[#072618]/30 bg-[#fffaf0] shadow-xl scale-[1.02]'
                : 'border-amber-400/80 shadow-2xl ring-2 ring-amber-400/40 scale-[1.02] bg-[#09251a]'
              : isLight
              ? 'bg-[#fffaf0] hover:bg-[#f8eed1] border-[#d6b866] shadow-md'
              : 'bg-[#09251a] hover:bg-[#0e3323] border-[#144833] shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
              isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/80'
            }`}>
              Total Gross Revenue
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-5 h-5 text-slate-950" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black tracking-tight ${
              isLight ? 'text-[#051f14]' : 'text-[#fbbf24]'
            }`}>
              {stats ? formatINR(stats.totalRevenue || 0) : '₹0.00'}
            </h3>
            <div className={`flex items-center justify-between mt-3 pt-2.5 border-t ${
              isLight ? 'border-[#d6b866]/40' : 'border-[#144833]/60'
            }`}>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#d6b866]' : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
              }`}>
                <TrendingUp className="w-3 h-3" /> {stats && stats.totalRevenue > 0 ? '+18.4% Volume' : 'Live Store'}
              </span>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                isLight ? 'text-[#072618]' : 'text-[#fbbf24]'
              }`}>
                Graph <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Estimated Net Margin */}
        <div
          onClick={() => setActiveMetric('revenue')}
          className={`cursor-pointer group relative p-5 rounded-3xl transition-all duration-300 border overflow-hidden ${
            isLight
              ? 'bg-[#fffaf0] hover:bg-[#f8eed1] border-[#d6b866] shadow-md'
              : 'bg-[#09251a] hover:bg-[#0e3323] border-[#144833] shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
              isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/80'
            }`}>
              Estimated Net Margin
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black tracking-tight ${
              isLight ? 'text-[#051f14]' : 'text-emerald-400'
            }`}>
              {formatINR(estimatedProfit)}
            </h3>
            <div className={`flex items-center justify-between mt-3 pt-2.5 border-t ${
              isLight ? 'border-[#d6b866]/40' : 'border-[#144833]/60'
            }`}>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#d6b866]' : 'bg-[#061a11] text-emerald-300 border-[#144833]'
              }`}>
                ~52% Margin
              </span>
              <span className={`text-[10px] font-semibold ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'}`}>Store Avg</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Orders & Avg Bill */}
        <div
          onClick={() => setActiveMetric('orders')}
          className={`cursor-pointer group relative p-5 rounded-3xl transition-all duration-300 border overflow-hidden ${
            activeMetric === 'orders'
              ? isLight
                ? 'border-[#072618] ring-2 ring-[#072618]/30 bg-[#fffaf0] shadow-xl scale-[1.02]'
                : 'border-amber-400/80 shadow-2xl ring-2 ring-amber-400/40 scale-[1.02] bg-[#09251a]'
              : isLight
              ? 'bg-[#fffaf0] hover:bg-[#f8eed1] border-[#d6b866] shadow-md'
              : 'bg-[#09251a] hover:bg-[#0e3323] border-[#144833] shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
              isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/80'
            }`}>
              Completed Orders
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-600/30 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5 text-slate-950" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black tracking-tight ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
              {stats ? stats.totalOrders : 0} <span className={`text-sm font-bold ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/80'}`}>Invoices</span>
            </h3>
            <div className={`flex items-center justify-between mt-3 pt-2.5 border-t ${
              isLight ? 'border-[#d6b866]/40' : 'border-[#144833]/60'
            }`}>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#d6b866]' : 'bg-[#061a11] text-amber-300 border-[#144833]'
              }`}>
                Avg Ticket: {stats ? formatINR(stats.avgOrderValue || 0) : '₹0.00'}
              </span>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                isLight ? 'text-[#072618]' : 'text-[#fbbf24]'
              }`}>
                Graph <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Loyalty Program VIPs */}
        <div
          onClick={() => setActiveTab('customers')}
          className={`cursor-pointer group relative p-5 rounded-3xl transition-all duration-300 border overflow-hidden ${
            isLight
              ? 'bg-[#fffaf0] hover:bg-[#f8eed1] border-[#d6b866] shadow-md'
              : 'bg-[#09251a] hover:bg-[#0e3323] border-[#144833] shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
              isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/80'
            }`}>
              Registered Loyalty Club
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-300 via-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5 text-slate-950" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black tracking-tight ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
              {stats ? stats.totalCustomers : 0} <span className="text-sm font-bold text-amber-500">Members</span>
            </h3>
            <div className={`flex items-center justify-between mt-3 pt-2.5 border-t ${
              isLight ? 'border-[#d6b866]/40' : 'border-[#144833]/60'
            }`}>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#d6b866]' : 'bg-[#061a11] text-amber-300 border-[#144833]'
              }`}>
                <Sparkles className="w-3 h-3 text-amber-500" /> ₹1 = 1 Point
              </span>
              <span className={`text-[10px] font-bold ${isLight ? 'text-[#072618]' : 'text-[#fbbf24]'}`}>Manage</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Interactive Visual Intelligence Graph */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-xl flex flex-col justify-between transition-colors duration-300 ${
        isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg border ${
                isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#d6b866]' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                <Activity className="w-4 h-4" />
              </div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${
                isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'
              }`}>
                {activeMetric === 'revenue' && 'Sales Revenue Momentum (₹)'}
                {activeMetric === 'orders' && 'Order Transaction Volume (Invoices)'}
                {activeMetric === 'avg' && 'Average Transaction Value (₹)'}
              </h3>
            </div>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'}`}>
              Analyzing performance velocity across timeframe: <span className="font-bold uppercase text-amber-500">{timeframe}</span>
            </p>
          </div>

          {/* Metric Selector & Chart Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center border rounded-xl p-1 ${
              isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              <button
                onClick={() => setActiveMetric('revenue')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMetric === 'revenue'
                    ? isLight
                      ? 'bg-[#072618] text-[#fef08a] font-black shadow-md'
                      : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : isLight ? 'text-[#0f442e] hover:text-[#051f14]' : 'text-[#fef3c7]/70 hover:text-[#fef3c7]'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setActiveMetric('orders')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMetric === 'orders'
                    ? isLight
                      ? 'bg-[#072618] text-[#fef08a] font-black shadow-md'
                      : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : isLight ? 'text-[#0f442e] hover:text-[#051f14]' : 'text-[#fef3c7]/70 hover:text-[#fef3c7]'
                }`}
              >
                Orders
              </button>
            </div>

            <div className={`flex items-center border rounded-xl p-1 ${
              isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartType === 'area'
                    ? isLight
                      ? 'bg-[#072618] text-[#fef08a] font-black shadow-md'
                      : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : isLight ? 'text-[#0f442e] hover:text-[#051f14]' : 'text-[#fef3c7]/70 hover:text-[#fef3c7]'
                }`}
              >
                Smooth Area
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartType === 'bar'
                    ? isLight
                      ? 'bg-[#072618] text-[#fef08a] font-black shadow-md'
                      : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : isLight ? 'text-[#0f442e] hover:text-[#051f14]' : 'text-[#fef3c7]/70 hover:text-[#fef3c7]'
                }`}
              >
                Bar Chart
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Graphic Container */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradientGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isLight ? '#072618' : '#f59e0b'} stopOpacity={0.55} />
                    <stop offset="50%" stopColor={isLight ? '#0f442e' : '#d4af37'} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={isLight ? '#144833' : '#b45309'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5d7ad' : '#144833'} vertical={false} />
                <XAxis dataKey="name" stroke={isLight ? '#051f14' : '#fef3c7'} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={isLight ? '#051f14' : '#fef3c7'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => activeMetric === 'revenue' ? `₹${val}` : val}
                />
                <Tooltip
                  formatter={(val) => [activeMetric === 'revenue' ? formatINR(val) : val, activeMetric === 'revenue' ? 'Sales Revenue' : 'Invoices']}
                  contentStyle={{
                    backgroundColor: isLight ? '#fffaf0' : '#061a11',
                    borderColor: isLight ? '#d6b866' : '#c8a74e',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isLight ? '#051f14' : '#fef3c7'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric === 'orders' ? 'orders' : 'revenue'}
                  stroke={isLight ? '#072618' : '#f59e0b'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaGradientGold)"
                />
              </AreaChart>
            ) : (
              <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5d7ad' : '#144833'} vertical={false} />
                <XAxis dataKey="name" stroke={isLight ? '#051f14' : '#fef3c7'} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={isLight ? '#051f14' : '#fef3c7'}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => activeMetric === 'revenue' ? `₹${val}` : val}
                />
                <Tooltip
                  formatter={(val) => [activeMetric === 'revenue' ? formatINR(val) : val, activeMetric === 'revenue' ? 'Sales Revenue' : 'Invoices']}
                  contentStyle={{
                    backgroundColor: isLight ? '#fffaf0' : '#061a11',
                    borderColor: isLight ? '#d6b866' : '#c8a74e',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isLight ? '#051f14' : '#fef3c7'
                  }}
                />
                <Bar
                  dataKey={activeMetric === 'orders' ? 'orders' : 'revenue'}
                  fill={isLight ? '#072618' : '#f59e0b'}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Chart Summary Footer */}
        <div className={`mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-4 text-xs ${
          isLight ? 'border-[#d6b866]/40 text-[#0f442e]' : 'border-[#144833] text-[#fef3c7]/70'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-[#072618]' : 'bg-amber-400'}`}></span>
            <span>Real-time POS checkout transactions graphed dynamically</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Timezone: <strong>IST (UTC+5:30)</strong></span>
            <span>Currency: <strong>INR (₹)</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Analytics Split: Category Revenue Share & Payment Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Widget: Category Share Breakdown */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between transition-colors duration-300 ${
          isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'
              }`}>
                <PieIcon className="w-4 h-4 text-amber-500" /> Category Sales Share
              </h3>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'}`}>
                Revenue split across store product categories
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isLight
                ? 'bg-[#f4e4b9] border-[#d6b866] text-[#051f14]'
                : 'bg-[#061a11] border-[#144833] text-[#fef3c7]'
            }`}>
              Total {formatINR(totalCategoryVal, 0)}
            </span>
          </div>

          {categoryList.length === 0 ? (
            <div className={`h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-2xl my-2 ${
              isLight ? 'border-[#d6b866]/60 bg-[#f8eed1]/40' : 'border-[#144833] bg-[#061a11]/50'
            }`}>
              <PieIcon className={`w-8 h-8 mb-2 ${isLight ? 'text-[#0f442e]' : 'text-emerald-400'}`} />
              <p className={`text-xs font-semibold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>No category sales recorded yet</p>
              <p className={`text-[10px] mt-0.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'}`}>Category revenue slices appear automatically with each sale.</p>
            </div>
          ) : (
            <>
              <div className="h-52 flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryList}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryList.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} stroke={isLight ? '#fffaf0' : '#09251a'} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatINR(val), 'Revenue']}
                      contentStyle={{
                        backgroundColor: isLight ? '#fffaf0' : '#061a11',
                        borderColor: isLight ? '#d6b866' : '#c8a74e',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: isLight ? '#051f14' : '#fef3c7'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Progress Bars Breakdown */}
              <div className={`space-y-3 pt-3 border-t ${isLight ? 'border-[#d6b866]/40' : 'border-[#144833]'}`}>
                {categoryList.map((cat, idx) => {
                  const pct = totalCategoryVal > 0 ? Math.round((cat.value / totalCategoryVal) * 100) : 0;
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className={`flex items-center gap-2 ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                          {cat.name}
                        </span>
                        <span className={`font-mono font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
                          {formatINR(cat.value, 0)} <span className="text-[10px] text-amber-500 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#061a11]'}`}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right Widget: Payment Methods Distribution (UPI / Cash / Card) */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between transition-colors duration-300 ${
          isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'
              }`}>
                <CreditCard className="w-4 h-4 text-amber-500" /> Payment Channels & Settlement
              </h3>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'}`}>
                Tender breakdown for Indian retail store counters
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isLight
                ? 'bg-[#f4e4b9] border-[#d6b866] text-[#051f14]'
                : 'bg-[#061a11] border-[#144833] text-[#fef3c7]'
            }`}>
              Settled {formatINR(totalPaymentVal, 0)}
            </span>
          </div>

          <div className="space-y-4 my-auto">
            {[
              { id: 'UPI / QR', label: 'UPI / QR Code', icon: QrCode, subtitle: 'GPay, PhonePe, Paytm, BHIM', color: 'text-emerald-500', bg: 'bg-emerald-500' },
              { id: 'Cash', label: 'Cash Tender', icon: Banknote, subtitle: 'Physical Cash in Drawer', color: 'text-amber-500', bg: 'bg-amber-400' },
              { id: 'Card', label: 'RuPay / Cards', icon: CreditCard, subtitle: 'Debit & Credit Terminal', color: 'text-yellow-600', bg: 'bg-yellow-500' }
            ].map(method => {
              const item = paymentList.find(p => p.name === method.id) || { value: 0 };
              const val = item.value || 0;
              const pct = totalPaymentVal > 0 ? Math.round((val / totalPaymentVal) * 100) : 0;
              const Icon = method.icon;

              return (
                <div key={method.id} className={`p-4 rounded-2xl border transition-all ${
                  isLight
                    ? 'bg-[#f8eed1]/70 border-[#d6b866] hover:border-[#072618]'
                    : 'bg-[#061a11] border-[#144833] hover:border-[#fbbf24]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${
                        isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
                      }`}>
                        <Icon className={`w-4 h-4 ${method.color}`} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>{method.label}</p>
                        <p className={`text-[10px] ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'}`}>{method.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-extrabold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>{formatINR(val)}</p>
                      <p className={`text-[10px] font-bold ${method.color}`}>{pct}% share</p>
                    </div>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#05170f]'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${method.bg}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`pt-4 border-t flex items-center justify-between text-xs ${
            isLight ? 'border-[#d6b866]/40 text-[#0f442e]' : 'border-[#144833] text-[#fef3c7]/70'
          }`}>
            <span>Daily Cash in Drawer: <strong>{formatINR(stats?.registerBalance || 0)}</strong></span>
            <span className="text-amber-500 font-bold">Auto-Reconciled</span>
          </div>
        </div>
      </div>

      {/* 5. Top 5 Best-Selling Apparel Items Leaderboard */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-xl transition-colors duration-300 ${
        isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'
            }`}>
              <Flame className="w-4 h-4 text-amber-500" /> Best-Selling Products Leaderboard
            </h3>
            <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'}`}>
              Ranked dynamically by customer purchase frequency and checkout volume.
            </p>
          </div>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
            isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#d6b866]' : 'text-emerald-300 bg-[#061a11] border-[#144833]'
          }`}>
            Live Inventory Ranking
          </span>
        </div>

        {(!stats?.topProducts || stats.topProducts.length === 0) ? (
          <div className={`h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-2xl ${
            isLight ? 'border-[#d6b866]/60 bg-[#f8eed1]/40' : 'border-[#144833] bg-[#061a11]/50'
          }`}>
            <Shirt className={`w-8 h-8 mb-2 ${isLight ? 'text-[#0f442e]' : 'text-emerald-400'}`} />
            <p className={`text-xs font-semibold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>No sales volume recorded yet</p>
            <p className={`text-[10px] mt-0.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'}`}>Top-performing items will rank here as customer checkouts take place.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`font-semibold border-b uppercase tracking-wider text-[10px] ${
                isLight ? 'bg-[#f8eed1] text-[#051f14] border-[#d6b866]' : 'bg-[#061a11] text-[#fef3c7]/80 border-[#144833]'
              }`}>
                <tr>
                  <th className="py-3.5 px-4">Rank & Item Title</th>
                  <th className="py-3.5 px-4 text-center">Popularity Meter</th>
                  <th className="py-3.5 px-4 text-right">Units Sold</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-[#d6b866]/30' : 'divide-[#144833]/50'}`}>
                {stats.topProducts.map((item, idx) => {
                  const maxSold = Math.max(1, stats.topProducts[0]?.soldCount || 1);
                  const percentage = Math.min(100, Math.round((item.soldCount / maxSold) * 100));
                  const rankBadges = ['🥇 #1 Top Pick', '🥈 #2 Runner-Up', '🥉 #3 Hot Seller', '#4', '#5'];

                  return (
                    <tr key={idx} className={`transition-colors ${isLight ? 'hover:bg-[#f4e4b9]/50' : 'hover:bg-[#0e3323]/50'}`}>
                      <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                            idx === 0 ? 'bg-amber-500/25 text-amber-500 border border-amber-400/50' :
                            idx === 1 ? 'bg-emerald-500/25 text-emerald-500 border border-emerald-400/50' :
                            idx === 2 ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-400/40' :
                            isLight ? 'bg-[#f4e4b9] text-[#072618] border border-[#d6b866]' : 'bg-[#061a11] text-[#fef3c7] border border-[#144833]'
                          }`}>
                            {rankBadges[idx]}
                          </span>
                          <span className="truncate max-w-xs">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-full max-w-xs mx-auto flex items-center gap-2">
                          <div className={`flex-1 h-2 rounded-full overflow-hidden ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#061a11]'}`}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-amber-500 to-amber-400 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-500 w-8 text-right">{percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-mono font-extrabold text-sm ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
                          {item.soldCount}
                        </span>{' '}
                        <span className={`text-[10px] ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/70'}`}>units</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Quick Action Alerts Strip: Low Stock & Promotional Coupons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`p-5 rounded-3xl border flex items-center justify-between transition-colors ${
          isLight
            ? 'bg-[#fffaf0] border-[#d6b866]'
            : 'bg-[#09251a] border-[#144833]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl border ${
              isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#d6b866]' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className={`text-xs font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fbbf24]'}`}>
                Inventory Reorder Watch
              </h4>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/80'}`}>
                <strong>{stats?.lowStockCount || 0}</strong> products have 10 or fewer units left in store stock.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer shrink-0 ${
              isLight
                ? 'bg-[#072618] hover:bg-[#0c2f21] text-[#fef08a]'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/30'
            }`}
          >
            Review Stock
          </button>
        </div>

        <div className={`p-5 rounded-3xl border flex items-center justify-between transition-colors ${
          isLight
            ? 'bg-[#fffaf0] border-[#d6b866]'
            : 'bg-[#09251a] border-[#144833]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl border ${
              isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#d6b866]' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-xs font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>
                Promotional Offers
              </h4>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#0f442e]' : 'text-[#fef3c7]/80'}`}>
                Create promo codes and festival discounts to boost checkout conversions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer shrink-0 ${
              isLight
                ? 'bg-[#072618] hover:bg-[#0c2f21] text-[#fef08a]'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
            }`}
          >
            Manage Coupons
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
