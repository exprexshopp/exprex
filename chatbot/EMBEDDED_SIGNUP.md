# Embedded Signup Meta — Exprex AI Seller

## Expérience vendeur

1. Dans le dashboard vendeur → **Connecter WhatsApp**
2. Fenêtre Meta (Embedded Signup)
3. Le vendeur choisit / crée son compte WhatsApp Business
4. Exprex reçoit `phone_number_id` + token et active le bot
5. Le catalogue boutique est synchronisé automatiquement

## Config plateforme (une seule fois)

### 1. Meta for Developers
1. [developers.facebook.com](https://developers.facebook.com/) → App **Business**
2. Ajouter le produit **WhatsApp**
3. Configurer **Embedded Signup** → noter le **Configuration ID** (`META_CONFIG_ID`)
4. Récupérer **App ID** + **App Secret**
5. Domaines autorisés : `exprex.vercel.app`, `localhost`

### 2. Variables chatbot (`.env`)
```env
META_APP_ID=...
META_APP_SECRET=...
META_CONFIG_ID=...
META_VERIFY_TOKEN=exprex_verify_token_change_me
META_API_VERSION=v21.0
```

### 3. Webhook
URL : `https://<host-chatbot>/webhook`  
Verify token : même valeur que `META_VERIFY_TOKEN`  
Champs : `messages`, `message_deliveries` (selon besoins)

### 4. Backend Exprex
```env
CHATBOT_URL=https://<host-chatbot>
```
Router `chatbot_bridge` monté dans `main.py`.

## Endpoints

| Service | Path | Rôle |
|---------|------|------|
| chatbot | `GET /api/oauth/meta/config` | app_id + config_id (public) |
| chatbot | `POST /api/oauth/meta/embedded-signup` | Finalise signup + crée ShopBot |
| backend | `GET /api/chatbot/meta/config` | Proxy auth vendeur |
| backend | `POST /api/chatbot/shops/{id}/embedded-signup` | Proxy + sync produits |

## Fichiers modifiés / ajoutés

**chatbot/**
- `app/config.py` — META_APP_ID, META_CONFIG_ID
- `app/services/meta_oauth.py` — échange code, WABA, subscribe
- `app/schemas/oauth.py`
- `app/routers/oauth.py`
- `app/main.py` — router oauth
- `.env.example`

**integration/**
- `backend/.../chatbot_bridge.py` — routes embedded-signup + meta/config
- `frontend/.../services/chatbot.ts` — SDK FB + launchEmbeddedSignup
- `frontend/.../components/SellerBotPanel.tsx` — bouton Connecter WhatsApp
