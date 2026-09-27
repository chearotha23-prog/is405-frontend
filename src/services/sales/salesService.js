import apiClient from '../apiClient';

const INITIAL_SALES = [
  {
    id: 1,
    soNumber: 'SO-2026-088',
    customerName: 'Angkor Tech Solutions Co., Ltd',
    orderDate: '2026-09-24',
    deliveryDate: '2026-09-26',
    totalAmount: 5995.00,
    status: 'DELIVERED', // QUOTATION | SENT | SALES_ORDER | DELIVERED | INVOICED
    paymentStatus: 'PAID',
    itemsCount: 1,
    items: [
      { itemName: 'iPhone 15 Pro Max 256GB', quantity: 5, unitPrice: 1199.00, total: 5995.00 }
    ]
  },
  {
    id: 2,
    soNumber: 'SO-2026-089',
    customerName: 'Sokha International Hotel',
    orderDate: '2026-09-25',
    deliveryDate: '2026-09-29',
    totalAmount: 14994.00,
    status: 'SALES_ORDER',
    paymentStatus: 'PARTIAL',
    itemsCount: 2,
    items: [
      { itemName: 'MacBook Pro M3 Max 16"', quantity: 6, unitPrice: 2499.00, total: 14994.00 }
    ]
  },
  {
    id: 3,
    soNumber: 'SO-2026-090',
    customerName: 'Borey Vimean Phnom Penh',
    orderDate: '2026-09-26',
    deliveryDate: '2026-10-02',
    totalAmount: 2598.00,
    status: 'QUOTATION',
    paymentStatus: 'UNPAID',
    itemsCount: 1,
    items: [
      { itemName: 'Samsung Galaxy S24 Ultra', quantity: 2, unitPrice: 1299.00, total: 2598.00 }
    ]
  }
];

const STORAGE_KEY = 'is405_local_sales_orders';

function loadSales() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(e);
  }
  return [...INITIAL_SALES];
}

function saveSales(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn(e);
  }
}

function mergeSales(localList, apiList) {
  if (!Array.isArray(apiList) || apiList.length === 0) return localList;
  if (!Array.isArray(localList) || localList.length === 0) return apiList;

  const apiIds = new Set(apiList.map(s => s.id));
  const apiNumbers = new Set(apiList.map(s => (s.soNumber || s.invoiceNumber)?.toUpperCase()));

  const merged = [...apiList];
  for (const localSO of localList) {
    const numUpper = (localSO.soNumber || localSO.invoiceNumber)?.toUpperCase();
    if (!apiIds.has(localSO.id) && !apiNumbers.has(numUpper)) {
      merged.push(localSO);
    }
  }
  return merged;
}

export const salesService = {
  async getSalesOrders(params = {}) {
    const localSales = loadSales();
    try {
      const response = await apiClient.get('/sales/orders', { params });
      const apiOrders = response?.data?.items || response?.data;
      if (Array.isArray(apiOrders) && apiOrders.length > 0) {
        const merged = mergeSales(localSales, apiOrders);
        saveSales(merged);

        let filtered = merged;
        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(so =>
            (so.soNumber || so.invoiceNumber)?.toLowerCase().includes(s) ||
            so.customerName?.toLowerCase().includes(s)
          );
        }
        if (params.status && params.status !== 'ALL') {
          filtered = filtered.filter(so => so.status === params.status);
        }
        return filtered;
      }
    } catch (error) {
      // Fallback
    }

    let orders = localSales;
    if (params.search) {
      const s = params.search.toLowerCase();
      orders = orders.filter(so =>
        (so.soNumber || so.invoiceNumber)?.toLowerCase().includes(s) ||
        so.customerName?.toLowerCase().includes(s)
      );
    }
    if (params.status && params.status !== 'ALL') {
      orders = orders.filter(so => so.status === params.status);
    }
    return orders;
  },

  async getSalesOrder(id) {
    try {
      const response = await apiClient.get(`/sales/orders/${id}`);
      if (response?.data) return response.data;
    } catch (error) {
      // Fallback
    }
    const orders = loadSales();
    return orders.find(s => s.id === Number(id)) || null;
  },

  async createSalesOrder(soData) {
    let apiCreated = null;
    try {
      const response = await apiClient.post('/sales/orders', soData);
      if (response?.data) apiCreated = response.data;
    } catch (error) {
      // Offline fallback
    }

    const orders = loadSales();
    const newSO = apiCreated || {
      id: Date.now(),
      soNumber: `SO-2026-0${orders.length + 91}`,
      customerName: soData.customerName || 'Customer',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: soData.deliveryDate || '2026-10-10',
      totalAmount: Number(soData.totalAmount || 0),
      status: soData.status || 'QUOTATION',
      paymentStatus: 'UNPAID',
      itemsCount: soData.items?.length || 1,
      items: soData.items || []
    };

    const filtered = orders.filter(s => (s.soNumber || s.invoiceNumber)?.toUpperCase() !== (newSO.soNumber || newSO.invoiceNumber)?.toUpperCase());
    filtered.unshift(newSO);
    saveSales(filtered);
    return newSO;
  },

  async updateSalesOrder(id, soData) {
    let apiUpdated = null;
    try {
      const response = await apiClient.put(`/sales/orders/${id}`, soData);
      if (response?.data) apiUpdated = response.data;
    } catch (error) {
      // Offline fallback
    }

    const orders = loadSales();
    const idx = orders.findIndex(s => s.id === Number(id));
    if (idx !== -1) {
      orders[idx] = {
        ...orders[idx],
        ...(apiUpdated || {}),
        ...soData,
        itemsCount: soData.items?.length || orders[idx].itemsCount || 1,
        totalAmount: Number(soData.totalAmount !== undefined ? soData.totalAmount : orders[idx].totalAmount)
      };
      saveSales(orders);
      return orders[idx];
    }

    if (apiUpdated) return apiUpdated;
    throw new Error('Sales order not found');
  },

  async updateSalesStatus(soId, newStatus) {
    try {
      await apiClient.patch(`/sales/orders/${soId}/status`, { status: newStatus });
    } catch (error) {
      // Offline fallback
    }

    const orders = loadSales();
    const so = orders.find(s => s.id === Number(soId));
    if (so) {
      so.status = newStatus;
      saveSales(orders);
      return so;
    }
    throw new Error('Sales order not found');
  },

  async deleteSalesOrder(id) {
    try {
      await apiClient.delete(`/sales/orders/${id}`);
    } catch (error) {
      // Offline fallback
    }

    const orders = loadSales();
    const filtered = orders.filter(s => s.id !== Number(id));
    saveSales(filtered);
    return true;
  }
};
