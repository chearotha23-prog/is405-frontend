// Service layer for Admin Control & System Settings

const DEFAULT_SETTINGS = {
  // Company & General ERP
  companyName: 'Mekong Stock Enterprise Co., Ltd.',
  currencySymbol: '$',
  currencyCode: 'USD',
  defaultLanguage: 'km',
  vatRatePercentage: 10,
  defaultWarehouseLocation: 'Main Warehouse - Phnom Penh',

  // Security & 2FA Enforcement
  enforce2FAAllUsers: true,
  allow2FADisable: false,
  sessionTimeoutMinutes: 60,
  maxFailedLoginAttempts: 5,
  lockoutDurationMinutes: 15,

  // Microservices Connection Config
  mockModeEnabled: false,
  apiBaseUrl: 'http://localhost:5000/api',
  stockMicroserviceUrl: 'http://localhost:5000/api/stock',
  authMicroserviceUrl: 'http://localhost:5000/api/auth',
  purchaseMicroserviceUrl: 'http://localhost:5000/api/purchase',
  salesMicroserviceUrl: 'http://localhost:5000/api/sales',
};

const MOCK_AUDIT_LOGS = [
  {
    id: 1,
    timestamp: '2026-09-27 13:30:15',
    actor: 'admin',
    action: '2FA_SETUP_COMPLETED',
    ipAddress: '192.168.1.45',
    details: 'User admin completed initial 2FA TOTP setup'
  },
  {
    id: 2,
    timestamp: '2026-09-27 13:25:00',
    actor: 'admin',
    action: 'STOCK_ADJUSTMENT',
    ipAddress: '192.168.1.45',
    details: 'Adjusted stock quantity for SKU STK-APP-001 (+10 units)'
  },
  {
    id: 3,
    timestamp: '2026-09-27 12:10:22',
    actor: 'sothea_stock',
    action: 'PO_CREATED',
    ipAddress: '192.168.1.88',
    details: 'Created Purchase Order PO-2026-003 ($4,950.00)'
  },
  {
    id: 4,
    timestamp: '2026-09-27 11:05:40',
    actor: 'rotha_user',
    action: 'LOGIN_SUCCESS',
    ipAddress: '192.168.1.102',
    details: 'Verified 2FA login challenge successfully'
  }
];

export const settingsService = {
  getSettings() {
    const saved = localStorage.getItem('is405_system_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  },

  saveSettings(newSettings) {
    localStorage.setItem('is405_system_settings', JSON.stringify(newSettings));
    return newSettings;
  },

  getAuditLogs() {
    return MOCK_AUDIT_LOGS;
  }
};
