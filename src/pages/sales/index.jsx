// Sales Module Root — sub-module router
import React, { useState } from 'react';
import { Tag, RotateCcw } from 'lucide-react';
import { SalesOrdersPage } from './orders/SalesOrdersPage';

const TABS = [
  { id: 'orders',  label: 'Sales Orders',  icon: Tag       },
  { id: 'returns', label: 'Sales Returns', icon: RotateCcw },
];

export const SalesModule = () => {
  const [activeTab, setActiveTab] = useState('orders');

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
                    ? 'border-[#714B67] text-[#714B67] bg-purple-50/60'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="flex-1">
        {activeTab === 'orders' && <SalesOrdersPage />}
        {activeTab === 'returns' && (
          <div className="p-12 text-center text-slate-400">
            <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-slate-600">Sales Returns</p>
            <p className="text-xs mt-1">Coming soon — customer returns & credit notes</p>
          </div>
        )}
      </div>
    </div>
  );
};
