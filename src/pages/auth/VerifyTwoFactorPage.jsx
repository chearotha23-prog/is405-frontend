import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, LogOut, KeyRound, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const VerifyTwoFactorPage = () => {
  const { verify2FA, loading, error, setError, logout, pendingTwoFactor } = useAuth();
  const [totpCode, setTotpCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totpCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit 2FA code.');
      return;
    }
    try {
      await verify2FA(totpCode.trim());
    } catch (err) {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-800/80 z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#714B67] to-[#8A5C7E] p-6 text-white text-center relative">
          <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-2 backdrop-blur-md border border-white/20 shadow-md">
            <ShieldCheck className="w-7 h-7 text-emerald-300" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Two-Factor Authentication</h1>
          <p className="text-purple-200 text-xs mt-1">
            Enter the 6-digit code from your authenticator app
          </p>

          <button
            onClick={logout}
            className="absolute top-5 right-5 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User Account Info */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Authenticating account:</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center text-[10px] border border-purple-500/30">
                {(pendingTwoFactor?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-slate-200">{pendingTwoFactor?.username || 'Admin'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                Security Passcode (TOTP):
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-[0.4em] font-bold py-3.5 bg-slate-950/80 border border-purple-500/40 rounded-2xl text-white focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner"
              />
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
                  <span>Verifying...</span>
                </span>
              ) : (
                <>
                  <span>Verify & Enter System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/60 px-6 py-3.5 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          Mekong Stock Authentication Gateway • TOTP Enforced
        </div>
      </div>
    </div>
  );
};
