import apiClient from '../apiClient';
import { API_CONFIG } from '../../config/api';

const INITIAL_STOCK_ITEMS = [
  {
    id: 1,
    sku: 'LAP-001',
    name: 'Lenovo ThinkPad X1 Carbon',
    categoryName: 'Laptops',
    quantityOnHand: 45,
    reorderLevel: 10,
    unitPrice: 1299.00,
    status: 'IN_STOCK',
    isActive: true,
    location: 'Warehouse A - Bin 04',
    barcode: '8801234567890'
  },
  {
    id: 2,
    sku: 'LOG-302',
    name: 'Logitech MX Master 3S Mouse',
    categoryName: 'Peripherals',
    quantityOnHand: 8,
    reorderLevel: 15,
    unitPrice: 99.00,
    status: 'LOW_STOCK',
    isActive: true,
    location: 'Warehouse A - Bin 11',
    barcode: '8804567890123'
  },
  {
    id: 3,
    sku: 'MON-401',
    name: 'Dell UltraSharp 27" 4K Monitor',
    categoryName: 'Monitors',
    quantityOnHand: 0,
    reorderLevel: 5,
    unitPrice: 549.00,
    status: 'OUT_OF_STOCK',
    isActive: true,
    location: 'Warehouse B - Bin 02',
    barcode: '8807654321098'
  },
  {
    id: 4,
    sku: 'KBD-105',
    name: 'Keychron K2 Wireless Mechanical Keyboard',
    categoryName: 'Peripherals',
    quantityOnHand: 120,
    reorderLevel: 15,
    unitPrice: 99.00,
    status: 'IN_STOCK',
    isActive: true,
    location: 'Warehouse B - Bin 12',
    barcode: '8809876543210'
  }
];

const STORAGE_KEY = 'is405_local_stock_items';

export function loadStock() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(e);
  }
  return [...INITIAL_STOCK_ITEMS];
}

export function saveStock(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn(e);
  }
}

function mergeItems(localList, apiList) {
  if (!Array.isArray(apiList) || apiList.length === 0) return localList;
  if (!Array.isArray(localList) || localList.length === 0) return apiList;

  const apiIds = new Set(apiList.map(i => i.id));
  const apiSkus = new Set(apiList.map(i => i.sku?.toUpperCase()));

  const merged = [...apiList];
  for (const localItem of localList) {
    const skuUpper = localItem.sku?.toUpperCase();
    if (!apiIds.has(localItem.id) && !apiSkus.has(skuUpper)) {
      merged.push(localItem);
    }
  }
  return merged;
}

export const stockItemService = {
  async getItems(params = {}) {
    const localStock = loadStock();
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.STOCK.ITEMS, { params });
      const apiItems = response?.data?.items || response?.data;
      if (Array.isArray(apiItems) && apiItems.length > 0) {
        const merged = mergeItems(localStock, apiItems);
        saveStock(merged);
        
        let filtered = merged;
        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(i =>
            i.name?.toLowerCase().includes(s) ||
            i.sku?.toLowerCase().includes(s) ||
            i.location?.toLowerCase().includes(s)
          );
        }
        if (params.status && params.status !== 'ALL') {
          filtered = filtered.filter(i => i.status === params.status);
        }
        return filtered;
      }
    } catch (error) {
      // Fallback to local
    }

    let items = localStock;
    if (params.search) {
      const s = params.search.toLowerCase();
      items = items.filter(i =>
        i.name?.toLowerCase().includes(s) ||
        i.sku?.toLowerCase().includes(s) ||
        i.location?.toLowerCase().includes(s)
      );
    }
    if (params.status && params.status !== 'ALL') {
      items = items.filter(i => i.status === params.status);
    }
    return items;
  },

  async getItem(id) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.STOCK.ITEM_BY_ID(id));
      if (response?.data) return response.data;
    } catch (error) {
      // Fallback to local
    }
    const items = loadStock();
    return items.find(i => i.id === Number(id)) || null;
  },

  async createItem(itemData) {
    let apiCreated = null;
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.STOCK.ITEMS, itemData);
      if (response?.data) apiCreated = response.data;
    } catch (error) {
      // Offline fallback
    }

    const items = loadStock();
    const qty = Number(itemData.quantityOnHand || 0);
    const reorder = Number(itemData.reorderLevel || 5);
    const newItem = apiCreated || {
      id: Date.now(),
      sku: itemData.sku,
      name: itemData.name,
      categoryName: itemData.categoryName || 'General',
      quantityOnHand: qty,
      reorderLevel: reorder,
      unitPrice: Number(itemData.unitPrice || 0),
      status: qty > reorder ? 'IN_STOCK' : qty > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
      isActive: true,
      location: itemData.location || 'Warehouse Main',
      barcode: itemData.barcode || ''
    };

    const filtered = items.filter(i => i.sku?.toUpperCase() !== newItem.sku?.toUpperCase());
    filtered.unshift(newItem);
    saveStock(filtered);
    return newItem;
  },

  async updateItem(id, itemData) {
    let apiUpdated = null;
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.STOCK.ITEM_BY_ID(id), itemData);
      if (response?.data) apiUpdated = response.data;
    } catch (error) {
      // Offline fallback
    }

    const items = loadStock();
    const idx = items.findIndex(i => i.id === Number(id));
    if (idx !== -1) {
      const qty = itemData.quantityOnHand !== undefined ? Number(itemData.quantityOnHand) : items[idx].quantityOnHand;
      const reorder = itemData.reorderLevel !== undefined ? Number(itemData.reorderLevel) : items[idx].reorderLevel;

      items[idx] = {
        ...items[idx],
        ...(apiUpdated || {}),
        ...itemData,
        quantityOnHand: qty,
        reorderLevel: reorder,
        unitPrice: itemData.unitPrice !== undefined ? Number(itemData.unitPrice) : items[idx].unitPrice,
        status: qty > reorder ? 'IN_STOCK' : qty > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK'
      };
      saveStock(items);
      return items[idx];
    }

    if (apiUpdated) return apiUpdated;
    throw new Error('Stock item not found');
  },

  async deleteItem(id) {
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.STOCK.ITEM_BY_ID(id));
    } catch (error) {
      // Offline fallback
    }

    const items = loadStock();
    const filtered = items.filter(i => i.id !== Number(id));
    saveStock(filtered);
    return true;
  }
};
