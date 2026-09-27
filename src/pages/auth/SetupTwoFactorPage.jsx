import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, Copy, Check, ArrowRight, Smartphone, AlertTriangle, 
  Key, LogOut, Sparkles, RefreshCw, Lock, Shield, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Standard RFC 6238 TOTP HMAC-SHA1 PIN Generator function
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

export const SetupTwoFactorPage = () => {
  const { pendingTwoFactor, confirm2FA, loading, error, setError, logout } = useAuth();
  const [totpCode, setTotpCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [livePin, setLivePin] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  const secret = pendingTwoFactor?.secret || 'JBSWY3DPEHPK3PXP';
  const username = pendingTwoFactor?.username || 'admin';
  const issuerName = 'MekongStock';

  // Standard TOTP URI formatting for iPhone & Android Google Authenticator compatibility
  const otpAuthUri = `otpauth://totp/${issuerName}:${username}?secret=${secret}&issuer=${issuerName}`;

  // Live TOTP Generator ticker
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

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoFillLivePin = () => {
    if (livePin) {
      setTotpCode(livePin);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totpCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit 2FA code.');
      return;
    }
    try {
      await confirm2FA(totpCode.trim());
    } catch (err) {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-800/80 z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#714B67] to-[#8A5C7E] p-6 text-white text-center relative">
          <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-2 backdrop-blur-md border border-white/20 shadow-md">
            <ShieldCheck className="w-7 h-7 text-emerald-300" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Mekong Stock — 2FA Onboarding</h1>
          <p className="text-purple-200 text-xs mt-1">
            Scan the QR code with Google Authenticator or camera app
          </p>

          <button
            onClick={logout}
            className="absolute top-5 right-5 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1 & 2 Container */}
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#714B67] text-white flex items-center justify-center text-[10px]">1</span>
                <span>Scan QR Code with Authenticator App</span>
              </span>
              <span className="text-[10px] text-purple-300 font-mono">User: {username}</span>
            </div>

            <div className="text-center pt-2">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-300 inline-block shadow-lg mb-3">
                <QRCodeSVG value={otpAuthUri} size={165} level="M" includeMargin={true} />
              </div>

              {/* Secret Key Box */}
              <div className="bg-slate-900/90 px-3.5 py-2.5 rounded-xl border border-slate-700/80 flex items-center justify-between gap-2 max-w-sm mx-auto shadow-inner">
                <div className="flex items-center gap-2 truncate">
                  <Key className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-mono text-xs font-bold text-slate-200 tracking-wider select-all truncate">
                    {secret}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Secret'}</span>
                </button>
              </div>
            </div>

            {/* Live PIN Helper Simulator */}
            {livePin && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between px-4 max-w-sm mx-auto">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <div>
                    <span className="text-[10px] text-emerald-400 font-semibold block">Live 2FA PIN (Simulator):</span>
                    <span className="font-mono font-bold text-base text-emerald-300 tracking-widest">{livePin}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">{secondsRemaining}s</span>
                  <button
                    type="button"
                    onClick={handleAutoFillLivePin}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Use Code
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Verification Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                Enter 6-digit code from your authenticator:
              </label>
              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-mono tracking-[0.4em] font-bold py-3.5 bg-slate-950/80 border border-purple-500/40 rounded-2xl text-white focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                totpCode.length === 6
                  ? 'btn-primary active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Verifying and enabling 2FA...</span>
                </span>
              ) : (
                <>
                  <span>Confirm & Enter System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/60 px-6 py-3.5 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          Mekong Stock Microservices Security Gateway • RFC 6238 TOTP Verified
        </div>
      </div>
    </div>
  );
};
