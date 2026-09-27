import React from 'react';
import { Package, ShoppingBag, Tag, Users, ShieldCheck, Layers, ArrowUpRight, CheckCircle, Activity, TrendingUp, Clock, BarChart3, Zap } from 'lucide-react';

export const DashboardPage = ({ setActiveApp, onOpenLauncher }) => {
  const metrics = [
    {
      label: 'Stock Items',
      value: '169',
      unit: 'Items',
      color: 'emerald',
      icon: Package,
      status: 'Stock OK',
      statusIcon: CheckCircle,
      statusColor: 'text-emerald-600',
      action: 'stock',
      actionLabel: 'View Stock',
    },
    {
      label: 'Purchase Orders',
      value: '$41,920',
      unit: null,
      color: 'indigo',
      icon: ShoppingBag,
      status: '3 Pending',
      statusIcon: Clock,
      statusColor: 'text-indigo-600',
      action: 'po',
      actionLabel: 'View PO',
    },
    {
      label: 'Sales Orders',
      value: '$23,587',
      unit: null,
      color: 'blue',
      icon: Tag,
      status: 'Quotations Active',
      statusIcon: TrendingUp,
      statusColor: 'text-blue-600',
      action: 'sales',
      actionLabel: 'View Sales',
    },
    {
      label: '2FA Compliance',
      value: '100%',
      unit: null,
      color: 'teal',
      icon: ShieldCheck,
      status: 'All Secured',
      statusIcon: ShieldCheck,
      statusColor: 'text-teal-600',
      action: 'security',
      actionLabel: 'Security',
    },
  ];

  const modules = [
    {
      id: 'stock', icon: Package, iconClass: 'icon-wrap-emerald', badge: 'Stock Module', badgeClass: 'badge-emerald',
      color: 'emerald',
      title: 'Stock Management',
      desc: 'Manage inventory list, warehouse stocks, update quantities, and monitor low-stock items.',
      btnClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200',
      hoverBorder: 'hover:border-emerald-300',
    },
    {
      id: 'po', icon: ShoppingBag, iconClass: 'icon-wrap-purple', badge: 'Purchase Module', badgeClass: 'badge-purple',
      color: 'purple',
      title: 'Purchase Orders — PO',
      desc: 'Manage vendor purchase orders, create POs, track delivery schedules, and receive incoming goods.',
      btnClass: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200',
      hoverBorder: 'hover:border-purple-300',
    },
    {
      id: 'sales', icon: Tag, iconClass: 'icon-wrap-blue', badge: 'Sales Module', badgeClass: 'badge-blue',
      color: 'blue',
      title: 'Sales Orders',
      desc: 'Manage customer sales, generate price quotations, and track order deliveries.',
      btnClass: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200',
      hoverBorder: 'hover:border-blue-300',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-grid-pattern min-h-full pb-16">

      {/* Hero Banner */}
      <div className="hero-banner p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 text-emerald-100 text-xs px-3.5 py-1.5 rounded-full border border-white/20 mb-3 font-semibold">
              <Zap className="w-3.5 h-3.5 text-emerald-300" />
              Mekong Stock Microservices ERP
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Welcome to<br />
              <span className="text-emerald-300">Mekong Stock System</span>
            </h1>
            <p className="text-emerald-100 text-sm mt-3 leading-relaxed opacity-90 max-w-lg">
              Enterprise Business Management with Decoupled Architecture: Stock · Purchase Orders · Sales · 2FA Security
            </p>
          </div>
          <button onClick={onOpenLauncher}
            className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-5 py-3 rounded-2xl text-sm flex items-center gap-2.5 shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0 border border-emerald-100">
            <Layers className="w-4 h-4" />
            <span>Open App Launcher</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          const StatusIcon = m.statusIcon;
          return (
            <div
              key={m.action}
              onClick={() => setActiveApp(m.action)}
              className={`metric-card ${m.color} p-6 cursor-pointer erp-card-interactive animate-fade-in-up stagger-${i + 1}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{m.label}</p>
                  <h3 className="text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">{m.value}</h3>
                  {m.unit && <p className="text-xs text-gray-500 mt-0.5">{m.unit} Total</p>}
                </div>
                <div className={`icon-wrap icon-wrap-md icon-wrap-${m.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs border-t border-gray-100 pt-3">
                <span className={`${m.statusColor} font-semibold flex items-center gap-1.5`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {m.status}
                </span>
                <span className="text-emerald-700 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  {m.actionLabel} →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          <span>Microservices Modules</span>
          <span className="badge badge-emerald ml-1">3 Active</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.id} className={`erp-card p-6 flex flex-col justify-between ${mod.hoverBorder} group`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`icon-wrap icon-wrap-lg ${mod.iconClass} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`badge ${mod.badgeClass}`}>{mod.badge}</span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{mod.desc}</p>
                </div>
                <button onClick={() => setActiveApp(mod.id)}
                  className={`mt-5 w-full py-2.5 ${mod.btnClass} font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer`}>
                  <span>Open {mod.title}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
