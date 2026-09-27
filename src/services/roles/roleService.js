import apiClient from '../apiClient';
import { API_CONFIG } from '../../config/api';

const INITIAL_ROLES = [
  {
    id: 1,
    name: 'Administrator',
    code: 'ADMIN',
    description: 'Full system control with full access across all microservices',
    permissionIds: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 18, 19, 20, 21, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 48, 51, 52, 59, 60],
    permissionNames: ['*']
  },
  {
    id: 2,
    name: 'StockManager',
    code: 'WAREHOUSE',
    description: 'Manages warehouse inventory, stock movements, and item catalogs',
    permissionIds: [2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 48, 51, 52],
    permissionNames: ['stock.view', 'stock-items.view', 'stock-items.create', 'stock-items.edit', 'stock-in.create', 'stock-out.create', 'transfers.create']
  },
  {
    id: 3,
    name: 'Viewer',
    code: 'STAFF',
    description: 'Read-only access to view stock status and reports',
    permissionIds: [2, 3, 13, 14],
    permissionNames: ['stock.view', 'stock-items.view', 'stock-movements.view', 'stock-alerts.view']
  }
];

const STORAGE_KEY = 'is405_local_roles_list';

function loadRoles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(e);
  }
  return [...INITIAL_ROLES];
}

function saveRoles(roles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  } catch (e) {
    console.warn(e);
  }
}

function mergeRoles(localList, apiList) {
  if (!Array.isArray(apiList) || apiList.length === 0) return localList;
  if (!Array.isArray(localList) || localList.length === 0) return apiList;

  const apiIds = new Set(apiList.map(r => r.id));
  const apiCodes = new Set(apiList.map(r => r.code?.toUpperCase()));

  const merged = [...apiList];
  for (const localRole of localList) {
    const codeUpper = localRole.code?.toUpperCase();
    if (!apiIds.has(localRole.id) && !apiCodes.has(codeUpper)) {
      merged.push(localRole);
    }
  }
  return merged;
}

export const roleService = {
  async getRoles() {
    const localRoles = loadRoles();
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ROLES.BASE);
      const items = response.data?.items || response.data;
      if (Array.isArray(items) && items.length > 0) {
        const merged = mergeRoles(localRoles, items);
        saveRoles(merged);
        return merged;
      }
    } catch (error) {
      // Fallback
    }
    return localRoles;
  },

  async createRole(roleData) {
    let newRole = null;
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ROLES.BASE, roleData);
      if (response?.data) newRole = response.data;
    } catch (error) {
      // Offline fallback
    }

    if (!newRole) {
      newRole = {
        id: Date.now(),
        name: roleData.name,
        code: (roleData.code || roleData.name || '').toUpperCase(),
        description: roleData.description || '',
        permissionIds: roleData.permissionIds || [],
        permissionNames: []
      };
    }

    const roles = loadRoles();
    const filtered = roles.filter(r => r.code?.toUpperCase() !== newRole.code?.toUpperCase());
    filtered.push(newRole);
    saveRoles(filtered);
    return newRole;
  },

  async updateRole(roleId, roleData) {
    let updatedRole = null;
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.ROLES.ROLE_BY_ID(roleId), {
        name: roleData.name,
        description: roleData.description,
        permissionIds: roleData.permissionIds || []
      });
      if (response?.data) updatedRole = response.data;
    } catch (error) {
      // Offline fallback
    }

    const roles = loadRoles();
    const idx = roles.findIndex(r => r.id === Number(roleId));
    if (idx !== -1) {
      roles[idx] = {
        ...roles[idx],
        ...(updatedRole || {}),
        ...roleData,
        permissionIds: roleData.permissionIds || roles[idx].permissionIds
      };
      saveRoles(roles);
      return roles[idx];
    }

    if (updatedRole) return updatedRole;
    throw new Error('Role not found');
  }
};
