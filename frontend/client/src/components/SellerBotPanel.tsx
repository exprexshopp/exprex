/**
 * Panneau Exprex AI Seller — configuration WhatsApp + conversations.
 * À intégrer dans SellerDashboard.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  MessageCircle,
  RefreshCw,
  Power,
  UserRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  chatbotApi,
  type ShopBotStatus,
  type BotConversation,
  type BotMessage,
} from '../services/chatbot';
import { logger } from '../lib/logger';

type Props = {
  shopId: string;
  shopName?: string;
  defaultWhatsapp?: string;
};

export function SellerBotPanel({ shopId, shopName, defaultWhatsapp }: Props) {
  const [status, setStatus] = useState<ShopBotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [displayPhone, setDisplayPhone] = useState(defaultWhatsapp || '');
  const [tone, setTone] = useState('professionnel et amical');
  const [welcome, setWelcome] = useState('');

  const [conversations, setConversations] = useState<BotConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await chatbotApi.getStatus(shopId);
      setStatus(s);
      if (s.phone_number_id) setPhoneNumberId(s.phone_number_id);
      if (s.display_phone) setDisplayPhone(s.display_phone);
      if (s.tone) setTone(s.tone);
      if (s.welcome_message) setWelcome(s.welcome_message);
      if (s.configured !== false && s.is_active !== undefined) {
        const convs = await chatbotApi.listConversations(shopId);
        setConversations(convs);
      }
    } catch (e: any) {
      logger.error('chatbot status', e);
      setError(
        e?.response?.data?.detail
          ? String(e.response.data.detail)
          : 'Impossible de joindre le service chatbot. Vérifiez CHATBOT_URL / déploiement.'
      );
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setOkMsg(msg);
    setTimeout(() => setOkMsg(null), 3000);
  };

  const handleConnect = async () => {
    if (!phoneNumberId.trim()) {
      setError('phone_number_id Meta est requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const s = await chatbotApi.connect(shopId, {
        phone_number_id: phoneNumberId.trim(),
        access_token: accessToken.trim() || undefined,
        display_phone: displayPhone.trim() || undefined,
        tone,
        welcome_message:
          welcome.trim() ||
          (shopName ? `Bonjour ! Bienvenue chez ${shopName}.` : undefined),
      });
      setStatus(s);
      flash('Bot connecté et produits synchronisés');
      const convs = await chatbotApi.listConversations(shopId);
      setConversations(convs);
    } catch (e: any) {
      setError(
        e?.response?.data?.detail
          ? JSON.stringify(e.response.data.detail)
          : 'Échec de la connexion'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSaving(true);
    setError(null);
    try {
      const s = await chatbotApi.syncProducts(shopId);
      setStatus(s);
      flash(`Catalogue synchronisé (${s.products_count ?? 0} produits)`);
    } catch (e: any) {
      setError('Échec de la synchronisation produits');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!status || status.configured === false) return;
    setSaving(true);
    try {
      const s = await chatbotApi.updateSettings(shopId, {
        is_active: !status.is_active,
      });
      setStatus(s);
      flash(s.is_active ? 'Bot activé' : 'Bot désactivé');
    } catch {
      setError('Impossible de changer le statut');
    } finally {
      setSaving(false);
    }
  };

  const openConversation = async (id: string) => {
    setSelectedConv(id);
    setMsgLoading(true);
    try {
      const msgs = await chatbotApi.listMessages(id);
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  const doHandoff = async (id: string) => {
    await chatbotApi.handoff(id, 'seller_dashboard');
    flash('Conversation passée au vendeur');
    await load();
    if (selectedConv === id) await openConversation(id);
  };

  const doResume = async (id: string) => {
    await chatbotApi.resume(id);
    flash('Bot repris');
    await load();
    if (selectedConv === id) await openConversation(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Chargement du bot…
      </div>
    );
  }

  const configured = status && status.configured !== false && !!status.phone_number_id;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Exprex AI Seller</h2>
            <p className="text-xs text-slate-500">Assistant WhatsApp de votre boutique</p>
          </div>
        </div>
        {configured && (
          <button
            onClick={toggleActive}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
              status?.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {status?.is_active ? 'Actif' : 'Inactif'}
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-all">{error}</span>
          </div>
        )}
        {okMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4" /> {okMsg}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Phone Number ID (Meta) *
            </label>
            <input
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="ex: 123456789012345"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Numéro affiché
            </label>
            <input
              value={displayPhone}
              onChange={(e) => setDisplayPhone(e.target.value)}
              placeholder="+2376…"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-300"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Access token WhatsApp (optionnel si token global côté serveur)
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAG…"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ton</label>
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Message d&apos;accueil
            </label>
            <input
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-300"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleConnect}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            {configured ? 'Mettre à jour la connexion' : 'Activer mon assistant'}
          </button>
          {configured && (
            <button
              onClick={handleSync}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold rounded-xl"
            >
              <RefreshCw className="w-4 h-4" /> Sync produits
            </button>
          )}
        </div>

        {configured && (
          <p className="text-xs text-slate-500">
            {status?.products_count ?? 0} produit(s) dans le bot
            {status?.products_updated_at
              ? ` · sync ${new Date(status.products_updated_at).toLocaleString()}`
              : ''}
          </p>
        )}

        {/* Conversations */}
        {configured && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Conversations ({conversations.length})
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="max-h-64 overflow-y-auto space-y-1">
                {conversations.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Aucune conversation pour l&apos;instant
                  </p>
                )}
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                      selectedConv === c.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {c.customer_name || c.customer_wa_id}
                      </span>
                      {c.handed_off && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          Handoff
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {c.last_message_at
                        ? new Date(c.last_message_at).toLocaleString()
                        : c.status}
                    </p>
                  </button>
                ))}
              </div>
              <div className="border border-slate-100 dark:border-slate-700 rounded-xl p-3 min-h-[10rem] max-h-64 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/40">
                {!selectedConv && (
                  <p className="text-xs text-slate-400 text-center py-8">
                    Sélectionnez une conversation
                  </p>
                )}
                {msgLoading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                )}
                {!msgLoading &&
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`mb-2 text-sm ${
                        m.is_from_bot ? 'text-right' : 'text-left'
                      }`}
                    >
                      <span
                        className={`inline-block px-3 py-1.5 rounded-2xl max-w-[90%] ${
                          m.is_from_bot
                            ? 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {m.content}
                      </span>
                    </div>
                  ))}
                {selectedConv && !msgLoading && (
                  <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => doHandoff(selectedConv)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-xl bg-amber-50 text-amber-700"
                    >
                      <UserRound className="w-3.5 h-3.5" /> Handoff
                    </button>
                    <button
                      onClick={() => doResume(selectedConv)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-xl bg-indigo-50 text-indigo-700"
                    >
                      <Bot className="w-3.5 h-3.5" /> Reprendre bot
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
