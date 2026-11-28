import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const VISITOR_KEY = 'exprex_chat_visitor_id';
const SESSION_KEY = 'exprex_chat_session_id';

export function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `vis_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function getStoredSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setStoredSessionId(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

export type ChatMessage = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at?: string;
};

export type ChatSendResult = {
  session_id: string;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
};

export const chatbotApi = {
  health: async () => (await api.get('/chatbot/health')).data,

  sendMessage: async (opts: {
    message: string;
    user_id?: string | null;
    shop_id?: string | null;
    shop_slug?: string | null;
    product_slug?: string | null;
  }): Promise<ChatSendResult> => {
    const body = {
      visitor_id: getVisitorId(),
      session_id: getStoredSessionId() || undefined,
      message: opts.message,
      user_id: opts.user_id || undefined,
      shop_id: opts.shop_id || undefined,
      shop_slug: opts.shop_slug || undefined,
      product_slug: opts.product_slug || undefined,
    };
    const r = await api.post('/chatbot/message', body);
    const data = r.data as ChatSendResult;
    if (data.session_id) setStoredSessionId(data.session_id);
    return data;
  },

  listMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const r = await api.get(`/chatbot/sessions/${sessionId}/messages`);
    return r.data || [];
  },
};
