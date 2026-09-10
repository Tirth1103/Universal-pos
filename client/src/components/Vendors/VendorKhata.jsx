import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Search, DollarSign, ArrowUpRight, ArrowDownLeft, X, FileText } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { vendorAPI } from '../../services/api';
import { formatINR } from '../../utils/formatters';

const VendorKhata = () => {
  const { showToast, theme } = usePOS();
  const isLight = theme === 'light';

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorLedger, setVendorLedger] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Modals
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    gstin: '',
    openingBalance: ''
  });

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vendorAPI.getAll({ search });
      if (res.data?.success) {
        setVendors(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleSelectVendor = async (vendor) => {
    setSelectedVendor(vendor);
    setLoadingLedger(true);
    try {
      const res = await vendorAPI.getLedger(vendor._id || vendor.id);
      if (res.data?.success) {
        setVendorLedger(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load vendor ledger', 'error');
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!newVendorForm.name || !newVendorForm.phone) {
      showToast('Vendor name and phone required', 'warning');
      return;
    }

    try {
      const res = await vendorAPI.create(newVendorForm);
      if (res.data?.success) {
        showToast('Vendor registered to Khata!', 'success');
        setIsAddVendorOpen(false);
        setNewVendorForm({ name: '', companyName: '', phone: '', email: '', gstin: '', openingBalance: '' });
        fetchVendors();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add vendor', 'error');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      showToast('Enter valid settlement amount', 'warning');
      return;
    }

    try {
      const res = await vendorAPI.recordPayment(selectedVendor._id || selectedVendor.id, {
        amount: Number(paymentAmount),
        paymentMethod
      });
      if (res.data?.success) {
        showToast('Payment recorded successfully!', 'success');
        setIsPaymentOpen(false);
        setPaymentAmount('');
        fetchVendors();
        if (selectedVendor) handleSelectVendor(selectedVendor);
      }
    } catch (err) {
      showToast('Failed to record payment', 'error');
    }
  };

  const totalPayables = vendors.reduce((acc, v) => acc + (v.currentBalance || 0), 0);

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black flex items-center gap-2.5 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <Truck className="w-7 h-7 text-amber-500" />
            Vendor Khata & Supplier Ledgers
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-amber-400/80'}`}>
            Track total payables, purchase debts, settlements, and running statements per supplier
          </p>
        </div>

        <button
          onClick={() => setIsAddVendorOpen(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-transform active:scale-98 cursor-pointer ${
            isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className={`p-4 rounded-3xl border flex items-center justify-between shadow-sm ${
        isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
      }`}>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Total Outstanding Payables</span>
          <h2 className="text-2xl font-black text-red-500 mt-0.5">{formatINR(totalPayables)}</h2>
        </div>
        <div className="text-right text-xs">
          <span className="font-bold opacity-70">Registered Suppliers:</span>
          <span className="font-black ml-1.5">{vendors.length}</span>
        </div>
      </div>

      {/* Main Two-Column Layout (Vendors List + Ledger Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Vendors Directory */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              type="text"
              placeholder="Search vendor name, phone, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none ${
                isLight ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14]' : 'bg-[#09251a] border-[#1a5a40] text-white'
              }`}
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs font-bold animate-pulse">Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <div className="p-8 text-center text-xs opacity-60">No vendors found. Add your first supplier!</div>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {vendors.map((v) => {
                const isSelected = selectedVendor && (selectedVendor._id === v._id || selectedVendor.id === v.id);
                return (
                  <div
                    key={v._id || v.id}
                    onClick={() => handleSelectVendor(v)}
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
                        <h4 className="font-black text-xs">{v.name}</h4>
                        {v.companyName && <p className="text-[11px] opacity-80">{v.companyName}</p>}
                        <p className="text-[10px] opacity-60 mt-0.5">{v.phone}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider opacity-70 block">Payable</span>
                        <span className={`text-xs font-black ${
                          isSelected ? '' : v.currentBalance > 0 ? 'text-red-500' : 'text-emerald-500'
                        }`}>
                          {formatINR(v.currentBalance || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Vendor Ledger Statement */}
        <div className="lg:col-span-7">
          {selectedVendor ? (
            <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h3 className="font-black text-base">{selectedVendor.name}</h3>
                  <p className="text-xs opacity-70">
                    {selectedVendor.companyName} • GSTIN: {selectedVendor.gstin || 'Unregistered'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[9px] uppercase block opacity-70">Current Payable</span>
                    <span className="text-sm font-black text-red-500">
                      {formatINR(selectedVendor.currentBalance || 0)}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPaymentOpen(true)}
                    className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-black shadow-md cursor-pointer ${
                      isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'
                    }`}
                  >
                    Pay Supplier
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              {loadingLedger ? (
                <div className="text-center py-12 text-xs font-bold animate-pulse">Loading ledger...</div>
              ) : vendorLedger?.ledger?.length === 0 ? (
                <div className="p-8 text-center text-xs opacity-60">No transaction records logged for this vendor.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-current/15 opacity-70 text-[10px] uppercase font-bold">
                        <th className="py-2">Date</th>
                        <th className="py-2">Particulars</th>
                        <th className="py-2">Ref #</th>
                        <th className="py-2 text-right">Debit (₹)</th>
                        <th className="py-2 text-right">Credit (₹)</th>
                        <th className="py-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-current/10">
                      {vendorLedger?.ledger?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-current/5">
                          <td className="py-2 opacity-80">{new Date(row.date).toLocaleDateString()}</td>
                          <td className="py-2 font-bold">{row.type}</td>
                          <td className="py-2 font-mono text-[11px] opacity-70">{row.refNo}</td>
                          <td className="py-2 text-right text-emerald-500 font-bold">
                            {row.debit > 0 ? formatINR(row.debit) : '-'}
                          </td>
                          <td className="py-2 text-right text-red-500 font-bold">
                            {row.credit > 0 ? formatINR(row.credit) : '-'}
                          </td>
                          <td className="py-2 text-right font-black">
                            {formatINR(row.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className={`p-12 rounded-3xl border text-center ${
              isLight ? 'bg-[#f4e4b9]/60 border-[#c8a74e]' : 'bg-[#09251a]/40 border-[#1a5a40]'
            }`}>
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <h3 className="font-bold text-sm">No Vendor Selected</h3>
              <p className="text-xs opacity-60 mt-1">Select a supplier on the left to inspect their Khata ledger and log payments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Vendor Modal */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <h3 className="font-black text-sm">Add New Vendor to Khata</h3>
              <button onClick={() => setIsAddVendorOpen(false)} className="p-1 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateVendor} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Contact Person Name</label>
                <input
                  type="text"
                  required
                  value={newVendorForm.name}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Company / Supplier Business Name</label>
                <input
                  type="text"
                  value={newVendorForm.companyName}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, companyName: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newVendorForm.phone}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                    className={`w-full p-2 rounded-xl border focus:outline-none ${
                      isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={newVendorForm.gstin}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, gstin: e.target.value })}
                    className={`w-full p-2 rounded-xl border focus:outline-none ${
                      isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Opening Balance Payable (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newVendorForm.openingBalance}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, openingBalance: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsAddVendorOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className={`px-5 py-2 rounded-xl font-black ${isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'}`}>
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {isPaymentOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <h3 className="font-black text-sm">Pay Vendor: {selectedVendor.name}</h3>
              <button onClick={() => setIsPaymentOpen(false)} className="p-1 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-5 space-y-3 text-xs">
              <div>
                <span className="block opacity-70 mb-1">Current Payable:</span>
                <span className="text-base font-black text-red-500">{formatINR(selectedVendor.currentBalance || 0)}</span>
              </div>
              <div>
                <label className="block font-bold mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="any"
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
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="Cash">Cash Drawer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsPaymentOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className={`px-5 py-2 rounded-xl font-black ${isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-emerald-500 text-slate-950'}`}>
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorKhata;
