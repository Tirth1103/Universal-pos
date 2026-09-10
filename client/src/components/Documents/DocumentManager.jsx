import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Search, ArrowRight, Download, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { documentAPI } from '../../services/api';
import { formatINR } from '../../utils/formatters';
import CreateDocumentModal from './CreateDocumentModal';

const DocumentManager = () => {
  const { showToast, theme } = usePOS();
  const isLight = theme === 'light';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedType !== 'All') params.type = selectedType;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search) params.search = search;

      const res = await documentAPI.getAll(params);
      if (res.data?.success) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedType, statusFilter, search]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // 1-Click Convert to Invoice handler
  const handleConvertToInvoice = async (doc) => {
    if (doc.status === 'Converted') {
      showToast('This document is already converted to a Tax Invoice', 'info');
      return;
    }

    try {
      const res = await documentAPI.convertToInvoice(doc._id || doc.id, {
        paymentMethod: 'Cash',
        amountPaid: doc.grandTotal
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Converted to Tax Invoice!', 'success');
        fetchDocuments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Conversion failed', 'error');
    }
  };

  // WhatsApp dispatch handler
  const handleWhatsAppDispatch = async (doc) => {
    try {
      const res = await documentAPI.dispatch(doc._id || doc.id, {
        channel: 'WhatsApp',
        recipient: doc.customer?.phone
      });
      if (res.data?.success) {
        showToast(`Document sent via WhatsApp!`, 'success');
        if (res.data.data?.waLink) {
          window.open(res.data.data.waLink, '_blank');
        }
        fetchDocuments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Dispatch failed', 'error');
    }
  };

  const handleDownloadPdf = (docId) => {
    window.open(documentAPI.getPdfUrl(docId), '_blank');
  };

  const tabs = [
    { id: 'All', label: 'All Documents' },
    { id: 'Estimate', label: 'Estimates' },
    { id: 'ProformaInvoice', label: 'Proforma Invoices' },
    { id: 'SalesOrder', label: 'Sales Orders' },
    { id: 'DeliveryChallan', label: 'Delivery Challans' },
    { id: 'CreditNote', label: 'Credit Notes' }
  ];

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black flex items-center gap-2.5 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <FileText className={`w-7 h-7 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
            Invoicing & Sales Documents
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-amber-400/80'}`}>
            Manage Estimates, Quotations, Sales Orders, Challans, and 1-Click Tax Invoice conversions
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-transform active:scale-98 cursor-pointer ${
            isLight
              ? 'bg-[#072418] text-[#fef08a] hover:bg-[#0c3725]'
              : 'bg-amber-400 text-[#051a10] hover:bg-amber-300'
          }`}
        >
          <Plus className="w-4 h-4" />
          Create New Document
        </button>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
              selectedType === tab.id
                ? isLight
                  ? 'bg-[#072418] text-[#fef08a] border-[#072418] shadow-sm'
                  : 'bg-amber-400 text-[#051a10] border-amber-400 font-black shadow-md'
                : isLight
                ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14] hover:border-[#072418]'
                : 'bg-[#09251a] border-[#1a5a40] text-amber-300/80 hover:border-amber-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Status Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
            isLight ? 'text-[#0f442e]' : 'text-amber-400/60'
          }`} />
          <input
            type="text"
            placeholder="Search document #, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none ${
              isLight ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14]' : 'bg-[#09251a] border-[#1a5a40] text-white'
            }`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-2.5 rounded-2xl border text-xs font-bold focus:outline-none cursor-pointer ${
            isLight ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#051f14]' : 'bg-[#09251a] border-[#1a5a40] text-amber-300'
          }`}
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Converted">Converted</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-12 text-xs font-bold animate-pulse">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center ${
          isLight ? 'bg-[#f4e4b9]/60 border-[#c8a74e]' : 'bg-[#09251a]/40 border-[#1a5a40]'
        }`}>
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 className="font-bold text-sm">No sales documents found</h3>
          <p className="text-xs opacity-70 mt-1">Create an Estimate, Proforma Invoice, or Sales Order to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => {
            const isConverted = doc.status === 'Converted';
            const canConvert = !isConverted && ['Estimate', 'ProformaInvoice', 'SalesOrder'].includes(doc.documentType);

            return (
              <div
                key={doc._id || doc.id}
                className={`p-5 rounded-3xl border shadow-sm transition-all hover:shadow-md ${
                  isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#09251a] border-[#1a5a40]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                      doc.documentType === 'CreditNote'
                        ? 'bg-red-500/15 text-red-500 border-red-500/30'
                        : isLight
                        ? 'bg-[#072418] text-[#fef08a] border-[#072418]'
                        : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                    }`}>
                      {doc.documentType}
                    </span>
                    <span className="font-black text-sm tracking-wide">{doc.docNumber}</span>
                    <span className="text-xs opacity-60">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isConverted ? (
                      <span className="flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Converted to Tax Invoice
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40">
                        <Clock className="w-3.5 h-3.5" />
                        {doc.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Document Details Middle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 border-y border-dashed border-current/15 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold opacity-70 block mb-0.5">Customer</span>
                    <p className="font-black">{doc.customer?.name || 'Walk-in Guest'}</p>
                    {doc.customer?.phone && <p className="opacity-80 text-[11px]">{doc.customer.phone}</p>}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold opacity-70 block mb-0.5">Items ({doc.items?.length || 0})</span>
                    <p className="truncate font-medium">
                      {doc.items?.map(i => `${i.quantity}x ${i.title}`).join(', ')}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase font-bold opacity-70 block mb-0.5">Grand Total</span>
                    <span className={`text-base font-black ${isLight ? 'text-[#051f14]' : 'text-amber-300'}`}>
                      {formatINR(doc.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex items-center gap-2">
                    {/* Download PDF */}
                    <button
                      onClick={() => handleDownloadPdf(doc._id || doc.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isLight ? 'border-[#c8a74e] hover:bg-[#ebd89f]' : 'border-[#1a5a40] hover:bg-[#0e3524] text-amber-300'
                      }`}
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>

                    {/* WhatsApp Share */}
                    <button
                      onClick={() => handleWhatsAppDispatch(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      title="Share via WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                  </div>

                  {/* 1-Click Convert Button */}
                  {canConvert && (
                    <button
                      onClick={() => handleConvertToInvoice(doc)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-98 cursor-pointer ${
                        isLight
                          ? 'bg-[#072418] text-[#fef08a] hover:bg-[#0c3725]'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      }`}
                    >
                      Convert to Tax Invoice
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for creating documents */}
      <CreateDocumentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchDocuments}
      />
    </div>
  );
};

export default DocumentManager;
