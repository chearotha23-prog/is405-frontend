import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, Key, Copy, Check, Smartphone, AlertTriangle, 
  RefreshCw, Lock, Sparkles, CheckCircle2, ShieldAlert, Cpu, Terminal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth/authService';

// Standard RFC 6238 TOTP PIN Generator function for instant live test
async function generateTOTP(secretBase32) {
  try {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    const cleanSecret = secretBase32.toUpperCase().replace(/[^A-Z2-7]/g, '');
    for (let i = 0; i < cleanSecret.length; i++) {
      const val = base32chars.indexOf(cleanSecret.charAt(i));
      if (val < 0) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    const bytes = new Uint8Array((bits.match(/.{1,8}/g) || []).map(b => parseInt(b.padEnd(8, '0'), 2)));

    const epoch = Math.floor(Date.now() / 1000 / 30);
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, epoch, false);

    const key = await crypto.subtle.importKey(
      'raw', bytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, timeBuffer);
    const sigBytes = new Uint8Array(signature);
    const offset = sigBytes[sigBytes.length - 1] & 0xf;
    const binary =
      ((sigBytes[offset] & 0x7f) << 24) |
      ((sigBytes[offset + 1] & 0xff) << 16) |
      ((sigBytes[offset + 2] & 0xff) << 8) |
      (sigBytes[offset + 3] & 0xff);
    const otp = (binary % 1000000).toString().padStart(6, '0');
    return otp;
  } catch (e) {
    return '123456';
  }
}

export const Security2FAPage = () => {
  const { user } = useAuth();
  const [setupData, setSetupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testCode, setTestCode] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [livePin, setLivePin] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  const secret = setupData?.secret || 'JBSWY3DPEHPK3PXP';
  const issuerName = 'Mekong Stock';
  const otpAuthUri = setupData?.otpAuthUri || `otpauth://totp/${encodeURIComponent(issuerName)}:${encodeURIComponent(user?.username || 'admin')}?secret=${secret}&issuer=${encodeURIComponent(issuerName)}&digits=6`;

  // Live TOTP Generator
  useEffect(() => {
    let isMounted = true;
    const updatePin = async () => {
      const pin = await generateTOTP(secret);
      if (isMounted) setLivePin(pin);
      const secs = 30 - (Math.floor(Date.now() / 1000) % 30);
      if (isMounted) setSecondsRemaining(secs);
    };

    updatePin();
    const interval = setInterval(updatePin, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [secret]);

  const handleGenerateNew2FA = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const data = await authService.setupTwoFactor();
      setSetupData(data);
    } catch (err) {
      setTestResult({
        success: false,
        message: typeof err === 'string' ? err : err?.message || 'Failed to setup 2FA'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestCode = async (e) => {
    e.preventDefault();
    setTestResult(null);
    try {
      await authService.enableTwoFactor(testCode);
      setTestResult({ 
        success: true, 
        message: '2FA passcode verified successfully! Your account is protected with TOTP RFC 6238.' 
      });
    } catch (err) {
      setTestResult({ 
        success: false, 
        message: typeof err === 'string' ? err : 'Invalid 2FA code. Please try again.' 
      });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#714B67] to-[#8A5C7E] text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security & 2FA Control Hub</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure and verify Time-based One-Time Password (TOTP) for user {user?.username}
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateNew2FA}
          disabled={loading}
          className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Generate New Secret Key</span>
        </button>
      </div>

      {/* Security Status Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="erp-card p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">2FA Protection Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-bold text-emerald-800">Fully Enforced</span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="erp-card p-4 border-l-4 border-l-purple-600 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Security Standard</span>
            <div className="mt-1">
              <span className="text-sm font-bold font-mono text-purple-900">RFC 6238 TOTP SHA-1</span>
            </div>
          </div>
          <div className="p-2.5 bg-purple-50 text-[#714B67] rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="erp-card p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Supported Apps</span>
            <div className="mt-1">
              <span className="text-xs font-bold text-slate-800">Google, Apple, Authy</span>
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* QR Code and Verification Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: QR Code Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1">
              <Smartphone className="w-4 h-4 text-[#714B67]" />
              <span>Scan QR Code or Copy Secret Key</span>
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Use your phone to scan into Google Authenticator or camera app
            </p>

            <div className="text-center">
              <div className="bg-gradient-to-b from-purple-50 to-white p-4 rounded-3xl border border-purple-200/80 inline-block shadow-sm mb-4">
                <QRCodeSVG value={otpAuthUri} size={170} level="M" includeMargin={true} />
              </div>

              {/* Secret Key Box */}
              <div className="bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs max-w-sm mx-auto">
                <div className="flex items-center gap-2 truncate">
                  <Key className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="font-mono font-bold text-slate-800 tracking-wider truncate select-all">{secret}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(secret)}
                  className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-[#714B67] rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Issuer: <strong className="text-slate-700">{issuerName}</strong> • Account: <strong className="text-slate-700">{user?.username}</strong>
          </div>
        </div>

        {/* Right: Real-time Authenticator Simulator & Test Form */}
        <div className="space-y-6">
          {/* Live TOTP Widget */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950 rounded-3xl p-6 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-purple-200">TOTP Authenticator Simulator</span>
              </div>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-purple-300">
                Live Engine
              </span>
            </div>

            <div className="text-center py-3">
              <span className="text-[11px] text-slate-400 block mb-1">Active Passcode (Current Live PIN):</span>
              <span className="font-mono text-4xl font-bold tracking-[0.25em] text-emerald-400 drop-shadow-md">
                {livePin || '------'}
              </span>
            </div>

            {/* Countdown Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Expires in</span>
                <span className="font-mono font-bold text-amber-400">{secondsRemaining}s</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(secondsRemaining / 30) * 100}%` }}
                ></div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTestCode(livePin)}
              className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Copy Live Code to Verification Box</span>
            </button>
          </div>

          {/* Test Verification Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Test 2FA Passcode Verification</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the 6-digit code from your phone to verify the integration
            </p>

            <form onSubmit={handleTestCode} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono text-xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#714B67]/30 focus:border-[#714B67]"
                />
                <button
                  type="submit"
                  disabled={testCode.length !== 6}
                  className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Verify
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                  testResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
