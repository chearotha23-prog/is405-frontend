import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS } from '../config/api';
import { authService } from '../services/auth/authService';
import { permissionService } from '../services/settings/permissionService';

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const jsonStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

function extractRolesFromJwt(payload) {
  if (!payload) return [];
  const roleClaim =
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    payload['role'] ||
    payload['roles'];
  if (Array.isArray(roleClaim)) return roleClaim;
  if (typeof roleClaim === 'string') return [roleClaim];
  return [];
}

const ADMIN_NAMES = ['admin', 'administrator'];

export const AuthProvider = ({ children }) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [token, setToken] = useState(
    () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null
  );
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    return saved ? JSON.parse(saved) : null;
  });
  const [permissions, setPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem('is405_user_permissions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [pendingTwoFactor, setPendingTwoFactor] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TWO_FACTOR_PENDING);
    return saved ? JSON.parse(saved) : null;
  });
  const [authStep, setAuthStep] = useState(() => {
    if (localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) return 'AUTHENTICATED';
    const pending = localStorage.getItem(STORAGE_KEYS.TWO_FACTOR_PENDING);
    if (pending) {
      const parsed = JSON.parse(pending);
      return parsed.requiresSetup ? 'SETUP_2FA' : 'VERIFY_2FA';
    }
    return 'LOGIN';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Refs (always hold latest values — no stale closures) ──────────────────
  // Declared AFTER all useState so values are initialized
  const userRef     = useRef(user);
  const tokenRef    = useRef(token);
  const authStepRef = useRef(authStep);
  useEffect(() => { userRef.current     = user;     }, [user]);
  useEffect(() => { tokenRef.current    = token;    }, [token]);
  useEffect(() => { authStepRef.current = authStep; }, [authStep]);

  // ── Persist to localStorage ───────────────────────────────────────────────
  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    else       localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    else      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
  }, [user]);

  useEffect(() => {
    if (permissions && permissions.length > 0)
      localStorage.setItem('is405_user_permissions', JSON.stringify(permissions));
    else
      localStorage.removeItem('is405_user_permissions');
  }, [permissions]);

  useEffect(() => {
    if (pendingTwoFactor)
      localStorage.setItem(STORAGE_KEYS.TWO_FACTOR_PENDING, JSON.stringify(pendingTwoFactor));
    else
      localStorage.removeItem(STORAGE_KEYS.TWO_FACTOR_PENDING);
  }, [pendingTwoFactor]);

  // ── Real-time Permission Sync ─────────────────────────────────────────────
  // useCallback with [] deps — stable reference, reads everything via refs/localStorage
  const refreshPermissions = useCallback(async () => {
    const currentToken    = tokenRef.current;
    const currentAuthStep = authStepRef.current;
    if (!currentToken || currentAuthStep !== 'AUTHENTICATED') return;

    // Step 1: Try backend /permissions/me (if online)
    let apiPerms = [];
    try {
      const res = await permissionService.getMyPermissions();
      if (Array.isArray(res) && res.length > 0) apiPerms = res;
    } catch (_) { /* offline — no problem */ }

    // Step 2: Resolve from localStorage (always fresh — never uses stale state)
    try {
      const savedUsersRaw = localStorage.getItem('is405_local_users_list');
      const savedRolesRaw = localStorage.getItem('is405_local_roles_list');

      // Get current user info — prefer ref (latest React state), fallback to localStorage
      const currentUserInfo = userRef.current || (() => {
        const raw = localStorage.getItem(STORAGE_KEYS.USER_INFO);
        return raw ? JSON.parse(raw) : null;
      })();

      if (!currentUserInfo?.username) {
        // No user — just apply API perms
        _applyPerms(apiPerms);
        return;
      }

      const allLocalUsers = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
      const allLocalRoles = savedRolesRaw ? JSON.parse(savedRolesRaw) : [];

      // Find this user in the local users list
      const userObj = allLocalUsers.find(
        u => u.username?.toLowerCase() === currentUserInfo.username.toLowerCase()
      );

      if (!userObj) {
        // Not in local list yet — just apply API perms
        _applyPerms(apiPerms);
        return;
      }

      // ── Admin detection ────────────────────────────────────────────────────
      // Check by: role name array, roleIds array, or matched role in roles list
      const userRoleNamesLower = (userObj.roles  || []).map(r => String(r).toLowerCase());
      const userRoleIds        = (userObj.roleIds || []).map(Number);

      const isAdminByName   = userRoleNamesLower.some(r => ADMIN_NAMES.includes(r));
      const isAdminByRoleId = userRoleIds.includes(1);
      const isAdminByRole   = allLocalRoles.some(role => {
        const roleMatches =
          userRoleNamesLower.includes(role.name?.toLowerCase()) ||
          userRoleNamesLower.includes(role.code?.toLowerCase()) ||
          userRoleIds.includes(Number(role.id));
        return roleMatches && (
          ADMIN_NAMES.includes(role.name?.toLowerCase()) ||
          ADMIN_NAMES.includes(role.code?.toLowerCase())
        );
      });

      if (isAdminByName || isAdminByRoleId || isAdminByRole) {
        setPermissions(['*']);
        setUser(prev => prev ? { ...prev, isAdmin: true } : prev);
        return;
      }

      // ── Non-admin: resolve permissions from matched roles + direct perms ───
      // Match roles by name (case-insensitive) OR code (case-insensitive) OR id
      const matchedRoles = allLocalRoles.filter(role =>
        userRoleNamesLower.includes(role.name?.toLowerCase()) ||
        userRoleNamesLower.includes(role.code?.toLowerCase()) ||
        userRoleIds.includes(Number(role.id))
      );

      // Collect all permissionIds (direct + from matched roles)
      const permIdSet = new Set((userObj.directPermissionIds || []).map(Number));
      matchedRoles.forEach(role =>
        (role.permissionIds || []).map(Number).forEach(id => permIdSet.add(id))
      );

      // Resolve IDs → permission codes
      const allPerms = await permissionService.getAllPermissions();
      const localPermCodes = Array.from(permIdSet)
        .map(id => {
          const found = allPerms.find(p => Number(p.id) === id);
          return found?.code || null;
        })
        .filter(Boolean);

      // Merge API + local
      const combined = Array.from(new Set([...apiPerms, ...localPermCodes]));

      if (combined.includes('*')) {
        setPermissions(['*']);
        return;
      }

      _applyPerms(combined);

      // Ensure isAdmin flag is false for non-admin
      setUser(prev => {
        if (!prev || !prev.isAdmin) return prev;
        return { ...prev, isAdmin: false };
      });

    } catch (err) {
      console.warn('[AuthContext] refreshPermissions error:', err);
    }
  }, []); // stable — intentionally no deps; reads via refs + localStorage

  // Helper: only update permissions state if actually changed
  function _applyPerms(newPerms) {
    setPermissions(prev => {
      const a = JSON.stringify([...(prev || [])].sort());
      const b = JSON.stringify([...newPerms].sort());
      return a !== b ? newPerms : prev;
    });
  }

  // ── Polling + Event listeners ─────────────────────────────────────────────
  useEffect(() => {
    if (!token || authStep !== 'AUTHENTICATED') return;

    // Run immediately on mount / when auth state changes
    refreshPermissions();

    // Poll every 2 seconds for real-time updates
    const intervalId = setInterval(refreshPermissions, 2000);

    // Also sync on: window focus, cross-tab storage changes, explicit events
    window.addEventListener('focus',               refreshPermissions);
    window.addEventListener('storage',             refreshPermissions);
    window.addEventListener('permissions_updated', refreshPermissions);
    window.addEventListener('roles_updated',       refreshPermissions);
    window.addEventListener('users_updated',       refreshPermissions);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus',               refreshPermissions);
      window.removeEventListener('storage',             refreshPermissions);
      window.removeEventListener('permissions_updated', refreshPermissions);
      window.removeEventListener('roles_updated',       refreshPermissions);
      window.removeEventListener('users_updated',       refreshPermissions);
    };
  }, [token, authStep, refreshPermissions]);

  // ── Auth Flow Handlers ────────────────────────────────────────────────────
  const handleLogin = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(username, password);

      if (response.requiresTwoFactor) {
        const pendingData = {
          username,
          requiresSetup: response.requiresSetup !== false,
          challengeToken: response.challengeToken,
          tempAccessToken: response.accessToken,
          secret: response.secret || 'JBSWY3DPEHPK3PXP',
          qrCodeDataUrl: response.qrCodeDataUrl,
        };
        setPendingTwoFactor(pendingData);
        setAuthStep(pendingData.requiresSetup ? 'SETUP_2FA' : 'VERIFY_2FA');
        return { requiresTwoFactor: true, requiresSetup: pendingData.requiresSetup };
      }

      completeAuthentication(response.accessToken, { username, email: `${username}@company.com` });
      return { requiresTwoFactor: false };
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Login failed';
      setError(msg);
      throw msg;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2FA = async (totpCode) => {
    setLoading(true);
    setError(null);
    try {
      await authService.enableTwoFactor(totpCode);
      if (pendingTwoFactor?.challengeToken) {
        const verifyRes = await authService.verifyTwoFactorLogin(pendingTwoFactor.challengeToken, totpCode);
        completeAuthentication(verifyRes.accessToken || pendingTwoFactor.tempAccessToken || 'mock_jwt_token', {
          username: pendingTwoFactor.username,
          email: `${pendingTwoFactor.username}@company.com`,
          twoFactorEnabled: true
        });
      } else {
        completeAuthentication(pendingTwoFactor?.tempAccessToken || 'mock_jwt_token', {
          username: pendingTwoFactor?.username || 'admin',
          email: `${pendingTwoFactor?.username || 'admin'}@company.com`,
          twoFactorEnabled: true
        });
      }
      setPendingTwoFactor(null);
      setAuthStep('AUTHENTICATED');
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Invalid 2FA code';
      setError(msg);
      throw msg;
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (totpCode) => {
    setLoading(true);
    setError(null);
    try {
      const challenge = pendingTwoFactor?.challengeToken || 'CHALLENGE_DEFAULT';
      const verifyRes = await authService.verifyTwoFactorLogin(challenge, totpCode);
      completeAuthentication(verifyRes.accessToken || 'mock_jwt_token', {
        username: pendingTwoFactor?.username || 'admin',
        email: `${pendingTwoFactor?.username || 'admin'}@company.com`,
        twoFactorEnabled: true
      });
      setPendingTwoFactor(null);
      setAuthStep('AUTHENTICATED');
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Invalid 2FA code';
      setError(msg);
      throw msg;
    } finally {
      setLoading(false);
    }
  };

  const completeAuthentication = (accessToken, baseUser) => {
    const payload  = decodeJwt(accessToken);
    const jwtRoles = extractRolesFromJwt(payload);

    // Check admin: from JWT roles first, then look up in local users list
    const isAdminFromJwt = jwtRoles.some(r => ADMIN_NAMES.includes(r.toLowerCase()));

    // Also check local users list for this username
    const savedUsersRaw = localStorage.getItem('is405_local_users_list');
    const localUsers    = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
    const localUserObj  = localUsers.find(
      u => u.username?.toLowerCase() === baseUser.username?.toLowerCase()
    );

    const localRoles = localUserObj?.roles || jwtRoles;
    const isAdminFromLocal = localRoles.some(r => ADMIN_NAMES.includes(String(r).toLowerCase()))
      || (localUserObj?.roleIds || []).includes(1);

    const isAdmin = isAdminFromJwt || isAdminFromLocal;

    const enrichedUser = {
      ...baseUser,
      roles:    localRoles.length > 0 ? localRoles : jwtRoles,
      roleIds:  localUserObj?.roleIds || [],
      isAdmin,
      roleName: localRoles[0] || jwtRoles[0] || 'User'
    };

    setToken(accessToken);
    setUser(enrichedUser);
    setAuthStep('AUTHENTICATED');
    setPendingTwoFactor(null);

    // Immediately set admin permissions without waiting for the polling cycle
    if (isAdmin) setPermissions(['*']);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPermissions([]);
    setPendingTwoFactor(null);
    setAuthStep('LOGIN');
    localStorage.clear();
  };

  // ── Permission Helpers ────────────────────────────────────────────────────
  const hasRole = (roleName) => {
    if (!user?.roles) return false;
    if (user.isAdmin) return true;
    return user.roles.some(r => String(r).toUpperCase() === roleName.toUpperCase());
  };

  const hasPermission = (permCode) => {
    if (user?.isAdmin) return true;
    if (!permCode) return true;
    if (permissions.includes('*')) return true;
    return permissions.some(p => p.toLowerCase() === permCode.toLowerCase());
  };

  const canAccessApp = (appId) => {
    if (!user) return false;
    if (user.isAdmin) return true;

    switch (appId) {
      case 'dashboard': return true;
      case 'security':  return true;
      case 'stock':
        return hasRole('WAREHOUSE') || hasRole('STOCKMANAGER') || hasPermission('stock.view');
      case 'po':
        return hasRole('PURCHASING') || hasPermission('purchases.view') || hasPermission('purchase-orders.view');
      case 'sales':
        return hasRole('SALES') || hasPermission('sales.view') || hasPermission('sales-orders.view');
      case 'users':
        return hasPermission('users.view');
      case 'roles':
        return hasPermission('roles.view') || hasPermission('permissions.view');
      case 'settings':
        return hasPermission('settings.view');
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        permissions,
        authStep,
        pendingTwoFactor,
        loading,
        error,
        setError,
        login: handleLogin,
        confirm2FA: handleConfirm2FA,
        verify2FA: handleVerify2FA,
        logout,
        setAuthStep,
        refreshPermissions,
        hasRole,
        hasPermission,
        canAccessApp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
