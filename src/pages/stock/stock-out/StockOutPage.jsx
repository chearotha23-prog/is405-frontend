import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpFromLine, Package, Building2, Calendar,
  FileText, Layers, DollarSign, AlertTriangle
} from 'lucide-react';
import { stockOutService } from '../../../services/stock/stockOutService';
import { ControlPanel } from '../../../components/common/ControlPanel';

export const StockOutPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await stockOutService.getStockOutRecords({ search: searchQuery });
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [searchQuery]);

  const metrics = useMemo(() => {
    const totalDispatched = records.reduce((s, r) => s + (r.quantityDispatched || 0), 0);
    const totalValue = records.reduce((s, r) => s + (r.totalValue || 0), 0);
    return { totalRecords: records.length, totalDispatched, totalValue };
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const s = searchQuery.toLowerCase();
    return records.filter(r =>
      r.referenceNo?.toLowerCase().includes(s) ||
      r.itemName?.toLowerCase().includes(s) ||
      r.customer?.toLowerCase().includes(s)
    );
  }, [records, searchQuery]);

  return (
    <div className="min-h-full pb-16">
      <ControlPanel
        title="Stock Out — Dispatch Records"
        subtitle="Track outbound stock dispatches, customer deliveries, and inventory deductions"
        onRefresh={fetchRecords}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        createLabel="New Dispatch"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="erp-card p-4 flex items-center justify-between border-l-4 border-l-rose-500">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dispatches</p>
              <h4 className="text-2xl font-bold font-mono text-slate-900 mt-1">{metrics.totalRecords}</h4>
              <p className="text-[11px] text-rose-600 font-medium mt-0.5">Issue Records</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="erp-card p-4 flex items-center justify-between border-l-4 border-l-orange-500">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Units Dispatched</p>
              <h4 className="text-2xl font-bold font-mono text-orange-600 mt-1">{metrics.totalDispatched.toLocaleString()}</h4>
              <p className="text-[11px] text-orange-600 font-medium mt-0.5">Total Units Out</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ArrowUpFromLine className="w-6 h-6" />
            </div>
          </div>
          <div className="erp-card p-4 flex items-center justify-between border-l-4 border-l-blue-500">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue Value</p>
              <h4 className="text-2xl font-bold font-mono text-blue-600 mt-1">${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">Sales Price Value</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-600">Loading dispatch records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl inline-block mb-3">
              <ArrowUpFromLine className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Dispatch Records</h3>
            <p className="text-xs text-slate-500 mt-1">No stock-out dispatches match your search.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Qty Dispatched</th>
                    <th className="py-3.5 px-4">Unit Price</th>
                    <th className="py-3.5 px-4">Total Value</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">SO Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-rose-700 text-xs">{r.referenceNo}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-slate-900 block">{r.itemName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{r.sku}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {r.customer}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-rose-600 text-sm">-{r.quantityDispatched}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">${r.unitPrice?.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">${r.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {r.dispatchDate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {r.soReference ? (
                          <span className="font-mono text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">{r.soReference}</span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
