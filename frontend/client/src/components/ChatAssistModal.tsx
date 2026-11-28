/**
 * Modal assistant IA (chat plateforme) — distinct de WhatsAppModal (commande vendeur).
 * Ouverture via événement global: window.dispatchEvent(new CustomEvent('exprex:open-chat', { detail: { product } }))
 */
import React, { useEffect, useRef, useState } from 'react';
import { X, Bot, Send, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../lib/format';
import { chatbotApi, type ChatMessage } from '../services/chatbot';
import { useApp } from '../contexts/AppContext';
import { logger } from '../lib/logger';

export const EXPREX_OPEN_CHAT = 'exprex:open-chat';

export function openExprexChat(product?: Product | null) {
  window.dispatchEvent(
    new CustomEvent(EXPREX_OPEN_CHAT, { detail: { product: product ?? null } })
  );
}

export function ChatAssistModal() {
  const { currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const p = (detail.product as Product) || null;
      setProduct(p);
      setIsOpen(true);
      setError(null);
      if (p) {
        setMessages([
          {
            id: 'local_intro',
            session_id: '',
            role: 'assistant',
            content:
              `Je peux vous aider au sujet de « ${p.name} » (${formatPrice(p.price)})` +
              (p.shop_name ? ` — ${p.shop_name}` : '') +
              `. Posez une question (similaires, budget, disponibilité sur le catalogue…).`,
          },
        ]);
        setInput(
          `Je m'intéresse à « ${p.name} » à ${formatPrice(p.price)}. Que me conseillez-vous ?`
        );
      } else {
        setMessages([]);
        setInput('');
      }
    };
    window.addEventListener(EXPREX_OPEN_CHAT, handler);
    return () => window.removeEventListener(EXPREX_OPEN_CHAT, handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const onClose = () => setIsOpen(false);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setInput('');
    try {
      const res = await chatbotApi.sendMessage({
        message: text,
        user_id: currentUser?.id,
        shop_id: product?.shop_id,
        shop_slug: product?.shop_slug,
        product_slug: product?.slug,
      });
      setMessages((prev) => {
        const withoutLocal = prev.filter((m) => !String(m.id).startsWith('local_'));
        return [...withoutLocal, res.user_message, res.assistant_message];
      });
    } catch (e: any) {
      logger.error('chat assist modal', e);
      setError(
        e?.response?.data?.detail
          ? String(e.response.data.detail)
          : 'Assistant indisponible.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 p-5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold">Assistant Exprex</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          {product && (
            <div className="flex gap-3 bg-white/10 rounded-2xl p-3">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm line-clamp-2">{product.name}</p>
                <p className="text-indigo-100 text-xs mt-0.5">{product.shop_name}</p>
                <p className="text-white font-bold text-base mt-1">{formatPrice(product.price)}</p>
              </div>
            </div>
          )}
          {!product && (
            <p className="text-indigo-100 text-sm">Chat libre sur le marketplace</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-slate-950 min-h-[180px]">
          {messages.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">
              Demandez un produit, un budget ou une catégorie.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-md'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="px-4 py-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20">{error}</p>
        )}

        <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2 shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Votre message…"
            className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="px-4 pb-3 text-[10px] text-slate-400 text-center">
          Assistant plateforme — la commande vendeur reste via WhatsApp
        </p>
      </div>
    </div>
  );
}
