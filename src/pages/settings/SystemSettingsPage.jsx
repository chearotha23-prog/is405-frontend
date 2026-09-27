import React, { useState } from 'react';
import { 
  Settings, ShieldCheck, Server, FileText, Save, CheckCircle2, 
  RefreshCw, Key, Lock, Globe, Building, Database, Activity, 
  Radio, Check, AlertCircle, Clock, ShieldAlert, Cpu
} from 'lucide-react';
import { settingsService } from '../../services/settings/settingsService';

export const SystemSettingsPage = () => {
  const [settings, setSettings] = useState(settingsService.getSettings());
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security' | 'microservices' | 'logs'
  const [savedSuccess, setSavedSuccess] = useState(false);
  const auditLogs = settingsService.getAuditLogs();

  const handleSave = (e) => {
    e.preventDefault();
    settingsService.saveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const services = [
    { name: 'Identity & 2FA Service', port: 5001, status: 'Online', latency: '12ms', version: 'v1.4.0' },
    { name: 'Stock / Inventory Microservice', port: 5002, status: 'Online', latency: '18ms', version: 'v2.1.0' },
    { name: 'Purchase Orders Microservice', port: 5003, status: 'Online', latency: '15ms', version: 'v1.8.2' },
    { name: 'Sales Orders Microservice', port: 5004, status: 'Online', latency: '14ms', version: 'v2.0.1' },
    { name: 'API Gateway / Reverse Proxy', port: 5000, status: 'Online', latency: '6ms', version: 'v3.0.0' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#714B67] to-[#8A5C7E] text-white flex items-center justify-center shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Configuration & Administration</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage system configurations, 2FA security policies, and microservices status
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 transition-all shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>System settings saved successfully!</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1.5">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'general' ? 'bg-[#714B67] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>General</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'security' ? 'bg-[#714B67] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security</span>
        </button>
        <button
          onClick={() => setActiveTab('microservices')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'microservices' ? 'bg-[#714B67] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Microservices</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'logs' ? 'bg-[#714B67] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#714B67]" />
              <span>Company Profile & System Information</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">This information will be displayed on reports, quotations, and invoices.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company Legal Name
              </label>
              <input
                type="text"
                value={settings.companyName || 'Mekong Stock Enterprise Co., Ltd'}
                onChange={(e) => updateSetting('companyName', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/30 focus:border-[#714B67]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                App Title
              </label>
              <input
                type="text"
                value={settings.appName || 'Mekong Stock ERP'}
                onChange={(e) => updateSetting('appName', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/30 focus:border-[#714B67]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Currency
              </label>
              <select
                value={settings.currency || 'USD'}
                onChange={(e) => updateSetting('currency', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/30 focus:border-[#714B67]"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="KHR">KHR - Cambodian Riel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Timezone
              </label>
              <select
                value={settings.timezone || 'Asia/Phnom_Penh'}
                onChange={(e) => updateSetting('timezone', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/30 focus:border-[#714B67]"
              >
                <option value="Asia/Phnom_Penh">Asia/Phnom_Penh (GMT+07:00)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security Policies */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>2FA & Authentication Security Policies</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure security rules and enforcement for all system accounts.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">Enforce 2FA for All Users</span>
                <span className="text-[11px] text-slate-500">Require all users to configure and verify 2FA TOTP before accessing the system</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enforceTwoFactor !== false}
                onChange={(e) => updateSetting('enforceTwoFactor', e.target.checked)}
                className="w-5 h-5 accent-[#714B67] rounded cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">Strong Password Policy</span>
                <span className="text-[11px] text-slate-500">Require uppercase, lowercase, numbers, and special symbols (minimum 8 characters)</span>
              </div>
              <input
                type="checkbox"
                checked={settings.requireStrongPassword !== false}
                onChange={(e) => updateSetting('requireStrongPassword', e.target.checked)}
                className="w-5 h-5 accent-[#714B67] rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Session Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeoutMinutes || 60}
                  onChange={(e) => updateSetting('sessionTimeoutMinutes', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#714B67]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Max Failed 2FA Attempts
                </label>
                <input
                  type="number"
                  value={settings.maxFailedAttempts || 5}
                  onChange={(e) => updateSetting('maxFailedAttempts', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#714B67]/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Microservices Health & Status */}
      {activeTab === 'microservices' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-600" />
                <span>Microservices Architecture Health Matrix</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Monitor backend service cluster health and latency</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational</span>
            </span>
          </div>

          <div className="space-y-3">
            {services.map((srv, idx) => (
              <div 
                key={idx} 
                className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:bg-purple-50/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#714B67] shadow-2xs font-bold text-xs">
                    :{srv.port}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{srv.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Port {srv.port} • {srv.version}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {srv.latency}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{srv.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>Security & Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Log of authentication events, 2FA verifications, and system modifications</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Event / Action</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.slice(0, 8).map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{log.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{log.username}</td>
                    <td className="py-3 px-4 text-slate-700">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        SUCCESS
                      </span>
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
