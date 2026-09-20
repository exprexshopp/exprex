import React, { useState, useEffect } from 'react';
import { Clock, X, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Shop, ShopHours, ShopHoursDay } from '../types';
import { db } from '../services/db';

interface ShopHoursEditorProps {
  shop: Shop;
  onClose: () => void;
  onSave: () => void;
}

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export function ShopHoursEditor({ shop, onClose, onSave }: ShopHoursEditorProps) {
  const [hours, setHours] = useState<ShopHours>(shop.hours);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initialiser les horaires à partir de la boutique
    const defaultHours: ShopHours = {
      monday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      tuesday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      wednesday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      thursday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      friday: { opening_time: '08:00', closing_time: '18:00', is_closed: false },
      saturday: { opening_time: '08:00', closing_time: '17:00', is_closed: false },
      sunday: { opening_time: '08:00', closing_time: '17:00', is_closed: true },
    };

    if (shop.hours && typeof shop.hours === 'object') {
      setHours(shop.hours);
    } else {
      setHours(defaultHours);
    }
  }, [shop]);

  const toggleDay = (dayKey: string) => {
    setHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey as keyof ShopHours],
        is_closed: !prev[dayKey as keyof ShopHours]?.is_closed,
      },
    }));
  };

  const updateDayHours = (dayKey: string, field: 'opening_time' | 'closing_time', value: string) => {
    setHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey as keyof ShopHours],
        [field]: value,
      },
    }));
  };

  const toggleExpand = (dayKey: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await db.updateShopHours(shop.id, hours);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde des horaires');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-lg">Horaires d'ouverture</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Définissez les horaires d'ouverture et de fermeture pour chaque jour de la semaine.
          </p>

          <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
              const dayHours = hours[key as keyof ShopHours];
              const isClosed = dayHours?.is_closed ?? true;
              const isExpanded = expandedDays[key] || false;

              return (
                <div key={key} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleExpand(key)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isClosed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isClosed ? 'Fermé' : 'Ouvert'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleDay(key)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            isClosed
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {isClosed ? 'Ouvrir' : 'Fermer'}
                        </button>

                        {!isClosed && (
                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1">
                              <label className="block text-[10px] text-slate-500 mb-0.5">Ouverture</label>
                              <input
                                type="time"
                                value={dayHours?.opening_time || '08:00'}
                                onChange={(e) => updateDayHours(key, 'opening_time', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-300"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] text-slate-500 mb-0.5">Fermeture</label>
                              <input
                                type="time"
                                value={dayHours?.closing_time || '18:00'}
                                onChange={(e) => updateDayHours(key, 'closing_time', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-300"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}