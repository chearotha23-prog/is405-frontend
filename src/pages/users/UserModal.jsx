import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, UserPlus, Shield, Mail, Lock, User, ShieldAlert, CheckCircle2, 
  Edit2, KeyRound, CheckSquare, Square, ChevronDown, ChevronUp, Package, 
  ShoppingBag, Tag, Users, ShieldCheck, Sparkles, AlertCircle
} from 'lucide-react';
import { permissionService } from '../../services/settings/permissionService';

export const UserModal = ({ isOpen, onClose, onSave, initialUser = null, mode = 'create' }) => {
  if (!isOpen) return null;

  const [username, setUsername] = useState(initialUser?.username || '');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [password, setPassword] = useState('');
  const [roleIds, setRoleIds] = useState(initialUser?.roleIds || [2]); // Default StockManager
  const [directPermissionIds, setDirectPermissionIds] = useState(initialUser?.directPermissionIds || []);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [activeTab, setActiveTab] = useState('BASIC'); // 'BASIC' | 'PERMISSIONS'
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available system permissions
  useEffect(() => {
    let isMounted = true;
    async function loadPermissions() {
      setLoadingPerms(true);
      try {
        const perms = await permissionService.getAllPermissions();
        if (isMounted) setAllPermissions(perms);
      } catch (err) {
        console.error('Failed to load permissions in modal', err);
      } finally {
        if (isMounted) setLoadingPerms(false);
      }
    }
    loadPermissions();
    return () => { isMounted = false; };
  }, []);

  // Initialize or reset state when modal opens or initialUser changes
  useEffect(() => {
    setError('');
    if (initialUser && mode === 'edit') {
      setUsername(initialUser.username || '');
      setEmail(initialUser.email || '');
      setPassword('');
      setRoleIds(initialUser.roleIds?.length > 0 ? initialUser.roleIds : [2]);
      setDirectPermissionIds(initialUser.directPermissionIds || []);
    } else {
      setUsername('');
      setEmail('');
      setPassword('');
      setRoleIds([2]);
      setDirectPermissionIds([]);
    }
  }, [initialUser, mode, isOpen]);

  // Group permissions by category/module
  const groupedPermissions = useMemo(() => {
    const groups = {
      'Stock & Inventory': { icon: Package, color: 'emerald', perms: [] },
      'Purchasing': { icon: ShoppingBag, color: 'purple', perms: [] },
      'Sales & Billing': { icon: Tag, color: 'blue', perms: [] },
      'Users & Access': { icon: Users, color: 'teal', perms: [] },
      'Reports & System': { icon: ShieldCheck, color: 'slate', perms: [] }
    };

    allPermissions.forEach((p) => {
      const code = (p.code || '').toLowerCase();
      if (code.startsWith('stock') || code.startsWith('transfer') || code.startsWith('warehouse')) {
        groups['Stock & Inventory'].perms.push(p);
      } else if (code.startsWith('purchase') || code.startsWith('goods') || code.startsWith('supplier')) {
        groups['Purchasing'].perms.push(p);
      } else if (code.startsWith('sales') || code.startsWith('customer')) {
        groups['Sales & Billing'].perms.push(p);
      } else if (code.startsWith('users') || code.startsWith('roles') || code.startsWith('permissions')) {
        groups['Users & Access'].perms.push(p);
      } else {
        groups['Reports & System'].perms.push(p);
      }
    });

    return groups;
  }, [allPermissions]);

  const togglePermission = (permId) => {
    setDirectPermissionIds(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const handleSelectCategory = (categoryPerms, selectAll) => {
    const permIds = categoryPerms.map(p => p.id);
    if (selectAll) {
      setDirectPermissionIds(prev => Array.from(new Set([...prev, ...permIds])));
    } else {
      setDirectPermissionIds(prev => prev.filter(id => !permIds.includes(id)));
    }
  };

  const handleSelectAll = () => {
    setDirectPermissionIds(allPermissions.map(p => p.id));
  };

  const handleClearAll = () => {
    setDirectPermissionIds([]);
  };

  const applyRolePreset = (roleId) => {
    setRoleIds([roleId]);
    if (roleId === 1) {
      // Administrator: select all
      setDirectPermissionIds(allPermissions.map(p => p.id));
    } else if (roleId === 2) {
      // StockManager: select stock and transfers
      const stockPermIds = allPermissions
        .filter(p => (p.code || '').toLowerCase().startsWith('stock') || (p.code || '').toLowerCase().startsWith('transfer') || (p.code || '').toLowerCase().startsWith('warehouse'))
        .map(p => p.id);
      setDirectPermissionIds(stockPermIds);
    } else {
      // Viewer: only view
      const viewPermIds = allPermissions
        .filter(p => (p.code || '').toLowerCase().endsWith('.view'))
        .map(p => p.id);
      setDirectPermissionIds(viewPermIds);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = { 
        username, 
        email, 
        roleIds,
        directPermissionIds
      };
      if (password) {
        payload.password = password;
      }
      await onSave(payload, initialUser?.id);
      window.dispatchEvent(new Event('users_updated'));
      window.dispatchEvent(new Event('permissions_updated'));
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Error saving user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="erp-modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="erp-modal w-full max-w-2xl max-h-[92vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
              {mode === 'edit' ? <Edit2 className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {mode === 'edit' ? `Edit User (${initialUser?.username})` : 'Create User & Permissions'}
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                {mode === 'edit' ? 'Update account credentials, system roles, and direct permissions' : 'Assign roles and grant direct permissions'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center hover:bg-white/15 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('BASIC')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BASIC'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>General & Roles</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PERMISSIONS')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PERMISSIONS'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Direct Permissions</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              directPermissionIds.length > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-gray-200 text-gray-600'
            }`}>
              {directPermissionIds.length}
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-semibold">{error}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setError('')} 
                className="text-rose-400 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'BASIC' ? (
            <div className="space-y-4">
              <div>
                <label className="form-label">
                  <User className="w-3.5 h-3.5 text-gray-400 inline mr-1" />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. stock_user or john_stock"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">
                  <Mail className="w-3.5 h-3.5 text-gray-400 inline mr-1" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@company.com"
                  className="form-input font-mono"
                />
              </div>

              <div>
                <label className="form-label">
                  <Lock className="w-3.5 h-3.5 text-gray-400 inline mr-1" />
                  <span>Password {mode === 'edit' ? '(leave blank to keep current)' : ''}</span>
                </label>
                <input
                  type="password"
                  required={mode === 'create'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input font-mono"
                />
              </div>

              <div>
                <label className="form-label">
                  <Shield className="w-3.5 h-3.5 text-gray-400 inline mr-1" />
                  <span>Primary System Role</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => applyRolePreset(1)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      roleIds.includes(1)
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-200'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-amber-800">Administrator</span>
                      {roleIds.includes(1) && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500">Full Administrative Access</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyRolePreset(2)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      roleIds.includes(2)
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-200'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-emerald-800">StockManager</span>
                      {roleIds.includes(2) && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500">Inventory & Transfers</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyRolePreset(3)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      roleIds.includes(3)
                        ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-200'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-blue-800">Viewer</span>
                      {roleIds.includes(3) && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500">Read Only Access</p>
                  </button>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Note:</strong> You can switch to the <strong>"Direct Permissions"</strong> tab to customize or grant individual permissions beyond the assigned role at any time!
                </p>
              </div>
            </div>
          ) : (
            /* Permissions Tab */
            <div className="space-y-4">
              {/* Permission Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">Selected Permissions:</span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {directPermissionIds.length} / {allPermissions.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Categorized Permissions Accordions */}
              {loadingPerms ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading system permissions...
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedPermissions).map(([category, { icon: Icon, color, perms }]) => {
                    if (perms.length === 0) return null;
                    const isCollapsed = collapsedCategories[category];
                    const categorySelectedCount = perms.filter(p => directPermissionIds.includes(p.id)).length;
                    const isAllSelected = categorySelectedCount === perms.length;

                    return (
                      <div key={category} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                        {/* Category Header */}
                        <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                          <div 
                            className="flex items-center gap-2.5 cursor-pointer select-none flex-1"
                            onClick={() => setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                          >
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-xs text-gray-900">{category}</span>
                            <span className="text-[10px] font-mono bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                              {categorySelectedCount} / {perms.length}
                            </span>
                            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronUp className="w-3.5 h-3.5 text-gray-400" />}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSelectCategory(perms, !isAllSelected)}
                              className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-1 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            >
                              {isAllSelected ? 'Deselect All' : 'Select Group'}
                            </button>
                          </div>
                        </div>

                        {/* Permissions Grid */}
                        {!isCollapsed && (
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                            {perms.map((p) => {
                              const checked = directPermissionIds.includes(p.id);
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => togglePermission(p.id)}
                                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
                                    checked
                                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold'
                                      : 'border-gray-200 bg-gray-50/40 text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="mt-0.5">
                                    {checked ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs truncate font-bold text-gray-900">{p.description || p.code}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-400 block truncate">{p.code}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-gray-400">
              {roleIds.includes(1) ? '👑 Administrator Role' : `📦 Role #${roleIds[0]} (${directPermissionIds.length} Direct Perms)`}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary py-2 text-xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2 text-xs px-5 shadow-md flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <span className="spinner !w-3.5 !h-3.5 border-white/30 !border-t-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{mode === 'edit' ? 'Save Changes' : 'Create User'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
