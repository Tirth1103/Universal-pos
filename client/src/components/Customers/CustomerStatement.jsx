import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, DollarSign, ShieldAlert, Award, Sliders, X, ArrowDownLeft } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { ledgerAPI, customerAPI } from '../../services/api';
import { formatINR } from '../../utils/formatters';

const CustomerStatement = () => {
  const { customers, showToast, theme, fetchCustomers } = usePOS();
  const isLight = theme === 'light';

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?._id || customers[0]?.id || '');
  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    creditLimit: 0,
    pricingTier: 'Standard',
    gstin: '',
    customerType: 'Retail'
  });

  const fetchStatement = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await ledgerAPI.getCustomerLedger(id);
      if (res.data?.success) {
        setStatementData(res.data.data);
        const cust = res.data.data.customer;
        setSettingsForm({
          creditLimit: cust.creditLimit || 0,
          pricingTier: cust.pricingTier || 'Standard',
          gstin: cust.gstin || '',
          customerType: cust.customerType || 'Retail'
        });
      }
    } catch (err) {
      showToast('Failed to load customer statement', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchStatement(selectedCustomerId);
    }
  }, [selectedCustomerId, fetchStatement]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      showToast('Enter a valid payment amount', 'warning');
      return;
    }

    try {
      const res = await ledgerAPI.recordPayment(selectedCustomerId, {
        amount: amt,
        paymentMode
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Payment received recorded!', 'success');
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
        fetchStatement(selectedCustomerId);
        fetchCustomers();
      }
    } catch (err) {
      showToast('Failed to record payment', 'error');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await ledgerAPI.updateSettings(selectedCustomerId, settingsForm);
      if (res.data?.success) {
        showToast('Customer terms updated!', 'success');
        setIsSettingsModalOpen(false);
        fetchStatement(selectedCustomerId);
        fetchCustomers();
      }
    } catch (err) {
      showToast('Failed to update terms', 'error');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const activeCustomer = statementData?.customer;
  const currentBalance = statementData?.currentBalance || 0;
  const creditLimit = statementData?.creditLimit || 0;
  const creditUsedPercent = creditLimit > 0 ? Math.min(100, Math.round((currentBalance / creditLimit) * 100)) : 0;

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black flex items-center gap-2.5 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <Award className="w-7 h-7 text-amber-500" />
            Customer Khata, Ledgers & Credit Guard
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-amber-400/80'}`}>
            Enforce credit limits during checkout, view running statements, and manage party pricing tiers
          </p>
        </div>
      </div>

      {/* Main Two-Column Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Directory */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none ${
                isLight ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14]' : 'bg-[#09251a] border-[#1a5a40] text-white'
              }`}
            />
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredCustomers.map(c => {
              const isSelected = selectedCustomerId === (c._id || c.id);
              return (
                <div
                  key={c._id || c.id}
                  onClick={() => setSelectedCustomerId(c._id || c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-[#072418] text-[#fef08a] border-[#072418] shadow-md'
                        : 'bg-amber-400 text-[#051a10] border-amber-400 shadow-md font-bold'
                      : isLight
                      ? 'bg-[#f4e4b9] border-[#c8a74e] hover:border-[#072418]'
                      : 'bg-[#09251a] border-[#1a5a40] hover:border-amber-400/60 text-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-xs">{c.name}</h4>
                      <p className="text-[10px] opacity-70 mt-0.5">{c.phone}</p>
                      <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase">
                        {c.pricingTier || 'Standard'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider opacity-70 block">Udhar Balance</span>
                      <span className={`text-xs font-black ${
                        isSelected ? '' : (c.currentBalance || 0) > 0 ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        {formatINR(c.currentBalance || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Ledger Statement Detail */}
        <div className="lg:col-span-8">
          {activeCustomer ? (
            <div className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              {/* Customer Profile & Credit Guard Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black">{activeCustomer.name}</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Tier: {activeCustomer.pricingTier || 'Standard'}
                    </span>
                  </div>
                  <p className="text-xs opacity-70 mt-0.5">
                    Phone: {activeCustomer.phone} {activeCustomer.gstin ? `• GSTIN: ${activeCustomer.gstin}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      isLight ? 'border-[#c8a74e]' : 'border-[#1a5a40] text-amber-300'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Credit & Pricing Terms
                  </button>

                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black shadow-md cursor-pointer ${
                      isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-emerald-500 text-slate-950 font-black'
                    }`}
                  >
                    Record Payment
                  </button>
                </div>
              </div>

              {/* Credit Guard Bar */}
              <div className={`p-4 rounded-2xl border ${
                isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
              }`}>
                <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Credit Guard Enforcer
                  </span>
                  <span>
                    Receivable: <span className="font-black text-red-500">{formatINR(currentBalance)}</span> / Limit: {creditLimit > 0 ? formatINR(creditLimit) : 'No Limit'}
                  </span>
                </div>
                {creditLimit > 0 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        creditUsedPercent > 90 ? 'bg-red-500' : creditUsedPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${creditUsedPercent}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Chronological Statement Table */}
              {loading ? (
                <div className="text-center py-12 text-xs font-bold animate-pulse">Loading statement...</div>
              ) : statementData?.transactions?.length === 0 ? (
                <div className="p-8 text-center text-xs opacity-60">No ledger transactions logged.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-current/15 opacity-70 text-[10px] uppercase font-bold">
                        <th className="py-2">Date</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Ref #</th>
                        <th className="py-2 text-right">Debit (Udhar)</th>
                        <th className="py-2 text-right">Credit (Received)</th>
                        <th className="py-2 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-current/10">
                      {statementData?.transactions?.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-current/5">
                          <td className="py-2 opacity-80">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="py-2 font-bold">{tx.type}</td>
                          <td className="py-2 font-mono text-[11px] opacity-70">{tx.referenceNumber}</td>
                          <td className="py-2 text-right text-red-500 font-bold">
                            {tx.debit > 0 ? formatINR(tx.debit) : '-'}
                          </td>
                          <td className="py-2 text-right text-emerald-500 font-bold">
                            {tx.credit > 0 ? formatINR(tx.credit) : '-'}
                          </td>
                          <td className="py-2 text-right font-black">
                            {formatINR(tx.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs opacity-60">Select a customer to view their Khata statement.</div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <h3 className="font-black text-sm">Record Customer Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-5 space-y-3 text-xs">
              <div>
                <span className="block opacity-70 mb-1">Customer: {activeCustomer.name}</span>
                <span className="text-sm font-black text-red-500">Current Udhar: {formatINR(currentBalance)}</span>
              </div>
              <div>
                <label className="block font-bold mb-1">Amount Received (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-sm font-black focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / QR">UPI / QR</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className={`px-5 py-2 rounded-xl font-black ${isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-emerald-500 text-slate-950 font-black'}`}>
                  Record Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal (Credit Limit & Pricing Tier) */}
      {isSettingsModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <h3 className="font-black text-sm">Party Credit & Pricing Terms</h3>
              <button onClick={() => setIsSettingsModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateSettings} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Credit Limit (₹) (0 = No Credit Allowed)</label>
                <input
                  type="number"
                  value={settingsForm.creditLimit}
                  onChange={(e) => setSettingsForm({ ...settingsForm, creditLimit: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border font-bold focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Pricing Tier</label>
                <select
                  value={settingsForm.pricingTier}
                  onChange={(e) => setSettingsForm({ ...settingsForm, pricingTier: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border font-bold focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                >
                  <option value="Standard">Standard (Retail Shelf Price)</option>
                  <option value="Wholesale">Wholesale (B2B Bulk Rate)</option>
                  <option value="Special">Special (Distributor / VIP Rate)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Customer GSTIN</label>
                <input
                  type="text"
                  placeholder="e.g. 24AABCU9603R1ZM"
                  value={settingsForm.gstin}
                  onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsSettingsModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className={`px-5 py-2 rounded-xl font-black ${isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'}`}>
                  Save Terms
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerStatement;
