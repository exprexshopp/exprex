// Design: Afrique Moderne — modal auth avec switch login/register et choix de rôle
import React, { useState, useEffect } from 'react';
import { X, User, Store, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';

export function AuthModal() {
  const { authModalState, setAuthModalState, setCurrentUser, bumpData } = useApp();
  const { isOpen, actionReason, initialRole } = authModalState;

  const defaultRole: 'CUSTOMER' | 'SELLER' = initialRole === 'SELLER' ? 'SELLER' : 'CUSTOMER';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'CUSTOMER' | 'SELLER'>(defaultRole);
  const [showPwd, setShowPwd] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', password: '', confirm: '', securityKey: '' });

  useEffect(() => {
    if (!isOpen) return;
    setRole(defaultRole);
    setMode('login');
    setShowPwd(false);
    setShowAdminKey(false);
    setError('');
    setIsLoading(false);
    setForm({ username: '', email: '', first_name: '', last_name: '', password: '', confirm: '', securityKey: '' });
  }, [isOpen, defaultRole]);

  const close = () => {
    setAuthModalState({ isOpen: false });
    setError('');
    setIsLoading(false);
    setForm({ username: '', email: '', first_name: '', last_name: '', password: '', confirm: '', securityKey: '' });
  };

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const user = await db.authenticateUser(
        form.username, 
        form.password, 
        showAdminKey ? form.securityKey : undefined
      );
      setCurrentUser(user);
      bumpData();
      close();
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      
      // Gestion spécifique de la clé de sécurité
      if (message === 'SECURITY_KEY_REQUIRED' || 
          /security key/i.test(message) || 
          /admin access/i.test(message)) {
        setShowAdminKey(true);
        setError('Ce compte nécessite une clé de sécurité admin. Entrez la clé pour confirmer la connexion.');
        return;
      }
      
      // Gestion des erreurs du backend
      if (error?.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError("Identifiants incorrects. Vérifiez le nom d'utilisateur et le mot de passe.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setIsLoading(true);
    
    if (!form.email || !form.username || !form.first_name || !form.last_name || !form.password) {
      setError('Tous les champs sont obligatoires.');
      setIsLoading(false);
      return;
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      setIsLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setIsLoading(false);
      return;
    }
    
    try {
      const user = await db.registerUser({
        email: form.email,
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
        role: role,
      });
      
      if (!user) {
        setError('Cet email ou nom d\'utilisateur est déjà utilisé.');
        return;
      }
      setCurrentUser(user);
      bumpData();
      close();
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      const message = error?.response?.data?.detail || 'Erreur lors de l\'inscription';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-xl font-bold">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h2>
              {actionReason && <p className="text-indigo-200 text-xs mt-0.5">{actionReason}</p>}
            </div>
            <button onClick={close} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          {/* Mode tabs */}
          <div className="flex gap-1 mt-4 bg-white/10 rounded-xl p-1">
            {(['login', 'register'] as const).map(m => (
              <button 
                key={m} 
                onClick={() => { setMode(m); setError(''); setShowAdminKey(false); }} 
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === m ? 'bg-white text-indigo-700' : 'text-white/70 hover:text-white'}`}
              >
                {m === 'login' ? 'Se connecter' : "S'inscrire"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-3">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {mode === 'register' && (
            <>
              {/* Role selector */}
              <div className="grid grid-cols-2 gap-2">
                {([['CUSTOMER', 'Client', User], ['SELLER', 'Vendeur', Store]] as const).map(([r, label, Icon]) => (
                  <button 
                    key={r} 
                    onClick={() => setRole(r)} 
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${role === r ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  value={form.first_name} 
                  onChange={e => setForm(f => ({...f, first_name: e.target.value}))} 
                  placeholder="Prénom" 
                  className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" 
                />
                <input 
                  value={form.last_name} 
                  onChange={e => setForm(f => ({...f, last_name: e.target.value}))} 
                  placeholder="Nom" 
                  className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" 
                />
              </div>
              <input 
                value={form.email} 
                onChange={e => setForm(f => ({...f, email: e.target.value}))} 
                type="email" 
                placeholder="Email" 
                className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" 
              />
            </>
          )}

          <input 
            value={form.username} 
            onChange={e => setForm(f => ({...f, username: e.target.value}))} 
            placeholder={mode === 'login' ? "Nom d'utilisateur ou email" : "Nom d'utilisateur"} 
            className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" 
          />

          <div className="relative">
            <input 
              value={form.password} 
              onChange={e => setForm(f => ({...f, password: e.target.value}))} 
              type={showPwd ? 'text' : 'password'} 
              placeholder="Mot de passe" 
              className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" 
              onKeyDown={e => e.key === 'Enter' && !isLoading && (mode === 'login' ? handleLogin() : handleRegister())} 
            />
            <button 
              type="button" 
              onClick={() => setShowPwd(!showPwd)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {mode === 'login' && showAdminKey && (
            <input 
              value={form.securityKey} 
              onChange={e => setForm(f => ({...f, securityKey: e.target.value}))} 
              placeholder="Clé de sécurité admin" 
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" 
            />
          )}

          {mode === 'register' && (
            <input 
              value={form.confirm} 
              onChange={e => setForm(f => ({...f, confirm: e.target.value}))} 
              type={showPwd ? 'text' : 'password'} 
              placeholder="Confirmer le mot de passe" 
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-300" 
            />
          )}

          <button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-md shadow-indigo-200 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
          </button>

          {mode === 'login' && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-xs text-slate-500">
              <p className="font-semibold mb-1">Astuce d'authentification :</p>
              <p>Utilisez vos identifiants. email/nom d'utilisateur & mot de passe</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
