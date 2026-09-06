// Design: Afrique Moderne — portail admin style Django
import React, { useState } from 'react';
import { X, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';

export function DjangoAdminAuthModal() {
  const { isDjangoAdminAuthOpen, setIsDjangoAdminAuthOpen, handleAuthenticateStaff } = useApp();
  const [username, setUsername] = useState('ghens');
  const [password, setPassword] = useState('ghens.0#');
  const [securityKey, setSecurityKey] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  if (!isDjangoAdminAuthOpen) return null;

  const handleLogin = () => {
    setError('');
    const user = db.authenticateUser(username, password, securityKey);
    if (!user) { setError('Identifiants incorrects, clé de sécurité invalide ou accès non autorisé.'); return; }
    handleAuthenticateStaff(user);
    setIsDjangoAdminAuthOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsDjangoAdminAuthOpen(false)} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-white font-bold">Django Administration</p>
              <p className="text-slate-400 text-xs">/admin/login/</p>
            </div>
          </div>
          <button onClick={() => setIsDjangoAdminAuthOpen(false)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {/* <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-xs text-slate-500">
            <p className="font-semibold mb-1">Identifiants staff :</p>
            <p>Username : <code className="bg-white dark:bg-slate-700 px-1 rounded font-mono">ghens</code></p>
            <p>Password : <code className="bg-white dark:bg-slate-700 px-1 rounded font-mono">ghens.0#</code></p>
          </div> */}
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" />
          <div className="relative">
            <input value={password} onChange={e => setPassword(e.target.value)} type={showPwd ? 'text' : 'password'} placeholder="Password" className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input value={securityKey} onChange={e => setSecurityKey(e.target.value)} placeholder="Clé de sécurité" className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" />
          <button onClick={handleLogin} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all active:scale-95">
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}

