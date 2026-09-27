// Stock Out Service — Outbound stock dispatch records
import apiClient from '../apiClient';
import { loadStock, saveStock } from './stockItemService';

const STORAGE_KEY_OUT = 'is405_local_stock_out_records';

const INITIAL_STOCK_OUT = [
  {
    id: 1,
    referenceNo: 'ISS-2026-001',
    itemId: 1,
    itemName: 'iPhone 15 Pro Max 256GB',
    sku: 'STK-APP-001',
    quantityDispatched: 5,
    unitPrice: 1199.00,
    totalValue: 5995.00,
    customer: 'Angkor Tech Solutions Co., Ltd',
    dispatchDate: '2026-09-26',
    soReference: 'SO-2026-088',
    warehouseLocation: 'Warehouse A - Rack 3',
    notes: 'Delivered via courier',
    dispatchedBy: 'sothea_stock'
  },
  {
    id: 2,
    referenceNo: 'ISS-2026-002',
    itemId: 2,
    itemName: 'MacBook Pro M3 Max 16"',
    sku: 'STK-MAC-002',
    quantityDispatched: 6,
    unitPrice: 2499.00,
    totalValue: 14994.00,
    customer: 'Sokha International Hotel',
    dispatchDate: '2026-09-27',
    soReference: 'SO-2026-089',
    warehouseLocation: 'Warehouse A - Rack 1',
    notes: 'Partial delivery — pending 4 units',
    dispatchedBy: 'sothea_stock'
  }
];

function loadStockOut() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_OUT);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(e);
  }
  return [...INITIAL_STOCK_OUT];
}

function saveStockOut(records) {
  try {
    localStorage.setItem(STORAGE_KEY_OUT, JSON.stringify(records));
  } catch (e) {
    console.warn(e);
  }
}

export const stockOutService = {
  async getStockOutRecords(params = {}) {
    try {
      const response = await apiClient.get('/stock/out', { params });
      if (response?.data && Array.isArray(response.data)) {
        saveStockOut(response.data);
        return response.data;
      }
    } catch (error) {
      // Fallback
    }

    let records = loadStockOut();
    if (params.search) {
      const s = params.search.toLowerCase();
      records = records.filter(r =>
        r.referenceNo?.toLowerCase().includes(s) ||
        r.itemName?.toLowerCase().includes(s) ||
        r.customer?.toLowerCase().includes(s)
      );
    }
    return records;
  },

  async createStockOut(dispatchData) {
    const records = loadStockOut();
    const qty = Number(dispatchData.quantityDispatched || 0);

    // Check available stock
    const items = loadStock();
    const item = items.find(i => i.id === Number(dispatchData.itemId));
    if (item && item.quantityOnHand < qty) {
      throw new Error(`Insufficient stock. Available: ${item.quantityOnHand} units.`);
    }

    const newRecord = {
      id: Date.now(),
      referenceNo: `ISS-2026-${String(records.length + 3).padStart(3, '0')}`,
      itemId: dispatchData.itemId,
      itemName: dispatchData.itemName,
      sku: dispatchData.sku || '',
      quantityDispatched: qty,
      unitPrice: Number(dispatchData.unitPrice || 0),
      totalValue: qty * Number(dispatchData.unitPrice || 0),
      customer: dispatchData.customer || '',
      dispatchDate: new Date().toISOString().split('T')[0],
      soReference: dispatchData.soReference || '',
      warehouseLocation: dispatchData.warehouseLocation || 'Warehouse Main',
      notes: dispatchData.notes || '',
      dispatchedBy: dispatchData.dispatchedBy || 'admin'
    };

    records.unshift(newRecord);
    saveStockOut(records);

    // Deduct from stock
    if (item) {
      const idx = items.findIndex(i => i.id === Number(dispatchData.itemId));
      items[idx].quantityOnHand = Math.max(0, item.quantityOnHand - qty);
      const newQty = items[idx].quantityOnHand;
      const reorder = items[idx].reorderLevel;
      items[idx].status = newQty <= 0 ? 'OUT_OF_STOCK' : newQty <= reorder ? 'LOW_STOCK' : 'IN_STOCK';
      saveStock(items);
    }

    try {
      await apiClient.post('/stock/out', dispatchData);
    } catch (error) {
      // Offline fallback
    }

    return newRecord;
  }
};
