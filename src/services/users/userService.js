import apiClient from '../apiClient';
import { API_CONFIG } from '../../config/api';

const INITIAL_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@company.com',
    roles: ['Administrator'],
    roleIds: [1],
    directPermissionIds: [],
    effectivePermissions: ['*'],
    isActive: true,
    twoFactorEnabled: true,
    createdAtUtc: '2026-01-15T08:00:00Z'
  },
  {
    id: 2,
    username: 'sothea_stock',
    email: 'sothea@company.com',
    roles: ['StockManager'],
    roleIds: [2],
    directPermissionIds: [2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14],
    effectivePermissions: ['stock.view', 'stock-items.view', 'stock-items.create', 'stock-in.view', 'stock-in.create', 'stock-out.view', 'stock-out.create'],
    isActive: true,
    twoFactorEnabled: true,
    createdAtUtc: '2026-02-01T09:30:00Z'
  },
  {
    id: 3,
    username: 'rotha_user',
    email: 'rotha@company.com',
    roles: ['Viewer'],
    roleIds: [3],
    directPermissionIds: [2, 3],
    effectivePermissions: ['stock.view', 'stock-items.view'],
    isActive: true,
    twoFactorEnabled: false,
    createdAtUtc: '2026-03-10T14:15:00Z'
  }
];

const STORAGE_KEY = 'is405_local_users_list';

function loadUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(e);
  }
  return [...INITIAL_USERS];
}

function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn(e);
  }
}

function mergeUsers(localList, apiList) {
  if (!Array.isArray(apiList) || apiList.length === 0) return localList;
  if (!Array.isArray(localList) || localList.length === 0) return apiList;

  const apiIds = new Set(apiList.map(u => u.id));
  const apiUsernames = new Set(apiList.map(u => u.username?.toLowerCase()));

  const merged = [...apiList];
  for (const localUser of localList) {
    const usernameLower = localUser.username?.toLowerCase();
    if (!apiIds.has(localUser.id) && !apiUsernames.has(usernameLower)) {
      merged.push(localUser);
    }
  }
  return merged;
}

export const userService = {
  async getUsers() {
    const localUsers = loadUsers();
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USERS.BASE);
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        const merged = mergeUsers(localUsers, response.data);
        saveUsers(merged);
        return merged;
      }
    } catch (error) {
      // Fallback to local
    }
    return localUsers;
  },

  async createUser(userData) {
    const roleIds = userData.roleIds && userData.roleIds.length > 0 ? userData.roleIds.map(Number) : [2];
    const directPermissionIds = userData.directPermissionIds ? userData.directPermissionIds.map(Number) : [];

    // Look up actual role name from the local roles list (supports custom roles)
    const savedRolesRaw = localStorage.getItem('is405_local_roles_list');
    const allRoles = savedRolesRaw ? JSON.parse(savedRolesRaw) : [];
    const matchedRole = allRoles.find(r => roleIds.includes(Number(r.id)));
    const roleName = matchedRole?.name ||
      (roleIds.includes(1) ? 'Administrator' : roleIds.includes(2) ? 'StockManager' : 'Viewer');

    const payload = {
      username: userData.username,
      email: userData.email,
      password: userData.password || 'Password123!',
      roleIds: roleIds,
      directPermissionIds: directPermissionIds
    };

    let createdUser = null;
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.USERS.BASE, payload);
      if (response?.data) {
        createdUser = response.data;
      }
    } catch (error) {
      console.warn('API createUser failed, fallback local', error);
    }

    if (!createdUser) {
      createdUser = {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        roles: [roleName],
        roleIds: roleIds,
        directPermissionIds: directPermissionIds,
        effectivePermissions: roleIds.includes(1) ? ['*'] : [],
        isActive: true,
        twoFactorEnabled: false,
        createdAtUtc: new Date().toISOString()
      };
    } else {
      createdUser = {
        ...createdUser,
        ...userData,
        roles: [roleName],
        roleIds: roleIds,
        directPermissionIds: directPermissionIds
      };
    }

    const users = loadUsers();
    // Prevent duplicate username in local state
    const filtered = users.filter(u => u.username?.toLowerCase() !== createdUser.username?.toLowerCase());
    filtered.unshift(createdUser);
    saveUsers(filtered);
    return createdUser;
  },

  async updateUser(userId, userData) {
    const roleIds = userData.roleIds && userData.roleIds.length > 0 ? userData.roleIds.map(Number) : [2];
    const directPermissionIds = userData.directPermissionIds ? userData.directPermissionIds.map(Number) : [];

    // Look up actual role name from the local roles list (supports custom roles)
    const savedRolesRaw2 = localStorage.getItem('is405_local_roles_list');
    const allRoles2 = savedRolesRaw2 ? JSON.parse(savedRolesRaw2) : [];
    const matchedRole2 = allRoles2.find(r => roleIds.includes(Number(r.id)));
    const roleName = matchedRole2?.name ||
      (roleIds.includes(1) ? 'Administrator' : roleIds.includes(2) ? 'StockManager' : 'Viewer');

    const payload = {
      roleIds: roleIds,
      directPermissionIds: directPermissionIds
    };

    let updatedUser = null;
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.USERS.ROLES(userId), payload);
      if (response?.data) {
        updatedUser = response.data;
      }
    } catch (error) {
      console.warn('API update roles failed, fallback local', error);
    }

    const users = loadUsers();
    const idx = users.findIndex(u => u.id === Number(userId));
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        ...(updatedUser || {}),
        ...userData,
        roles: [roleName],
        roleIds: roleIds,
        directPermissionIds: directPermissionIds,
        effectivePermissions: roleIds.includes(1) ? ['*'] : []
      };
      saveUsers(users);
      return users[idx];
    }

    if (updatedUser) return updatedUser;
    throw new Error('User not found');
  },

  async toggleUserStatus(userId) {
    try {
      const res = await apiClient.put(API_CONFIG.ENDPOINTS.USERS.STATUS(userId));
      if (res?.data) {
        const users = loadUsers();
        const idx = users.findIndex(u => u.id === Number(userId));
        if (idx !== -1) {
          users[idx] = res.data;
          saveUsers(users);
          return users[idx];
        }
      }
    } catch (error) {
      // Offline fallback
    }

    const users = loadUsers();
    const idx = users.findIndex(u => u.id === Number(userId));
    if (idx !== -1) {
      users[idx].isActive = !users[idx].isActive;
      saveUsers(users);
      return users[idx];
    }
    throw new Error('User not found');
  },

  async deleteUser(userId) {
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.USERS.USER_BY_ID(userId));
    } catch (error) {
      if (error.response) {
        const msg = error.response.data?.message || `Delete failed (${error.response.status})`;
        throw new Error(msg);
      }
    }

    const users = loadUsers();
    const filtered = users.filter(u => u.id !== Number(userId));
    saveUsers(filtered);
    return true;
  }
};
