import apiClient from '../apiClient';

const INITIAL_POS = [
  {
    id: 1,
    poNumber: 'PO-2026-001',
    vendorName: 'Apple Distribution Asia',
    supplierName: 'Apple Distribution Asia',
    orderDate: '2026-09-20',
    expectedDate: '2026-09-28',
    totalAmount: 23980.00,
    status: 'APPROVED', // DRAFT | PENDING_APPROVAL | APPROVED | PARTIALLY_RECEIVED | RECEIVED | CLOSED | CANCELLED | REJECTED
    paymentStatus: 'PAID',
    itemsCount: 2,
    items: [
      { productId: 1, itemName: 'iPhone 15 Pro Max 256GB', quantity: 20, receivedQuantity: 0, unitPrice: 1099.00, total: 21980.00 },
      { productId: 2, itemName: 'Logitech MX Master 3S Mouse', quantity: 20, receivedQuantity: 0, unitPrice: 100.00, total: 2000.00 }
    ]
  },
  {
    id: 2,
    poNumber: 'PO-2026-002',
    vendorName: 'Samsung Electronics Global',
    supplierName: 'Samsung Electronics Global',
    orderDate: '2026-09-22',
    expectedDate: '2026-09-30',
    totalAmount: 12990.00,
    status: 'RECEIVED',
    paymentStatus: 'PAID',
    itemsCount: 1,
    items: [
      { productId: 3, itemName: 'Samsung Galaxy S24 Ultra', quantity: 10, receivedQuantity: 10, unitPrice: 1299.00, total: 12990.00 }
    ]
  },
  {
    id: 3,
    poNumber: 'PO-2026-003',
    vendorName: 'Logitech Tech Corp',
    supplierName: 'Logitech Tech Corp',
    orderDate: '2026-09-25',
    expectedDate: '2026-10-05',
    totalAmount: 4950.00,
    status: 'PENDING_APPROVAL',
    paymentStatus: 'UNPAID',
    itemsCount: 1,
    items: [
      { productId: 2, itemName: 'Logitech MX Master 3S Mouse', quantity: 50, receivedQuantity: 0, unitPrice: 99.00, total: 4950.00 }
    ]
  }
];

const STORAGE_KEY = 'is405_local_purchase_orders';

function loadPOs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(e);
  }
  return [...INITIAL_POS];
}

function savePOs(pos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch (e) {
    console.warn(e);
  }
}

function mergePOs(localList, apiList) {
  if (!Array.isArray(apiList) || apiList.length === 0) return localList;
  if (!Array.isArray(localList) || localList.length === 0) return apiList;

  const apiIds = new Set(apiList.map(p => p.id));
  const apiNumbers = new Set(apiList.map(p => p.poNumber?.toUpperCase()));

  const merged = [...apiList];
  for (const localPO of localList) {
    const numUpper = localPO.poNumber?.toUpperCase();
    if (!apiIds.has(localPO.id) && !apiNumbers.has(numUpper)) {
      merged.push(localPO);
    }
  }
  return merged;
}

export const purchaseService = {
  async getPurchaseOrders(params = {}) {
    const localPOs = loadPOs();
    try {
      const response = await apiClient.get('/purchases/orders', { params });
      const apiPOs = response?.data?.items || response?.data;
      if (Array.isArray(apiPOs) && apiPOs.length > 0) {
        const merged = mergePOs(localPOs, apiPOs);
        savePOs(merged);

        let filtered = merged;
        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(p =>
            p.poNumber?.toLowerCase().includes(s) ||
            (p.vendorName || p.supplierName || '')?.toLowerCase().includes(s)
          );
        }
        if (params.status && params.status !== 'ALL') {
          filtered = filtered.filter(p => p.status === params.status);
        }
        return filtered;
      }
    } catch (error) {
      // Fallback to local storage
    }

    let pos = localPOs;
    if (params.search) {
      const s = params.search.toLowerCase();
      pos = pos.filter(p =>
        p.poNumber?.toLowerCase().includes(s) ||
        (p.vendorName || p.supplierName || '')?.toLowerCase().includes(s)
      );
    }
    if (params.status && params.status !== 'ALL') {
      pos = pos.filter(p => p.status === params.status);
    }
    return pos;
  },

  async getPurchaseOrder(id) {
    try {
      const response = await apiClient.get(`/purchases/orders/${id}`);
      if (response?.data) return response.data;
    } catch (error) {
      // Fallback
    }
    const pos = loadPOs();
    return pos.find(p => p.id === Number(id)) || null;
  },

  async createPurchaseOrder(poData) {
    let apiCreated = null;
    try {
      const response = await apiClient.post('/purchases/orders', poData);
      if (response?.data) apiCreated = response.data;
    } catch (error) {
      // Offline fallback succeeded
    }

    const pos = loadPOs();
    const newPO = apiCreated || {
      id: Date.now(),
      poNumber: `PO-2026-0${pos.length + 10}`,
      vendorName: poData.vendorName || 'New Vendor',
      supplierName: poData.vendorName || 'New Vendor',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: poData.expectedDate || '2026-10-15',
      totalAmount: Number(poData.totalAmount || 0),
      status: poData.status || 'PENDING_APPROVAL', // PO Created -> NO Stock Change (Rule 1)
      paymentStatus: 'UNPAID',
      itemsCount: poData.items?.length || 1,
      items: (poData.items || []).map(i => ({ ...i, receivedQuantity: 0 }))
    };

    const filtered = pos.filter(p => p.poNumber?.toUpperCase() !== newPO.poNumber?.toUpperCase());
    filtered.unshift(newPO);
    savePOs(filtered);
    return newPO;
  },

  async updatePurchaseOrder(id, poData) {
    let apiUpdated = null;
    try {
      const response = await apiClient.put(`/purchases/orders/${id}`, poData);
      if (response?.data) apiUpdated = response.data;
    } catch (error) {
      // Offline fallback
    }

    const pos = loadPOs();
    const idx = pos.findIndex(p => p.id === Number(id));
    if (idx !== -1) {
      pos[idx] = {
        ...pos[idx],
        ...(apiUpdated || {}),
        ...poData,
        itemsCount: poData.items?.length || pos[idx].itemsCount || 1,
        totalAmount: Number(poData.totalAmount !== undefined ? poData.totalAmount : pos[idx].totalAmount)
      };
      savePOs(pos);
      return pos[idx];
    }

    if (apiUpdated) return apiUpdated;
    throw new Error('Purchase order not found');
  },

  async approveOrder(poId) {
    try {
      await apiClient.post(`/purchases/orders/${poId}/approve`);
    } catch (error) {
      // Offline fallback
    }

    const pos = loadPOs();
    const po = pos.find(p => p.id === Number(poId));
    if (po) {
      po.status = 'APPROVED';
      savePOs(pos);
      return po;
    }
    throw new Error('Purchase order not found');
  },

  async rejectOrder(poId, reason) {
    try {
      await apiClient.post(`/purchases/orders/${poId}/reject`, { reason });
    } catch (error) {
      // Offline fallback
    }

    const pos = loadPOs();
    const po = pos.find(p => p.id === Number(poId));
    if (po) {
      po.status = 'REJECTED';
      savePOs(pos);
      return po;
    }
    throw new Error('Purchase order not found');
  },

  async cancelOrder(poId, reason) {
    try {
      await apiClient.post(`/purchases/orders/${poId}/cancel`, { reason });
    } catch (error) {
      // Offline fallback
    }

    const pos = loadPOs();
    const po = pos.find(p => p.id === Number(poId));
    if (po) {
      po.status = 'CANCELLED';
      savePOs(pos);
      return po;
    }
    throw new Error('Purchase order not found');
  },

  async updatePOStatus(poId, newStatus) {
    try {
      await apiClient.patch(`/purchases/orders/${poId}/status`, { status: newStatus });
    } catch (error) {
      // Offline fallback
    }

    const pos = loadPOs();
    const po = pos.find(p => p.id === Number(poId));
    if (po) {
      po.status = newStatus;
      savePOs(pos);
      return po;
    }
    throw new Error('Purchase order not found');
  },

  async processGoodsReceipt(grnData) {
    try {
      await apiClient.post('/purchases/grn', grnData);
    } catch (error) {
      // Offline fallback
    }

    const pos = loadPOs();
    const po = pos.find(p => p.id === Number(grnData.purchaseOrderId));

    if (po) {
      grnData.items.forEach(gItem => {
        const item = po.items.find(i => (i.productId || i.id) === gItem.productId);
        if (item) {
          const accepted = Math.max(0, gItem.receivedQuantity - gItem.damagedQuantity);
          item.receivedQuantity = (item.receivedQuantity || 0) + accepted;
        }
      });

      const allFulfilled = po.items.every(i => (i.receivedQuantity || 0) >= (i.quantity || i.orderedQuantity || 0));
      po.status = allFulfilled ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
      savePOs(pos);
      return { success: true, poStatus: po.status };
    }

    return { success: true, poStatus: 'RECEIVED' };
  },

  async deletePurchaseOrder(id) {
    try {
      await apiClient.delete(`/purchases/orders/${id}`);
    } catch (error) {
      // Offline fallback
    }

    const pos = loadPOs();
    const filtered = pos.filter(p => p.id !== Number(id));
    savePOs(filtered);
    return true;
  }
};
