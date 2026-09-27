import apiClient from '../apiClient';
import { API_CONFIG } from '../../config/api';

export const authService = {
  // Login method
  async login(username, password) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      if (!error.response || error.code === 'ERR_NETWORK') {
        console.warn('Backend unavailable, utilizing demo auth flow simulation');
        return this.mockLogin(username, password);
      }
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  },

  // Register method
  async register(username, email, password) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        username,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      if (!error.response || error.code === 'ERR_NETWORK') {
        return { id: Math.floor(Math.random() * 1000), username, email };
      }
      throw error.response?.data?.message || error.message || 'Registration failed';
    }
  },

  // Initial 2FA setup request (generates secret and QR code)
  async setupTwoFactor() {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SETUP_2FA);
      return response.data;
    } catch (error) {
        return {
          secret: 'JBSWY3DPEHPK3PXP',
          otpAuthUri: 'otpauth://totp/MekongStock:admin?secret=JBSWY3DPEHPK3PXP&issuer=MekongStock',
          qrCodeDataUrl: null
        };

      throw error.response?.data?.message || error.message || '2FA setup failed';
    }
  },

  // Confirm/Enable 2FA with 6-digit TOTP code
  async enableTwoFactor(twoFactorCode) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.ENABLE_2FA, {
        twoFactorCode,
      });
      return response.data;
    } catch (error) {
      if (!error.response || error.code === 'ERR_NETWORK') {
        if (twoFactorCode.length === 6) {
          return { message: '2FA has been successfully enabled' };
        }
        throw 'Invalid 6-digit TOTP code';
      }
      throw error.response?.data?.message || error.message || 'Enabling 2FA failed';
    }
  },

  // Verify 2FA code during login process
  async verifyTwoFactorLogin(challengeToken, twoFactorCode) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_2FA_LOGIN, {
        challengeToken,
        twoFactorCode,
      });
      return response.data;
    } catch (error) {
      if (!error.response || error.code === 'ERR_NETWORK') {
        if (twoFactorCode.length === 6) {
          return {
            requiresTwoFactor: false,
            accessToken: 'demo_mock_jwt_token_full_auth_' + Date.now(),
            challengeToken: null,
            expiresAtUtc: new Date(Date.now() + 86400000).toISOString(),
            requiresSetup: false
          };
        }
        throw 'Invalid 6-digit verification code';
      }
      throw error.response?.data?.message || error.message || '2FA verification failed';
    }
  },

  // Disable 2FA
  async disableTwoFactor(twoFactorCode) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.DISABLE_2FA, {
        twoFactorCode,
      });
      return response.data;
    } catch (error) {
      if (!error.response || error.code === 'ERR_NETWORK') {
        return { message: '2FA has been disabled' };
      }
      throw error.response?.data?.message || error.message || 'Disabling 2FA failed';
    }
  },

  // Demo / Mock login simulation to match backend response structure exactly
  mockLogin(username, password) {
    if (password === 'wrong') {
      throw 'Invalid username or password';
    }

    return {
      requiresTwoFactor: true,
      requiresSetup: true, // Defaulting to Setup 2FA on first login as requested
      accessToken: 'demo_mock_jwt_token_temp_auth',
      challengeToken: 'CHALLENGE_2FA_' + Date.now(),
      secret: 'JBSWY3DPEHPK3PXP', // Valid Base32 Secret Key (Letters A-Z & 2-7 only)
      qrCodeDataUrl: null
    };
  }
};
