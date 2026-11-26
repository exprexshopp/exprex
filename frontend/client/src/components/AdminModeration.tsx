// Design: Afrique Moderne — console admin avec onglets modération/utilisateurs/logs
import React, { useState, useMemo, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Users, FileText, Store, AlertTriangle, Clock, Search, Plus, Edit2, Trash2, MapPinned, Layers3, Tag } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/db';
import { formatDate } from '../lib/format';
import { UserRole } from '../types';
import { logger } from "../lib/logger";


type Tab = 'shops' | 'users' | 'logs' | 'categories' | 'cities';

export function AdminModeration() {
  const { currentUser, bumpData, dataVersion } = useApp();
  const [tab, setTab] = useState<Tab>('shops');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | ''>('');
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newUserForm, setNewUserForm] = useState({ isOpen: false, email: '', username: '', first_name: '', last_name: '', role: 'CUSTOMER' as UserRole, password: 'password123' });
  const [categoryForm, setCategoryForm] = useState({ isOpen: false, id: '', name: '', slug: '', is_active: true });
  const [subcategoryForm, setSubcategoryForm] = useState({ isOpen: false, id: '', category_id: '', category_name: '', name: '', slug: '', is_active: true });
  const [cityForm, setCityForm] = useState({ isOpen: false, id: '', name: '', is_active: true });
  const [loading, setLoading] = useState(false);

  // Chargement des données
  const [shops, setShops] = useState<any[]>([]);
  const [pendingShops, setPendingShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopsData, usersData, logsData, categoriesData, subcategoriesData, citiesData] = await Promise.all([
        db.getAdminShops(),
        db.getUsers(),
        db.getModerationLogs(),
        db.getAdminCategories(),
        db.getAdminSubcategories(),
        db.getAdminCities(),
      ]);
      setShops(shopsData || []);
      setUsers(usersData || []);
      setLogs(logsData || []);
      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
      setCities(citiesData || []);
    } catch (error) {
      logger.error('Erreur chargement données admin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dataVersion]);

  useEffect(() => {
    setPendingShops(shops.filter(s => s.status === 'PENDING'));
  }, [shops]);

  const filteredUsers = useMemo(() => users.filter(u => {
    const matchSearch = !userSearch || u.username?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = !userRoleFilter || u.role === userRoleFilter;
    return matchSearch && matchRole;
  }), [users, userSearch, userRoleFilter]);

  if (!currentUser || (currentUser.role !== 'ADMIN' && !currentUser.is_staff)) return null;

  const handleApprove = async (shopId: string) => {
    try {
      await db.approveShop(shopId, currentUser.email, 'Boutique validée par admin.');
      
      if (rejectingId === shopId) {
        setRejectingId(null);
        setRejectReason('');
      }
      
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur lors de l\'approbation de la boutique :', error);
    }
  };

  const handleReject = async (shopId: string) => {
    if (!rejectReason.trim()) return;
    
    try {
      await db.rejectShop(shopId, currentUser.email, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur lors du rejet de la boutique :', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser.id) return;
    try {
      await db.deleteUser(id);
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur suppression utilisateur:', error);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser || !editingUser.id) return;
    try {
      await db.updateUser(editingUser.id, {
        email: editingUser.email,
        username: editingUser.username,
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        role: editingUser.role,
        gender: editingUser.gender,
        password: editingUser.password || undefined,
        is_staff: editingUser.role === 'ADMIN' || editingUser.is_staff,
      });
      setEditingUser(null);
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur sauvegarde utilisateur:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.username) return;
    try {
      await db.createUser(newUserForm);
      setNewUserForm({ isOpen: false, email: '', username: '', first_name: '', last_name: '', role: 'CUSTOMER', password: 'password123' });
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur création utilisateur:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) return;
    try {
      await db.createCategory({ name: categoryForm.name, slug: categoryForm.slug, is_active: categoryForm.is_active });
      setCategoryForm({ isOpen: false, id: '', name: '', slug: '', is_active: true });
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur création catégorie:', error);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.id) return;
    try {
      await db.updateCategory(categoryForm.id, { name: categoryForm.name, slug: categoryForm.slug, is_active: categoryForm.is_active });
      setCategoryForm({ isOpen: false, id: '', name: '', slug: '', is_active: true });
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur mise à jour catégorie:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await db.deleteCategory(id);
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur suppression catégorie:', error);
    }
  };

  const handleCreateSubcategory = async () => {
    if (!subcategoryForm.category_id || !subcategoryForm.name.trim() || !subcategoryForm.slug.trim()) return;
    try {
      await db.createSubcategory({
        category_id: subcategoryForm.category_id,
        category_name: subcategoryForm.category_name,
        name: subcategoryForm.name,
        slug: subcategoryForm.slug,
        is_active: subcategoryForm.is_active,
      });
      setSubcategoryForm({ isOpen: false, id: '', category_id: '', category_name: '', name: '', slug: '', is_active: true });
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur création sous-catégorie:', error);
    }
  };

  const handleSaveSubcategory = async () => {
    if (!subcategoryForm.id) return;
    try {
      await db.updateSubcategory(subcategoryForm.id, {
        category_id: subcategoryForm.category_id,
        category_name: subcategoryForm.category_name,
        name: subcategoryForm.name,
        slug: subcategoryForm.slug,
        is_active: subcategoryForm.is_active,
      });
      setSubcategoryForm({ isOpen: false, id: '', category_id: '', category_name: '', name: '', slug: '', is_active: true });
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur mise à jour sous-catégorie:', error);
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    try {
      await db.deleteSubcategory(id);
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur suppression sous-catégorie:', error);
    }
  };

  const handleCreateCity = async () => {
    if (!cityForm.name.trim()) return;
    try {
      await db.createCity({ name: cityForm.name, is_active: cityForm.is_active });
      setCityForm({ isOpen: false, id: '', name: '', is_active: true });
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur création ville:', error);
    }
  };

  const handleSaveCity = async () => {
    if (!cityForm.id) return;
    try {
      await db.updateCity(cityForm.id, { name: cityForm.name, is_active: cityForm.is_active });
      setCityForm({ isOpen: false, id: '', name: '', is_active: true });
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur mise à jour ville:', error);
    }
  };

  const handleDeleteCity = async (id: string) => {
    try {
      await db.deleteCity(id);
      await loadData();
      bumpData();
    } catch (error) {
      logger.error('Erreur suppression ville:', error);
    }
  };

  const statusBadge = (status: string) => {
    const cfg: Record<string, string> = { 
      ACTIVE: 'bg-green-100 text-green-700', 
      PENDING: 'bg-amber-100 text-amber-700', 
      REJECTED: 'bg-red-100 text-red-700', 
      DRAFT: 'bg-slate-100 text-slate-600' 
    };
    const labels: Record<string, string> = { 
      ACTIVE: 'Active', 
      PENDING: 'En attente', 
      REJECTED: 'Rejetée', 
      DRAFT: 'Brouillon' 
    };
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg[status] || ''}`}>{labels[status] || status}</span>;
  };

  const roleBadge = (role: UserRole) => {
    const cfg: Record<UserRole, string> = { 
      ADMIN: 'bg-red-100 text-red-700', 
      SELLER: 'bg-indigo-100 text-indigo-700', 
      CUSTOMER: 'bg-slate-100 text-slate-600' 
    };
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg[role]}`}>{role}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-red-400" />
          <h1 className="text-2xl font-bold">Console Admin</h1>
        </div>
        <p className="text-slate-300 text-sm">{currentUser.email}</p>
        {pendingShops.length > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm font-medium">{pendingShops.length} boutique{pendingShops.length > 1 ? 's' : ''} en attente de validation</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex-wrap">
        {([['shops', 'Boutiques', Store], ['users', 'Utilisateurs', Users], ['logs', 'Journal', FileText], ['categories', 'Catégories', Tag], ['cities', 'Villes', MapPinned]] as const).map(([t, label, Icon]) => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Icon className="w-4 h-4" /> {label}
            {t === 'shops' && pendingShops.length > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{pendingShops.length}</span>}
          </button>
        ))}
      </div>

      {/* SHOPS TAB */}
      {tab === 'shops' && (
        <div className="space-y-3">
          {pendingShops.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> En attente ({pendingShops.length})</h2>
              {pendingShops.map(shop => (
                <div key={shop.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{shop.name}</p>
                      <p className="text-xs text-slate-500">{shop.city} · {shop.owner_email}</p>
                    </div>
                    {statusBadge(shop.status)}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{shop.description}</p>
                  {rejectingId === shop.id ? (
                    <div className="space-y-2">
                      <textarea 
                        value={rejectReason} 
                        onChange={e => setRejectReason(e.target.value)} 
                        placeholder="Raison du rejet..." 
                        rows={2} 
                        className="w-full px-3 py-2 text-sm border border-red-200 rounded-xl bg-red-50 focus:outline-none resize-none" 
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleReject(shop.id)} 
                          disabled={!rejectReason.trim()} 
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-200 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                          Confirmer le rejet
                        </button>
                        <button 
                          onClick={() => { setRejectingId(null); setRejectReason(''); }} 
                          className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(shop.id)} 
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
                      >
                        <CheckCircle className="w-4 h-4" /> Approuver
                      </button>
                      <button 
                        onClick={() => setRejectingId(shop.id)} 
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-all"
                      >
                        <XCircle className="w-4 h-4" /> Rejeter
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Toutes les boutiques ({shops.length})</h2>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-700">
              {shops.map(shop => (
                <div key={shop.id} className="p-4 border-b border-slate-100 dark:border-slate-700 last:border-none">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      {shop.logo ? <img src={shop.logo} alt={shop.name} className="w-10 h-10 rounded-xl object-cover shrink-0" /> : <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0"><Store className="w-5 h-5 text-slate-400" /></div>}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{shop.name}</p>
                        <p className="text-xs text-slate-500">{shop.city}</p>
                        {shop.status === 'REJECTED' && shop.rejection_reason && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">Motif du rejet : {shop.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      {statusBadge(shop.status)}
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleApprove(shop.id)} className="px-3 py-2 text-xs font-semibold rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors">
                          Approuver
                        </button>
                        {rejectingId === shop.id ? (
                          <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                            Annuler
                          </button>
                        ) : (
                          <button onClick={() => setRejectingId(shop.id)} className="px-3 py-2 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                            Rejeter
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {rejectingId === shop.id && (
                    <div className="mt-3 space-y-2">
                      <textarea 
                        value={rejectReason} 
                        onChange={e => setRejectReason(e.target.value)} 
                        placeholder="Raison du rejet..." 
                        rows={2} 
                        className="w-full px-3 py-2 text-sm border border-red-200 rounded-xl bg-red-50 focus:outline-none resize-none" 
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleReject(shop.id)} 
                          disabled={!rejectReason.trim()} 
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-200 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                          Confirmer le rejet
                        </button>
                        <button 
                          onClick={() => { setRejectingId(null); setRejectReason(''); }} 
                          className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-200 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={userSearch} 
                onChange={e => setUserSearch(e.target.value)} 
                placeholder="Rechercher..." 
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-300" 
              />
            </div>
            <select 
              value={userRoleFilter} 
              onChange={e => setUserRoleFilter(e.target.value as any)} 
              className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none"
            >
              <option value="">Tous</option>
              <option value="CUSTOMER">Clients</option>
              <option value="SELLER">Vendeurs</option>
              <option value="ADMIN">Admins</option>
            </select>
            <button 
              onClick={() => setNewUserForm(f => ({ ...f, isOpen: true }))} 
              className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {newUserForm.isOpen && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">Nouvel utilisateur</h3>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  value={newUserForm.first_name} 
                  onChange={e => setNewUserForm(f => ({ ...f, first_name: e.target.value }))} 
                  placeholder="Prénom" 
                  className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
                />
                <input 
                  value={newUserForm.last_name} 
                  onChange={e => setNewUserForm(f => ({ ...f, last_name: e.target.value }))} 
                  placeholder="Nom" 
                  className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
                />
                <input 
                  value={newUserForm.email} 
                  onChange={e => setNewUserForm(f => ({ ...f, email: e.target.value }))} 
                  placeholder="Email" 
                  className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
                />
                <input 
                  value={newUserForm.username} 
                  onChange={e => setNewUserForm(f => ({ ...f, username: e.target.value }))} 
                  placeholder="Username" 
                  className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
                />
                <select 
                  value={newUserForm.role} 
                  onChange={e => setNewUserForm(f => ({ ...f, role: e.target.value as UserRole }))} 
                  className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none"
                >
                  <option value="CUSTOMER">Client</option>
                  <option value="SELLER">Vendeur</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <input 
                  value={newUserForm.password} 
                  onChange={e => setNewUserForm(f => ({ ...f, password: e.target.value }))} 
                  placeholder="Mot de passe" 
                  className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateUser} className="flex-1 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                  Créer
                </button>
                <button onClick={() => setNewUserForm(f => ({ ...f, isOpen: false }))} className="px-4 py-2 bg-white text-slate-600 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-700">
            {filteredUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(u.first_name?.charAt(0) || '?')}{(u.last_name?.charAt(0) || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.first_name} {u.last_name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                {roleBadge(u.role)}
                <button onClick={() => setEditingUser(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors shrink-0">
                  <Edit2 className="w-4 h-4" />
                </button>
                {u.id !== currentUser.id && (
                  <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {editingUser && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800 space-y-3">
          <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">Modifier l'utilisateur</h3>
          <div className="grid grid-cols-2 gap-2">
            <input 
              value={editingUser.first_name} 
              onChange={e => setEditingUser((f: any) => ({ ...f, first_name: e.target.value }))} 
              placeholder="Prénom" 
              className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
            />
            <input 
              value={editingUser.last_name} 
              onChange={e => setEditingUser((f: any) => ({ ...f, last_name: e.target.value }))} 
              placeholder="Nom" 
              className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
            />
            <input 
              value={editingUser.email} 
              onChange={e => setEditingUser((f: any) => ({ ...f, email: e.target.value }))} 
              placeholder="Email" 
              className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
            />
            <input 
              value={editingUser.username} 
              onChange={e => setEditingUser((f: any) => ({ ...f, username: e.target.value }))} 
              placeholder="Username" 
              className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
            />
            <select 
              value={editingUser.role} 
              onChange={e => setEditingUser((f: any) => ({ ...f, role: e.target.value as UserRole }))} 
              className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none"
            >
              <option value="CUSTOMER">Client</option>
              <option value="SELLER">Vendeur</option>
              <option value="ADMIN">Admin</option>
            </select>
            <input 
              value={editingUser.password || ''} 
              onChange={e => setEditingUser((f: any) => ({ ...f, password: e.target.value }))} 
              placeholder="Mot de passe" 
              className="px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveUser} className="flex-1 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
              Enregistrer
            </button>
            <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-white text-slate-600 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {tab === 'categories' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Catégories & sous-catégories</h2>
            <button 
              onClick={() => setCategoryForm(f => ({ ...f, isOpen: true }))} 
              className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Catégorie
            </button>
          </div>
          {categoryForm.isOpen && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  value={categoryForm.name} 
                  onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="Nom" 
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
                />
                <input 
                  value={categoryForm.slug} 
                  onChange={e => setCategoryForm(f => ({ ...f, slug: e.target.value }))} 
                  placeholder="Slug" 
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={categoryForm.id ? handleSaveCategory : handleCreateCategory} 
                  className="flex-1 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  {categoryForm.id ? 'Enregistrer' : 'Créer'}
                </button>
                <button 
                  onClick={() => setCategoryForm({ isOpen: false, id: '', name: '', slug: '', is_active: true })} 
                  className="px-4 py-2 bg-white text-slate-600 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
          <div className="grid gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{cat.name}</p>
                    <p className="text-xs text-slate-500">{cat.slug}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setCategoryForm({ isOpen: true, id: cat.id, name: cat.name, slug: cat.slug, is_active: cat.is_active })} 
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)} 
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {subcategories.filter(s => s.category_id === cat.id).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{sub.name}</p>
                        <p className="text-[11px] text-slate-500">{sub.slug}</p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setSubcategoryForm({ isOpen: true, id: sub.id, category_id: sub.category_id, category_name: sub.category_name, name: sub.name, slug: sub.slug, is_active: sub.is_active })} 
                          className="p-1 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSubcategory(sub.id)} 
                          className="p-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setSubcategoryForm({ isOpen: true, id: '', category_id: cat.id, category_name: cat.name, name: '', slug: '', is_active: true })} 
                    className="w-full py-2 text-xs font-semibold text-indigo-600 rounded-xl border border-dashed border-indigo-200 hover:bg-indigo-50 transition-colors"
                  >
                    + Ajouter une sous-catégorie
                  </button>
                </div>
              </div>
            ))}
          </div>
          {subcategoryForm.isOpen && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  value={subcategoryForm.name} 
                  onChange={e => setSubcategoryForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="Nom sous-catégorie" 
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
                />
                <input 
                  value={subcategoryForm.slug} 
                  onChange={e => setSubcategoryForm(f => ({ ...f, slug: e.target.value }))} 
                  placeholder="Slug" 
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={subcategoryForm.id ? handleSaveSubcategory : handleCreateSubcategory} 
                  className="flex-1 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  {subcategoryForm.id ? 'Enregistrer' : 'Créer'}
                </button>
                <button 
                  onClick={() => setSubcategoryForm({ isOpen: false, id: '', category_id: '', category_name: '', name: '', slug: '', is_active: true })} 
                  className="px-4 py-2 bg-white text-slate-600 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CITIES TAB */}
      {tab === 'cities' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Villes</h2>
            <button 
              onClick={() => setCityForm({ isOpen: true, id: '', name: '', is_active: true })} 
              className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Ville
            </button>
          </div>
          {cityForm.isOpen && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <input 
                value={cityForm.name} 
                onChange={e => setCityForm(f => ({ ...f, name: e.target.value }))} 
                placeholder="Nom de la ville" 
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white dark:bg-slate-800 focus:outline-none" 
              />
              <div className="flex gap-2">
                <button 
                  onClick={cityForm.id ? handleSaveCity : handleCreateCity} 
                  className="flex-1 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  {cityForm.id ? 'Enregistrer' : 'Créer'}
                </button>
                <button 
                  onClick={() => setCityForm({ isOpen: false, id: '', name: '', is_active: true })} 
                  className="px-4 py-2 bg-white text-slate-600 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-700">
            {cities.map(city => (
              <div key={city.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{city.name}</p>
                  <p className="text-xs text-slate-500">{city.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCityForm({ isOpen: true, id: city.id, name: city.name, is_active: city.is_active })} 
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCity(city.id)} 
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {tab === 'logs' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-700">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Aucun log de modération.</div>
          ) : logs.map(log => (
            <div key={log.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{log.shop_name}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${log.action === 'approve' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {log.action === 'approve' ? '✓ Approuvée' : '✗ Rejetée'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-1">{log.actor_email} · {formatDate(log.created_at)}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{log.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
