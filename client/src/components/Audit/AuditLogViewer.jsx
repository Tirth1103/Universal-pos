import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Search, RefreshCw, KeyRound, UserCheck, Activity } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { auditAPI } from '../../services/api';

const AuditLogViewer = () => {
  const { showToast, theme } = usePOS();
  const isLight = theme === 'light';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('All');
  const [collectionFilter, setCollectionFilter] = useState('All');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter !== 'All') params.action = actionFilter;
      if (collectionFilter !== 'All') params.collectionName = collectionFilter;

      const res = await auditAPI.getLogs(params);
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, collectionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionColors = {
    CREATE: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    UPDATE: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    DELETE: 'bg-red-500/20 text-red-500 border-red-500/30',
    CONVERT: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    OVERRIDE: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    LOGIN: 'bg-teal-500/20 text-teal-500 border-teal-500/30'
  };

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black flex items-center gap-2.5 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <Shield className="w-7 h-7 text-amber-500" />
            Security & Immutable Audit Trail
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-amber-400/80'}`}>
            Enterprise activity logs tracking user actions, document conversions, stock overrides, and logins
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border shadow-xs cursor-pointer ${
            isLight ? 'bg-[#ebd89f] border-[#baa04e]' : 'bg-[#09251a] border-[#1a5a40] text-amber-300'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Logs
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
            isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-amber-300'
          }`}
        >
          <option value="All">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="CONVERT">CONVERT</option>
          <option value="OVERRIDE">OVERRIDE</option>
          <option value="LOGIN">LOGIN</option>
        </select>

        <select
          value={collectionFilter}
          onChange={(e) => setCollectionFilter(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
            isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40] text-amber-300'
          }`}
        >
          <option value="All">All Entities</option>
          <option value="Order">Order / Invoices</option>
          <option value="Product">Products / Stock</option>
          <option value="SalesDocument">Sales Documents</option>
          <option value="PurchaseBill">Purchase Bills</option>
          <option value="Customer">Customers</option>
          <option value="Vendor">Vendors</option>
        </select>
      </div>

      {/* Audit Logs Timeline Table */}
      {loading ? (
        <div className="text-center py-12 text-xs font-bold animate-pulse">Scanning security trail...</div>
      ) : logs.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center ${
          isLight ? 'bg-[#f4e4b9]/60 border-[#c8a74e]' : 'bg-[#09251a]/40 border-[#1a5a40]'
        }`}>
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <h3 className="font-bold text-sm">No Audit Logs In Range</h3>
          <p className="text-xs opacity-60 mt-1">Audit events will automatically appear here as operations are performed.</p>
        </div>
      ) : (
        <div className={`p-5 rounded-3xl border shadow-sm ${
          isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-current/15 opacity-70 text-[10px] uppercase font-bold">
                  <th className="py-2.5">Timestamp</th>
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Action</th>
                  <th className="py-2.5">Entity / Target</th>
                  <th className="py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/10">
                {logs.map((l, idx) => (
                  <tr key={idx} className="hover:bg-current/5">
                    <td className="py-2.5 opacity-70 font-mono text-[11px] whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5">
                      <span className="font-bold block">{l.userName}</span>
                      <span className="text-[10px] opacity-60">{l.userRole}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        actionColors[l.action] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold">
                      {l.collectionName}
                      {l.documentId && <span className="opacity-60 text-[10px] font-mono block">ID: {l.documentId}</span>}
                    </td>
                    <td className="py-2.5 opacity-80 max-w-xs truncate text-[11px]">
                      {l.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
