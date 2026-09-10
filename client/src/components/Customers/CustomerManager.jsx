import React, { useState } from 'react';
import { Users, UserPlus, Search, Award, DollarSign, X } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { customerAPI } from '../../services/api';
import { formatINR } from '../../utils/formatters';

const CustomerManager = () => {
  const { customers, fetchCustomers, showToast, theme } = usePOS();
  const isLight = theme === 'light';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmitNewCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast('Name and phone number are required', 'warning');
      return;
    }

    try {
      const res = await customerAPI.create(formData);
      if (res.data?.success) {
        showToast('New customer registered successfully!', 'success');
        setIsAddModalOpen(false);
        setFormData({ name: '', phone: '', email: '' });
        fetchCustomers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add customer', 'error');
    }
  };

  const tierColors = isLight ? {
    Bronze: 'bg-[#f4e4b9] border-[#c8a74e] text-[#072618]',
    Silver: 'bg-[#ebd89f] border-[#baa04e] text-[#051f14]',
    Gold: 'bg-[#fef08a] border-[#eab308] text-[#854d0e]',
    Platinum: 'bg-[#072418] border-[#072418] text-[#fef08a]'
  } : {
    Bronze: 'bg-amber-950/80 border-amber-600/40 text-amber-400',
    Silver: 'bg-slate-800 border-slate-600 text-slate-200',
    Gold: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300',
    Platinum: 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
  };

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <Users className={`w-6 h-6 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
            Customer Directory & Loyalty Program
          </h2>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
            Track customer spend, reward tier statuses, and loyalty points balances.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] shadow-amber-500/30'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
          isLight ? 'text-[#0f442e]' : 'text-[#fbbf24]/70'
        }`} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, phone, or email..."
          className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none ${
            isLight
              ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/60 shadow-sm focus:border-[#072618]'
              : 'bg-[#061a11] border-[#144833] text-[#fde047] placeholder-[#fbbf24]/50 focus:border-amber-400'
          }`}
        />
      </div>

      {/* Table */}
      <div className={`border rounded-3xl overflow-hidden shadow-xl transition-colors duration-300 ${
        isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-bold border-b uppercase tracking-wider text-[10px] ${
              isLight ? 'bg-[#f8eed1] text-[#051f14] border-[#d6b866]' : 'bg-[#061a11] text-[#fde047] border-[#144833]'
            }`}>
              <tr>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Loyalty Tier</th>
                <th className="py-3.5 px-4">Points Balance</th>
                <th className="py-3.5 px-4">Total Orders</th>
                <th className="py-3.5 px-4">Lifetime Spend</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-[#d6b866]/40' : 'divide-[#144833]'}`}>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`text-center py-16 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`}>
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-xs">No customers registered yet</p>
                    <p className="text-[11px] mt-0.5 opacity-70">Click "Register New Customer" to enroll members and track loyalty rewards.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const cid = cust._id || cust.id;
                  return (
                    <tr key={cid} className={`transition-colors ${isLight ? 'hover:bg-[#f4e4b9]/40' : 'hover:bg-[#0c2f21]/60'}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${
                            isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]' : 'bg-[#061a11] text-amber-400 border-[#144833]'
                          }`}>
                            {cust.name.charAt(0)}
                          </div>
                          <span className={`font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>{cust.name}</span>
                        </div>
                      </td>
                      <td className={`py-3.5 px-4 font-mono ${isLight ? 'text-[#051f14]' : 'text-[#fde047]'}`}>{cust.phone}</td>
                      <td className={`py-3.5 px-4 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>{cust.email || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tierColors[cust.tier] || tierColors.Bronze}`}>
                          {cust.tier || 'Bronze'} Tier
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-amber-500">
                        {cust.loyaltyPoints || 0} Pts ({formatINR(cust.loyaltyPoints || 0)})
                      </td>
                      <td className={`py-3.5 px-4 font-semibold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>{cust.totalOrders || 0} orders</td>
                      <td className={`py-3.5 px-4 font-black ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
                        {formatINR(cust.totalSpent || 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
          isLight ? 'bg-[#051f14]/40' : 'bg-[#05170f]/85'
        }`}>
          <div className={`border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl ${
            isLight ? 'bg-[#fffaf0] border-[#d6b866] text-[#051f14]' : 'bg-[#09251a] border-[#144833] text-[#fef3c7]'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
                <UserPlus className={`w-4 h-4 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
                Register New Customer
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  isLight ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14]' : 'bg-[#061a11] hover:bg-[#0c2f21] text-[#fef08a]'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                    isLight
                      ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/60 focus:border-[#072618]'
                      : 'bg-[#061a11] border-[#144833] text-[#fde047] placeholder-[#fbbf24]/50 focus:border-amber-400'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                    isLight
                      ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/60 focus:border-[#072618]'
                      : 'bg-[#061a11] border-[#144833] text-[#fde047] placeholder-[#fbbf24]/50 focus:border-amber-400'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>Email Address (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@example.com"
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                    isLight
                      ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/60 focus:border-[#072618]'
                      : 'bg-[#061a11] border-[#144833] text-[#fde047] placeholder-[#fbbf24]/50 focus:border-amber-400'
                  }`}
                />
              </div>

              <div className={`pt-4 border-t flex justify-end gap-3 ${isLight ? 'border-[#d6b866]' : 'border-[#144833]'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                    isLight ? 'bg-[#f4e4b9] text-[#051f14] hover:bg-[#ebd89f] border border-[#c8a74e]' : 'bg-[#061a11] text-[#fef08a] hover:bg-[#0c2f21] border border-[#144833]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-xl font-black shadow-lg cursor-pointer ${
                    isLight
                      ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
                      : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] shadow-amber-500/30'
                  }`}
                >
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
