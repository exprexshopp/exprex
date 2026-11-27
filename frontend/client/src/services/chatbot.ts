/**
 * Client API pour Exprex AI Seller (via le pont backend /api/chatbot).
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ShopBotStatus = {
  configured?: boolean;
  id?: string;
  shop_id: string;
  shop_name?: string;
  phone_number_id?: string | null;
  display_phone?: string | null;
  tone?: string | null;
  system_prompt?: string | null;
  welcome_message?: string | null;
  fallback_message?: string | null;
  is_active?: boolean;
  auto_reply?: boolean;
  products_count?: number;
  products_updated_at?: string | null;
};

export type BotConversation = {
  id: string;
  shop_id: string;
  customer_wa_id: string;
  customer_name?: string | null;
  status: string;
  handed_off: boolean;
  last_message_at?: string | null;
  created_at?: string | null;
};

export type BotMessage = {
  id: string;
  conversation_id: string;
  direction: string;
  content: string;
  content_type: string;
  is_from_bot: boolean;
  status?: string | null;
  created_at?: string | null;
};

export const chatbotApi = {
  health: async () => {
    const r = await api.get('/chatbot/health');
    return r.data;
  },

  getStatus: async (shopId: string): Promise<ShopBotStatus> => {
    const r = await api.get(`/chatbot/shops/${shopId}/status`);
    return r.data;
  },

  connect: async (
    shopId: string,
    data: {
      phone_number_id: string;
      access_token?: string;
      display_phone?: string;
      waba_id?: string;
      tone?: string;
      system_prompt?: string;
      welcome_message?: string;
    }
  ) => {
    const r = await api.post(`/chatbot/shops/${shopId}/connect`, data);
    return r.data as ShopBotStatus;
  },

  updateSettings: async (shopId: string, data: Partial<ShopBotStatus>) => {
    const r = await api.patch(`/chatbot/shops/${shopId}/settings`, data);
    return r.data as ShopBotStatus;
  },

  syncProducts: async (shopId: string) => {
    const r = await api.post(`/chatbot/shops/${shopId}/sync-products`);
    return r.data as ShopBotStatus;
  },

  listConversations: async (shopId: string) => {
    const r = await api.get(`/chatbot/shops/${shopId}/conversations`);
    return (r.data || []) as BotConversation[];
  },

  listMessages: async (conversationId: string) => {
    const r = await api.get(`/chatbot/conversations/${conversationId}/messages`);
    return (r.data || []) as BotMessage[];
  },

  handoff: async (conversationId: string, reason?: string) => {
    const r = await api.post(`/chatbot/conversations/${conversationId}/handoff`, {
      reason,
    });
    return r.data as BotConversation;
  },

  resume: async (conversationId: string) => {
    const r = await api.post(`/chatbot/conversations/${conversationId}/resume`);
    return r.data as BotConversation;
  },
};
