import React, { useState } from 'react';
import { Grid, ShieldCheck, User, LogOut, Settings, Bell, Search, Layers, Command, Activity, ChevronDown, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ activeApp, setActiveApp, onOpenLauncher }) => {
  const { user, logout, canAccessApp } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const activeLabel = {
    stock:     'Stock Management',
    po:        'Purchase Orders',
    sales:     'Sales Orders',
    users:     'User Access',
    roles:     'Roles & Permissions',
    security:  'Security & 2FA',
    settings:  'Admin Settings',
    dashboard: 'Dashboard',
  }[activeApp] ?? 'Dashboard';

  return (
    <header className="erp-navbar px-5 flex items-center justify-between select-none">
      {/* Left: Launcher + Brand */}
      <div className="flex items-center gap-3">
        {/* App Grid Launcher */}
        <button
          onClick={onOpenLauncher}
          title="Open App Launcher"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-gray-600 hover:text-emerald-700 transition-all duration-200 cursor-pointer group"
        >
          <Grid className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-sm">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-gray-900 text-sm tracking-tight hidden sm:block">
              Mekong<span className="text-emerald-600">Stock</span>
            </span>
          </div>

          <span className="text-gray-300 font-light text-lg hidden md:block">/</span>

          <span className="hidden md:flex items-center gap-1.5 text-gray-600 font-semibold text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
            {activeLabel}
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden lg:flex items-center relative w-72">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5" />
        <input
          type="text"
          placeholder="Search anything... (⌘K)"
          className="w-full bg-gray-50 border border-gray-200 text-gray-700 placeholder-gray-400 text-xs pl-9 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 focus:bg-white transition-all"
        />
        <div className="absolute right-3 flex items-center gap-0.5 text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
          <Command className="w-2.5 h-2.5" /> K
        </div>
      </div>

      {/* Right: Status + Actions */}
      <div className="flex items-center gap-2">
        {/* Live badge */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
          <Activity className="w-3 h-3 text-emerald-500" />
          <span>Live</span>
        </div>

        {/* Notifications */}
        <button className="relative btn-icon">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full border border-white animate-pulse" />
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 py-1.5 pl-1.5 pr-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-sm text-white shadow-sm group-hover:shadow-emerald-200 group-hover:shadow-md transition-shadow">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-bold text-gray-900 text-xs leading-tight">{user?.username || 'Administrator'}</div>
              <div className="text-gray-400 text-[10px] truncate max-w-[100px]">{user?.email || 'admin@company.com'}</div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {showUserDropdown && (
            <div
              className="absolute right-0 mt-2 w-68 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-slide-top overflow-hidden"
              style={{ width: '272px' }}
              onMouseLeave={() => setShowUserDropdown(false)}
            >
              {/* User info header */}
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white">
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{user?.username || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'admin@company.com'}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                      <ShieldCheck className="w-3 h-3" /> 2FA Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5 px-1.5">
                <button
                  onClick={() => { setActiveApp('security'); setShowUserDropdown(false); }}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  Security Settings (2FA)
                </button>

                <button
                  onClick={() => { setActiveApp('settings'); setShowUserDropdown(false); }}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <Settings className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  Admin Settings
                </button>

                <button
                  onClick={() => { setActiveApp('users'); setShowUserDropdown(false); }}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <User className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  Manage Users
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 pt-1.5 pb-1.5 px-1.5">
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
