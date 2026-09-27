import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownToLine, Plus, Search, RefreshCcw, Package,
  Calendar, Building2, FileText, Layers, ChevronRight, Filter
} from 'lucide-react';
import { stockInService } from '../../../services/stock/stockInService';
import { stockItemService } from '../../../services/stock/stockItemService';
import { ControlPanel } from '../../../components/common/ControlPanel';

export const StockInPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await stockInService.getStockInRecords({ search: searchQuery });
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [searchQuery]);

  const metrics = useMemo(() => {
    const totalReceived = records.reduce((s, r) => s + (r.quantityReceived || 0), 0);
    const totalValue = records.reduce((s, r) => s + (r.totalCost || 0), 0);
    return { totalRecords: records.length, totalReceived, totalValue };
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const s = searchQuery.toLowerCase();
    return records.filter(r =>
      r.referenceNo?.toLowerCase().includes(s) ||
      r.itemName?.toLowerCase().includes(s) ||
      r.supplier?.toLowerCase().includes(s)
    );
  }, [records, searchQuery]);

  return (
    <div className="min-h-full pb-16">
      <ControlPanel
        title="Stock In — Goods Receiving"
        subtitle="Record inbound stock receipts, supplier deliveries, and inventory top-ups"
        onRefresh={fetchRecords}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        createLabel="New Receipt"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="erp-card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Receipts</p>
              <h4 className="text-2xl font-bold font-mono text-slate-900 mt-1">{metrics.totalRecords}</h4>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">GRN Records</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="erp-card p-4 flex items-center justify-between border-l-4 border-l-blue-500">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Units Received</p>
              <h4 className="text-2xl font-bold font-mono text-blue-600 mt-1">{metrics.totalReceived.toLocaleString()}</h4>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">Total Units In</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownToLine className="w-6 h-6" />
            </div>
          </div>
          <div className="erp-card p-4 flex items-center justify-between border-l-4 border-l-[#714B67]">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</p>
              <h4 className="text-2xl font-bold font-mono text-[#714B67] mt-1">${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
              <p className="text-[11px] text-purple-600 font-medium mt-0.5">Cost of Received Goods</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#714B67] flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-600">Loading stock receipts...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl inline-block mb-3">
              <ArrowDownToLine className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Records Found</h3>
            <p className="text-xs text-slate-500 mt-1">No stock-in receipts match your search.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Qty Received</th>
                    <th className="py-3.5 px-4">Unit Cost</th>
                    <th className="py-3.5 px-4">Total Cost</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">PO Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors group">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-emerald-700 text-xs">{r.referenceNo}</span>
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
                          {r.supplier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-emerald-700 text-sm">+{r.quantityReceived}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">${r.unitCost?.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">${r.totalCost?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {r.receivedDate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {r.poReference ? (
                          <span className="font-mono text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg">{r.poReference}</span>
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
