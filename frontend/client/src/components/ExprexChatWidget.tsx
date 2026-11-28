/**
 * Widget flottant — chat général sur toute la plateforme.
 */
import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import {
  chatbotApi,
  getStoredSessionId,
  type ChatMessage,
} from '../services/chatbot';
import { useApp } from '../contexts/AppContext';
import { logger } from '../lib/logger';

type Props = {
  userId?: string | null;
  shopId?: string | null;
  shopSlug?: string | null;
  productSlug?: string | null;
};

export function ExprexChatWidget({
  userId,
  shopId,
  shopSlug,
  productSlug,
}: Props) {
  const app = useApp();
  const resolvedUserId = userId ?? app.currentUser?.id ?? null;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const sid = getStoredSessionId();
    if (!sid) return;
    chatbotApi
      .listMessages(sid)
      .then(setMessages)
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setInput('');
    try {
      const res = await chatbotApi.sendMessage({
        message: text,
        user_id: resolvedUserId,
        shop_id: shopId,
        shop_slug: shopSlug,
        product_slug: productSlug,
      });
      setMessages((prev) => [...prev, res.user_message, res.assistant_message]);
    } catch (e: any) {
      logger.error('chat widget', e);
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
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95"
        aria-label="Ouvrir l'assistant Exprex"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-40 w-[min(100vw-2rem,380px)] h-[min(70vh,520px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-indigo-600 text-white flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <div>
              <p className="font-bold text-sm">Exprex AI Shopping</p>
              <p className="text-[11px] text-indigo-100">Assistant sur la plateforme</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8 px-4">
                Bonjour ! Demandez un produit, un budget ou une catégorie.
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
            <p className="px-3 py-1 text-xs text-red-600 bg-red-50">{error}</p>
          )}

          <div className="p-2 border-t border-slate-200 dark:border-slate-700 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Votre message…"
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !input.trim()}
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
