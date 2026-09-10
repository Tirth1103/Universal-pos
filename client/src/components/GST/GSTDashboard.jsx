import React, { useState, useEffect, useCallback } from 'react';
import { Landmark, FileText, Download, ShieldCheck, QrCode, RefreshCw, Layers } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { gstAPI } from '../../services/api';
import { formatINR } from '../../utils/formatters';

const GSTDashboard = () => {
  const { showToast, theme } = usePOS();
  const isLight = theme === 'light';

  const [activeReport, setActiveReport] = useState('gstr3b'); // 'gstr3b', 'gstr1', 'gstr2'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // E-Invoice stub state
  const [isEInvoiceOpen, setIsEInvoiceOpen] = useState(false);
  const [eInvoiceResult, setEInvoiceResult] = useState(null);
  const [testInvNo, setTestInvNo] = useState('INV-2026-1001');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeReport === 'gstr1') res = await gstAPI.getGSTR1({ month, year });
      else if (activeReport === 'gstr2') res = await gstAPI.getGSTR2({ month, year });
      else res = await gstAPI.getGSTR3B({ month, year });

      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load GST reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeReport, month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportExcel = (type) => {
    window.open(gstAPI.exportReportUrl(type), '_blank');
    showToast(`Downloading official ${type.toUpperCase()} Excel worksheet`, 'success');
  };

  const handleGenerateEInvoice = async () => {
    try {
      const res = await gstAPI.generateEInvoiceStub({ invoiceNumber: testInvNo });
      if (res.data?.success) {
        setEInvoiceResult(res.data.data);
        showToast('E-Invoice and E-Way Bill stubs generated!', 'success');
      }
    } catch (err) {
      showToast('Failed to generate E-Invoice', 'error');
    }
  };

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black flex items-center gap-2.5 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <Landmark className="w-7 h-7 text-amber-500" />
            GST Compliance & Tax Reports Center
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-amber-400/80'}`}>
            Automated CGST/SGST/IGST tax splitting, GSTR-1, GSTR-2, GSTR-3B filings, and E-Way/E-Invoice compliance
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEInvoiceOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm cursor-pointer ${
              isLight ? 'bg-[#ebd89f] border-[#baa04e] text-[#051f14]' : 'bg-[#09251a] border-[#1a5a40] text-amber-300'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-500" />
            E-Invoice & E-Way Stub
          </button>

          <button
            onClick={() => handleExportExcel(activeReport)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-lg cursor-pointer ${
              isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'
            }`}
          >
            <Download className="w-4 h-4" />
            Export {activeReport.toUpperCase()} Excel
          </button>
        </div>
      </div>

      {/* Period Selector & Report Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex gap-2">
          {[
            { id: 'gstr3b', label: 'GSTR-3B (Net Tax Summary)' },
            { id: 'gstr1', label: 'GSTR-1 (Outward Sales)' },
            { id: 'gstr2', label: 'GSTR-2 (Inward Purchases & ITC)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeReport === tab.id
                  ? isLight
                    ? 'bg-[#072418] text-[#fef08a] border-[#072418]'
                    : 'bg-amber-400 text-[#051a10] border-amber-400 font-black'
                  : isLight
                  ? 'bg-[#f4e4b9] border-[#c8a74e]'
                  : 'bg-[#09251a] border-[#1a5a40] text-amber-300/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={`p-2 rounded-xl border font-bold focus:outline-none ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
            }`}
          >
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={`p-2 rounded-xl border font-bold focus:outline-none ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
            }`}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="text-center py-12 text-xs font-bold animate-pulse">Calculating tax summaries...</div>
      ) : activeReport === 'gstr3b' ? (
        /* GSTR-3B Net Tax Summary View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Output Tax Liability */}
            <div className={`p-5 rounded-3xl border ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">1. Total Output GST (Sales)</span>
              <h3 className="text-xl font-black text-amber-500 mt-1">
                {formatINR(reportData?.outwardSupplies?.totalOutputTax || 0)}
              </h3>
              <div className="mt-3 pt-2 border-t border-current/10 space-y-1 text-xs opacity-80">
                <div className="flex justify-between">
                  <span>CGST:</span>
                  <span className="font-bold">{formatINR(reportData?.outwardSupplies?.cgst || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST:</span>
                  <span className="font-bold">{formatINR(reportData?.outwardSupplies?.sgst || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <span className="font-bold">{formatINR(reportData?.outwardSupplies?.taxableAmount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Input Tax Credit (ITC) */}
            <div className={`p-5 rounded-3xl border ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">2. Eligible ITC (Purchases)</span>
              <h3 className="text-xl font-black text-emerald-500 mt-1">
                {formatINR(reportData?.eligibleITC?.totalITC || 0)}
              </h3>
              <div className="mt-3 pt-2 border-t border-current/10 space-y-1 text-xs opacity-80">
                <div className="flex justify-between">
                  <span>ITC CGST:</span>
                  <span className="font-bold">{formatINR(reportData?.eligibleITC?.cgst || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ITC SGST:</span>
                  <span className="font-bold">{formatINR(reportData?.eligibleITC?.sgst || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-500">Fully Claimable</span>
                </div>
              </div>
            </div>

            {/* Net Tax Cash Payable */}
            <div className={`p-5 rounded-3xl border ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">3. Net Tax Payable in Cash</span>
              <h3 className="text-xl font-black text-red-500 mt-1">
                {formatINR(reportData?.netTaxPayable?.totalNetPayable || 0)}
              </h3>
              <div className="mt-3 pt-2 border-t border-current/10 space-y-1 text-xs opacity-80">
                <div className="flex justify-between">
                  <span>Net CGST:</span>
                  <span className="font-bold">{formatINR(reportData?.netTaxPayable?.netCGST || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net SGST:</span>
                  <span className="font-bold">{formatINR(reportData?.netTaxPayable?.netSGST || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Formula:</span>
                  <span className="font-bold">Output - ITC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeReport === 'gstr1' ? (
        /* GSTR-1 View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#09251a]'}`}>
              <span className="opacity-70 text-[10px] uppercase font-bold block">B2B Invoices</span>
              <span className="text-lg font-black">{reportData?.summary?.b2bCount || 0}</span>
            </div>
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#09251a]'}`}>
              <span className="opacity-70 text-[10px] uppercase font-bold block">B2C Retail Sales</span>
              <span className="text-lg font-black">{reportData?.summary?.b2cCount || 0}</span>
            </div>
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#09251a]'}`}>
              <span className="opacity-70 text-[10px] uppercase font-bold block">Total Taxable Value</span>
              <span className="text-lg font-black">{formatINR(reportData?.summary?.totalOutwardTaxable || 0)}</span>
            </div>
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#09251a]'}`}>
              <span className="opacity-70 text-[10px] uppercase font-bold block">Total GST Collected</span>
              <span className="text-lg font-black text-amber-500">{formatINR(reportData?.summary?.totalTax || 0)}</span>
            </div>
          </div>

          {/* HSN Summary */}
          {reportData?.hsnSummary?.length > 0 && (
            <div className={`p-5 rounded-3xl border shadow-sm ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#09251a]'}`}>
              <h3 className="font-black text-sm mb-3">HSN / SAC Code Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-current/15 opacity-70 text-[10px] uppercase font-bold">
                      <th className="py-2">HSN / SAC</th>
                      <th className="py-2">Description</th>
                      <th className="py-2 text-right">Total Qty</th>
                      <th className="py-2 text-right">Taxable Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-current/10">
                    {reportData.hsnSummary.map((h, idx) => (
                      <tr key={idx}>
                        <td className="py-2 font-mono font-bold">{h.hsnCode}</td>
                        <td className="py-2">{h.description}</td>
                        <td className="py-2 text-right font-bold">{h.totalQuantity}</td>
                        <td className="py-2 text-right font-black">{formatINR(h.taxableValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GSTR-2 View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#09251a]'}`}>
              <span className="opacity-70 text-[10px] uppercase font-bold block">Purchase Bills Inward</span>
              <span className="text-lg font-black">{reportData?.summary?.totalBills || 0}</span>
            </div>
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#09251a]'}`}>
              <span className="opacity-70 text-[10px] uppercase font-bold block">Inward Taxable Purchases</span>
              <span className="text-lg font-black">{formatINR(reportData?.summary?.totalInwardTaxable || 0)}</span>
            </div>
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-[#f4e4b9]' : 'bg-[#09251a]'}`}>
              <span className="opacity-70 text-[10px] uppercase font-bold block">Claimable ITC</span>
              <span className="text-lg font-black text-emerald-500">{formatINR(reportData?.summary?.totalITCClaimable || 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* E-Invoice / E-Way Modal */}
      {isEInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <h3 className="font-black text-sm">Government E-Invoice & E-Way Bill Stubs</h3>
              <button onClick={() => setIsEInvoiceOpen(false)} className="p-1 rounded-lg">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Tax Invoice Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testInvNo}
                    onChange={(e) => setTestInvNo(e.target.value)}
                    className={`flex-1 p-2 rounded-xl border font-bold focus:outline-none ${
                      isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                    }`}
                  />
                  <button
                    onClick={handleGenerateEInvoice}
                    className={`px-4 py-2 rounded-xl font-black cursor-pointer ${
                      isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'
                    }`}
                  >
                    Generate IRN
                  </button>
                </div>
              </div>

              {eInvoiceResult && (
                <div className={`p-4 rounded-2xl border space-y-2 font-mono text-[11px] ${
                  isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
                }`}>
                  <div>
                    <span className="opacity-70 block text-[9px] uppercase font-sans font-bold">Invoice Reference Number (IRN):</span>
                    <span className="font-bold text-amber-500 break-all">{eInvoiceResult.irn}</span>
                  </div>
                  <div>
                    <span className="opacity-70 block text-[9px] uppercase font-sans font-bold">Ack Number:</span>
                    <span>{eInvoiceResult.ackNo}</span>
                  </div>
                  <div>
                    <span className="opacity-70 block text-[9px] uppercase font-sans font-bold">E-Way Bill Number:</span>
                    <span className="text-emerald-500 font-bold">{eInvoiceResult.ewayBill?.ewayBillNo}</span>
                  </div>
                  <div>
                    <span className="opacity-70 block text-[9px] uppercase font-sans font-bold">Vehicle:</span>
                    <span>{eInvoiceResult.ewayBill?.vehicleNumber} ({eInvoiceResult.ewayBill?.transporterName})</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTDashboard;
