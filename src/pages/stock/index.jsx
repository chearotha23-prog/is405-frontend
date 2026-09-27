// Stock Module Root — Tab router for Items / Stock-In / Stock-Out
import React, { useState } from 'react';
import { Package, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { StockItemsPage } from './items/StockItemsPage';
import { StockInPage }    from './stock-in/StockInPage';
import { StockOutPage }   from './stock-out/StockOutPage';

const TABS = [
  { id: 'items',    label: 'Stock Items',  icon: Package,          color: 'text-emerald-600' },
  { id: 'stock-in', label: 'Stock In',     icon: ArrowDownToLine,  color: 'text-blue-600'    },
  { id: 'stock-out',label: 'Stock Out',    icon: ArrowUpFromLine,  color: 'text-rose-600'    },
];

export const StockModule = () => {
  const [activeTab, setActiveTab] = useState('items');

  return (
    <div className="min-h-full flex flex-col">
      {/* Module Tab Bar */}
      <div className="bg-white border-b border-slate-200 px-6 pt-3">
        <div className="flex items-center gap-1 max-w-7xl mx-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? `border-[#714B67] text-[#714B67] bg-purple-50/60`
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#714B67]' : tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="flex-1">
        {activeTab === 'items'     && <StockItemsPage />}
        {activeTab === 'stock-in'  && <StockInPage    />}
        {activeTab === 'stock-out' && <StockOutPage   />}
      </div>
    </div>
  );
};
