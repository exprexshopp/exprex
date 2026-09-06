// Design: Afrique Moderne — modal paramètres plateforme avec thème, rôle, reset
import React from 'react';
import { X, Sun, Moon, Monitor, RefreshCw, LogOut, Shield, User, Info } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function PlatformSettingsModal() {
  const { isSettingsModalOpen, setIsSettingsModalOpen, currentUser, themeMode, setThemeMode, handleLogout, handleResetData, setIsDjangoAdminAuthOpen, handleOpenAuthModal } = useApp();
  const isAdmin = currentUser?.role === 'ADMIN';

  if (!isSettingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsModalOpen(false)} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-5 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Paramètres</h2>
          <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {/* Theme */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Thème</p>
            <div className="flex gap-2">
              {([['light', 'Clair', Sun], ['dark', 'Sombre', Moon], ['system', 'Système', Monitor]] as const).map(([m, label, Icon]) => (
                <button key={m} onClick={() => setThemeMode(m)} className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${themeMode === m ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User info */}
          {currentUser && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Compte</p>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-3">
                <p className="font-semibold text-slate-900 dark:text-white">{currentUser.first_name} {currentUser.last_name}</p>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full mt-1 inline-block">{currentUser.role}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {isAdmin && (
              <button onClick={() => { setIsDjangoAdminAuthOpen(true); setIsSettingsModalOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors">
                <Shield className="w-4 h-4 text-red-500" /> Accès Admin (Django)
              </button>
            )}
            {isAdmin && (
              <button onClick={() => { handleResetData(); setIsSettingsModalOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors">
                <RefreshCw className="w-4 h-4" /> Réinitialiser les données
              </button>
            )}
            {currentUser ? (
              <button onClick={() => { handleLogout(); setIsSettingsModalOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors">
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            ) : (
              <button onClick={() => { handleOpenAuthModal(); setIsSettingsModalOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors">
                <User className="w-4 h-4" /> Se connecter
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span className="inline-flex items-left">eXpress Shop - marketplace Cameroon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
