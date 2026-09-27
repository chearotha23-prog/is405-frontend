// Stock In Service — Inbound stock receiving & adjustments (add stock)
import apiClient from '../apiClient';
import { API_CONFIG } from '../../config/api';
import { loadStock, saveStock } from './stockItemService';

const STORAGE_KEY_IN = 'is405_local_stock_in_records';

const INITIAL_STOCK_IN = [
  {
    id: 1,
    referenceNo: 'GRN-2026-001',
    itemId: 1,
    itemName: 'iPhone 15 Pro Max 256GB',
    sku: 'STK-APP-001',
    quantityReceived: 20,
    unitCost: 1099.00,
    totalCost: 21980.00,
    supplier: 'Apple Distribution Asia',
    receivedDate: '2026-09-20',
    poReference: 'PO-2026-001',
    warehouseLocation: 'Warehouse A - Rack 3',
    notes: 'Received in good condition',
    recordedBy: 'sothea_stock'
  },
  {
    id: 2,
    referenceNo: 'GRN-2026-002',
    itemId: 4,
    itemName: 'Logitech MX Master 3S Mouse',
    sku: 'STK-LOG-004',
    quantityReceived: 50,
    unitCost: 99.00,
    totalCost: 4950.00,
    supplier: 'Logitech Tech Corp',
    receivedDate: '2026-09-22',
    poReference: 'PO-2026-003',
    warehouseLocation: 'Warehouse B - Bin 12',
    notes: 'Batch #L2026-09',
    recordedBy: 'sothea_stock'
  }
];

function loadStockIn() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_IN);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(e);
  }
  return [...INITIAL_STOCK_IN];
}

function saveStockIn(records) {
  try {
    localStorage.setItem(STORAGE_KEY_IN, JSON.stringify(records));
  } catch (e) {
    console.warn(e);
  }
}

export const stockInService = {
  async getStockInRecords(params = {}) {
    try {
      const response = await apiClient.get('/stock/in', { params });
      if (response?.data && Array.isArray(response.data)) {
        saveStockIn(response.data);
        return response.data;
      }
    } catch (error) {
      // Fallback
    }

    let records = loadStockIn();
    if (params.search) {
      const s = params.search.toLowerCase();
      records = records.filter(r =>
        r.referenceNo?.toLowerCase().includes(s) ||
        r.itemName?.toLowerCase().includes(s) ||
        r.supplier?.toLowerCase().includes(s)
      );
    }
    return records;
  },

  async createStockIn(receiptData) {
    const records = loadStockIn();
    const newRecord = {
      id: Date.now(),
      referenceNo: `GRN-2026-${String(records.length + 3).padStart(3, '0')}`,
      itemId: receiptData.itemId,
      itemName: receiptData.itemName,
      sku: receiptData.sku || '',
      quantityReceived: Number(receiptData.quantityReceived || 0),
      unitCost: Number(receiptData.unitCost || 0),
      totalCost: Number(receiptData.quantityReceived || 0) * Number(receiptData.unitCost || 0),
      supplier: receiptData.supplier || '',
      receivedDate: new Date().toISOString().split('T')[0],
      poReference: receiptData.poReference || '',
      warehouseLocation: receiptData.warehouseLocation || 'Warehouse Main',
      notes: receiptData.notes || '',
      recordedBy: receiptData.recordedBy || 'admin'
    };

    records.unshift(newRecord);
    saveStockIn(records);

    // Also update the item quantity in stock
    const items = loadStock();
    const idx = items.findIndex(i => i.id === Number(receiptData.itemId));
    if (idx !== -1) {
      items[idx].quantityOnHand += newRecord.quantityReceived;
      const qty = items[idx].quantityOnHand;
      const reorder = items[idx].reorderLevel;
      items[idx].status = qty > reorder ? 'IN_STOCK' : qty > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';
      saveStock(items);
    }

    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.STOCK.ADJUST(receiptData.itemId), {
        adjustmentQuantity: newRecord.quantityReceived,
        reason: `Stock In — ${newRecord.referenceNo}`
      });
    } catch (error) {
      // Offline fallback
    }

    return newRecord;
  },

  // Adjust stock quantity (positive = add, negative = deduct)
  async adjustStock(itemId, adjustmentQuantity, reason) {
    const items = loadStock();
    const idx = items.findIndex(i => i.id === Number(itemId));
    if (idx !== -1) {
      const item = items[idx];
      item.quantityOnHand = Math.max(0, item.quantityOnHand + Number(adjustmentQuantity));
      const qty = item.quantityOnHand;
      const reorder = item.reorderLevel;
      item.status = qty <= 0 ? 'OUT_OF_STOCK' : qty <= reorder ? 'LOW_STOCK' : 'IN_STOCK';
      saveStock(items);

      try {
        await apiClient.post(API_CONFIG.ENDPOINTS.STOCK.ADJUST(itemId), {
          adjustmentQuantity,
          reason
        });
      } catch (error) {
        // Offline fallback
      }
      return item;
    }
    throw new Error('Stock item not found');
  }
};
