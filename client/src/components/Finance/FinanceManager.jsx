import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, ArrowRightLeft, CreditCard, Banknote, CheckCircle2, Clock, AlertCircle, X, DollarSign } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { financeAPI } from '../../services/api';
import { formatINR } from '../../utils/formatters';

const FinanceManager = () => {
  const { showToast, theme } = usePOS();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts', 'expenses', 'cheques'
  const [accounts, setAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddChequeOpen, setIsAddChequeOpen] = useState(false);

  // Forms
  const [accountForm, setAccountForm] = useState({ name: '', accountType: 'Bank Account', bankName: '', accountNumber: '', currentBalance: '' });
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Rent', amount: '', paymentAccountId: '', paidTo: '', notes: '' });
  const [chequeForm, setChequeForm] = useState({ type: 'Received', partyName: '', chequeNumber: '', bankName: '', amount: '', chequeDate: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, expRes, chqRes] = await Promise.all([
        financeAPI.getAccounts(),
        financeAPI.getExpenses(),
        financeAPI.getCheques()
      ]);
      if (accRes.data?.success) setAccounts(accRes.data.data);
      if (expRes.data?.success) setExpenses(expRes.data.data);
      if (chqRes.data?.success) setCheques(chqRes.data.data);
    } catch (err) {
      showToast('Failed to load finance records', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await financeAPI.createAccount(accountForm);
      if (res.data?.success) {
        showToast('Account added', 'success');
        setIsAddAccountOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast('Failed to create account', 'error');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const res = await financeAPI.transferFunds(transferForm);
      if (res.data?.success) {
        showToast('Funds transferred successfully', 'success');
        setIsTransferOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Transfer failed', 'error');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await financeAPI.createExpense(expenseForm);
      if (res.data?.success) {
        showToast('Expense recorded', 'success');
        setIsAddExpenseOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast('Failed to record expense', 'error');
    }
  };

  const handleCreateCheque = async (e) => {
    e.preventDefault();
    try {
      const res = await financeAPI.createCheque(chequeForm);
      if (res.data?.success) {
        showToast('Cheque record logged', 'success');
        setIsAddChequeOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast('Failed to record cheque', 'error');
    }
  };

  const handleUpdateCheque = async (id, status) => {
    try {
      const defaultAcc = accounts[0]?._id || accounts[0]?.id;
      const res = await financeAPI.updateChequeStatus(id, { status, accountId: defaultAcc });
      if (res.data?.success) {
        showToast(`Cheque marked as ${status}`, 'success');
        fetchData();
      }
    } catch (err) {
      showToast('Failed to update cheque', 'error');
    }
  };

  const totalLiquidBalance = accounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black flex items-center gap-2.5 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <Wallet className="w-7 h-7 text-amber-500" />
            Cash Drawer, Multi-Accounts & Expenses
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-amber-400/80'}`}>
            Manage physical cash registers, bank deposits, cheques lifecycle, and operational overheads
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsTransferOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm cursor-pointer ${
              isLight ? 'bg-[#ebd89f] border-[#baa04e]' : 'bg-[#09251a] border-[#1a5a40] text-amber-300'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfer Funds
          </button>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-lg cursor-pointer ${
              isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-red-500 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            Log Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`p-4 rounded-3xl border flex items-center justify-between ${
          isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Total Liquid Balance</span>
            <h2 className="text-2xl font-black text-emerald-500 mt-0.5">{formatINR(totalLiquidBalance)}</h2>
          </div>
          <span className="text-xs font-bold opacity-80">{accounts.length} Active Accounts</span>
        </div>

        <div className={`p-4 rounded-3xl border flex items-center justify-between ${
          isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Total Logged Overheads</span>
            <h2 className="text-2xl font-black text-red-500 mt-0.5">{formatINR(totalExpenses)}</h2>
          </div>
          <span className="text-xs font-bold opacity-80">{expenses.length} Records</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {['accounts', 'expenses', 'cheques'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
              activeTab === t
                ? isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10] font-black'
                : isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-amber-300/80'
            }`}
          >
            {t === 'accounts' ? 'Payment Accounts' : t === 'expenses' ? 'Operational Expenses' : 'Cheques Tracker'}
          </button>
        ))}
      </div>

      {/* Tab Views */}
      {loading ? (
        <div className="text-center py-12 text-xs font-bold animate-pulse">Loading finance data...</div>
      ) : activeTab === 'accounts' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider">Payment Channels & Bank Accounts</h3>
            <button
              onClick={() => setIsAddAccountOpen(true)}
              className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
            >
              + Add New Account
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className={`p-8 rounded-3xl border-2 border-dashed text-center flex flex-col items-center justify-center ${
              isLight ? 'bg-[#f4e4b9]/50 border-[#c8a74e]' : 'bg-[#09251a]/40 border-[#1a5a40]'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                isLight ? 'bg-[#ebd89f] text-[#072618]' : 'bg-[#061a11] text-amber-400 border border-[#144833]'
              }`}>
                <Wallet className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black mb-1">No accounts added yet</h4>
              <p className={`text-xs max-w-md mb-4 ${isLight ? 'text-[#0f442e]' : 'text-amber-400/80'}`}>
                Click "+ Add New Account" to set up your primary cash drawer or bank account.
              </p>
              <button
                onClick={() => setIsAddAccountOpen(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 ${
                  isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950'
                }`}
              >
                <Plus className="w-4 h-4" />
                Add New Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc._id || acc.id}
                  className={`p-5 rounded-3xl border shadow-xs ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-black/10">
                      {acc.accountType}
                    </span>
                    {acc.isDefault && (
                      <span className="text-[9px] font-black text-amber-500">DEFAULT</span>
                    )}
                  </div>
                  <h4 className="font-black text-sm">{acc.name}</h4>
                  {acc.bankName && <p className="text-xs opacity-70 mt-0.5">{acc.bankName}</p>}

                  <div className="mt-4 pt-3 border-t border-current/15 flex justify-between items-baseline">
                    <span className="text-[10px] uppercase opacity-70 font-bold">Balance:</span>
                    <span className="text-lg font-black text-emerald-500">{formatINR(acc.currentBalance || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'expenses' ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider">Operational Expense Logs</h3>
          </div>

          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp._id || exp.id}
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                  isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">{exp.category}</span>
                    <span className="text-[10px] opacity-60 font-mono">{exp.expenseNumber}</span>
                  </div>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    {new Date(exp.date).toLocaleDateString()} • Paid to: {exp.paidTo || 'N/A'} • {exp.paymentMode}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-red-500">-{formatINR(exp.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Cheques View */
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider">Cheque Lifecycle Register</h3>
            <button
              onClick={() => setIsAddChequeOpen(true)}
              className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
            >
              + Log Cheque
            </button>
          </div>

          <div className="space-y-2">
            {cheques.map((chq) => (
              <div
                key={chq._id || chq.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      chq.type === 'Received' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {chq.type}
                    </span>
                    <span className="font-black">#{chq.chequeNumber}</span>
                    <span className="opacity-70">({chq.bankName})</span>
                  </div>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    Party: {chq.partyName} • Date: {new Date(chq.chequeDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-sm">{formatINR(chq.amount)}</span>
                  <div className="flex gap-1">
                    {chq.status === 'Pending' && (
                      <button
                        onClick={() => handleUpdateCheque(chq._id || chq.id, 'Deposited')}
                        className="px-2.5 py-1 rounded-lg border text-[11px] font-bold hover:bg-current/10 cursor-pointer"
                      >
                        Deposit
                      </button>
                    )}
                    {(chq.status === 'Pending' || chq.status === 'Deposited') && (
                      <button
                        onClick={() => handleUpdateCheque(chq._id || chq.id, 'Cleared')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px] cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black border opacity-80">
                      {chq.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <h3 className="font-black text-sm">Add Financial Account</h3>
              <button onClick={() => setIsAddAccountOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateAccount} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Account Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Current Account"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Account Type</label>
                <select
                  value={accountForm.accountType}
                  onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                >
                  <option value="Cash Drawer">Cash Drawer</option>
                  <option value="Bank Account">Bank Account</option>
                  <option value="UPI / QR">UPI / Wallet</option>
                  <option value="Petty Cash">Petty Cash</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Starting Balance (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={accountForm.currentBalance}
                  onChange={(e) => setAccountForm({ ...accountForm, currentBalance: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsAddAccountOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className={`px-5 py-2 rounded-xl font-black ${isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'}`}>
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <h3 className="font-black text-sm">Transfer Funds Between Accounts</h3>
              <button onClick={() => setIsTransferOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleTransfer} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">From Account</label>
                <select
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                  required
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                >
                  <option value="">-- Select Source --</option>
                  {accounts.map(a => (
                    <option key={a._id || a.id} value={a._id || a.id}>{a.name} ({formatINR(a.currentBalance)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">To Account</label>
                <select
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                  required
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                >
                  <option value="">-- Select Destination --</option>
                  {accounts.map(a => (
                    <option key={a._id || a.id} value={a._id || a.id}>{a.name} ({formatINR(a.currentBalance)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Transfer Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className={`w-full p-2 rounded-xl border font-black focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsTransferOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className={`px-5 py-2 rounded-xl font-black ${isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'}`}>
                  Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <h3 className="font-black text-sm">Log Operational Expense</h3>
              <button onClick={() => setIsAddExpenseOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateExpense} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                >
                  <option value="Rent">Rent</option>
                  <option value="Electricity & Utilities">Electricity & Utilities</option>
                  <option value="Salaries & Wages">Salaries & Wages</option>
                  <option value="Delivery & Logistics">Delivery & Logistics</option>
                  <option value="Packaging Material">Packaging Material</option>
                  <option value="Marketing & Ads">Marketing & Ads</option>
                  <option value="Store Maintenance">Store Maintenance</option>
                  <option value="Tea & Refreshments">Tea & Refreshments</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className={`w-full p-2 rounded-xl border font-black focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Deduct From Account</label>
                <select
                  value={expenseForm.paymentAccountId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentAccountId: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                >
                  <option value="">-- None (Record Only) --</option>
                  {accounts.map(a => (
                    <option key={a._id || a.id} value={a._id || a.id}>{a.name} ({formatINR(a.currentBalance)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Paid To / Recipient</label>
                <input
                  type="text"
                  placeholder="e.g. Landlord, Utility Board"
                  value={expenseForm.paidTo}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsAddExpenseOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className={`px-5 py-2 rounded-xl font-black ${isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-red-500 text-white'}`}>
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Cheque Modal */}
      {isAddChequeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-[#fbf4dc] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#1a5a40] text-[#fef3c7]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
            }`}>
              <h3 className="font-black text-sm">Log Cheque Details</h3>
              <button onClick={() => setIsAddChequeOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateCheque} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Type</label>
                <select
                  value={chequeForm.type}
                  onChange={(e) => setChequeForm({ ...chequeForm, type: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                >
                  <option value="Received">Received from Customer</option>
                  <option value="Issued">Issued to Vendor</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Party Name</label>
                <input
                  type="text"
                  required
                  value={chequeForm.partyName}
                  onChange={(e) => setChequeForm({ ...chequeForm, partyName: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Cheque Number</label>
                  <input
                    type="text"
                    required
                    value={chequeForm.chequeNumber}
                    onChange={(e) => setChequeForm({ ...chequeForm, chequeNumber: e.target.value })}
                    className={`w-full p-2 rounded-xl border focus:outline-none ${
                      isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={chequeForm.amount}
                    onChange={(e) => setChequeForm({ ...chequeForm, amount: e.target.value })}
                    className={`w-full p-2 rounded-xl border font-bold focus:outline-none ${
                      isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India"
                  value={chequeForm.bankName}
                  onChange={(e) => setChequeForm({ ...chequeForm, bankName: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Cheque Date</label>
                <input
                  type="date"
                  required
                  value={chequeForm.chequeDate}
                  onChange={(e) => setChequeForm({ ...chequeForm, chequeDate: e.target.value })}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-white'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsAddChequeOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className={`px-5 py-2 rounded-xl font-black ${isLight ? 'bg-[#072418] text-[#fef08a]' : 'bg-amber-400 text-[#051a10]'}`}>
                  Log Cheque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
