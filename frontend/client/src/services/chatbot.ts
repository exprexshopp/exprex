/**
 * Client API Exprex AI Seller (pont backend /api/chatbot)
 * + helpers Embedded Signup Meta.
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

export type MetaSdkConfig = {
  app_id?: string | null;
  config_id?: string | null;
  api_version?: string;
  graph_url?: string;
  embedded_signup_ready?: boolean;
};

export type ShopBotStatus = {
  configured?: boolean;
  id?: string;
  shop_id: string;
  shop_name?: string;
  phone_number_id?: string | null;
  display_phone?: string | null;
  waba_id?: string | null;
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

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

let fbSdkPromise: Promise<void> | null = null;

/** Charge le SDK Facebook une seule fois. */
export function loadFacebookSdk(appId: string, apiVersion = 'v21.0'): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.FB) return Promise.resolve();
  if (fbSdkPromise) return fbSdkPromise;

  fbSdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId,
          cookie: true,
          xfbml: false,
          version: apiVersion,
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    const id = 'facebook-jssdk';
    if (document.getElementById(id)) {
      const t = setInterval(() => {
        if (window.FB) {
          clearInterval(t);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(t);
        if (!window.FB) reject(new Error('FB SDK timeout'));
      }, 10000);
      return;
    }
    const js = document.createElement('script');
    js.id = id;
    js.async = true;
    js.src = 'https://connect.facebook.net/fr_FR/sdk.js';
    js.onerror = () => reject(new Error('Impossible de charger le SDK Facebook'));
    document.body.appendChild(js);
  });
  return fbSdkPromise;
}

/**
 * Lance le flux Embedded Signup Meta.
 * Écoute l'événement postMessage WA_EMBEDDED_SIGNUP + callback FB.login.
 */
export function launchEmbeddedSignup(configId: string): Promise<{
  code?: string;
  access_token?: string;
  phone_number_id?: string;
  waba_id?: string;
  display_phone?: string;
}> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('SDK Facebook non initialisé'));
      return;
    }

    let sessionData: {
      phone_number_id?: string;
      waba_id?: string;
      display_phone?: string;
    } = {};
    let settled = false;

    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }
      try {
        const data =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH' || data.data) {
            const d = data.data || {};
            sessionData = {
              phone_number_id: d.phone_number_id || sessionData.phone_number_id,
              waba_id: d.waba_id || sessionData.waba_id,
              display_phone:
                d.display_phone_number ||
                d.display_phone ||
                sessionData.display_phone,
            };
          }
          if (data.event === 'CANCEL' || data.event === 'ERROR') {
            if (!settled) {
              settled = true;
              window.removeEventListener('message', onMessage);
              reject(
                new Error(
                  data.event === 'CANCEL' ? 'Connexion annulée' : 'Erreur Meta'
                )
              );
            }
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('message', onMessage);

    window.FB.login(
      (response: any) => {
        window.removeEventListener('message', onMessage);
        if (settled) return;
        settled = true;

        const auth = response?.authResponse || {};
        if (!auth.code && !auth.accessToken) {
          reject(new Error('Connexion Meta refusée ou interrompue'));
          return;
        }

        resolve({
          code: auth.code,
          access_token: auth.accessToken,
          phone_number_id: sessionData.phone_number_id,
          waba_id: sessionData.waba_id,
          display_phone: sessionData.display_phone,
        });
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      }
    );
  });
}

export const chatbotApi = {
  health: async () => {
    const r = await api.get('/chatbot/health');
    return r.data;
  },

  getMetaConfig: async (): Promise<MetaSdkConfig> => {
    const r = await api.get('/chatbot/meta/config');
    return r.data;
  },

  getStatus: async (shopId: string): Promise<ShopBotStatus> => {
    const r = await api.get(`/chatbot/shops/${shopId}/status`);
    return r.data;
  },

  completeEmbeddedSignup: async (
    shopId: string,
    data: {
      code?: string;
      access_token?: string;
      phone_number_id?: string;
      waba_id?: string;
      display_phone?: string;
      tone?: string;
      welcome_message?: string;
    }
  ) => {
    const r = await api.post(`/chatbot/shops/${shopId}/embedded-signup`, data);
    return r.data as ShopBotStatus;
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
