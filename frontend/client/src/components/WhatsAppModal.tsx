// Design: Afrique Moderne — modal de redirection WhatsApp avec message pré-rempli
import React, { useState } from 'react';
import { X, MessageCircle, Phone, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { formatPrice, buildWhatsAppUrl } from '../lib/format';
import { db } from '../services/db';

interface Props {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

export function WhatsAppModal({ isOpen, product, onClose }: Props) {
  const [customMsg, setCustomMsg] = useState('');

  if (!isOpen || !product) return null;

  const phone = product.shop_whatsapp || '';
  const defaultMsg = `Bonjour ! Je suis intéressé(e) par "${product.name}" à ${formatPrice(product.price)} chez ${product.shop_name}. Est-ce toujours disponible ?`;
  const finalMsg = customMsg || defaultMsg;
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(finalMsg)}`;

  const handleOpen = () => {
    db.recordWhatsAppClick(product.id);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Green header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold">Commander via WhatsApp</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          {/* Product summary */}
          <div className="flex gap-3 bg-white/10 rounded-2xl p-3">
            {product.image && (
              <img src={product.image} alt={product.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm line-clamp-2">{product.name}</p>
              <p className="text-green-100 text-xs mt-0.5">{product.shop_name}</p>
              <p className="text-white font-bold text-base mt-1">{formatPrice(product.price)}</p>
            </div>
          </div>
        </div>

        {/* Message editor */}
        <div className="p-5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Message (modifiable)
          </label>
          <textarea
            value={customMsg || defaultMsg}
            onChange={e => setCustomMsg(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-green-400 resize-none"
          />
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <Phone className="w-3 h-3" />
            <span>+{phone}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Annuler
          </button>
          <button
            onClick={handleOpen}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-green-200"
          >
            <ExternalLink className="w-4 h-4" />
            Ouvrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

