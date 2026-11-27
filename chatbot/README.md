# Exprex AI Seller — Module Chatbot WhatsApp

Module **indépendant** pour l’assistant WhatsApp multi-boutiques (Exprex AI Seller).

Il vit à la racine du dépôt, à côté de `backend/` et `frontend/`.  
Aucune modification du code Exprex existant. La synchronisation et l’intégration se feront dans une phase ultérieure.

## Objectif

Chaque boutique Exprex peut connecter son compte WhatsApp Business.  
Le bot répond aux clients avec le contexte de **sa** boutique uniquement (produits, horaires, ton, règles), envoie les liens Exprex, collecte les demandes et peut transférer la conversation au vendeur.

## Architecture

```
chatbot/
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── config.py
│   ├── database.py
│   ├── models/              # shop_bot, conversation, message
│   ├── schemas/
│   ├── routers/
│   │   ├── webhook.py       # Meta WhatsApp webhooks
│   │   ├── shops.py         # Connexion / config bot par boutique
│   │   └── conversations.py
│   ├── services/
│   │   ├── whatsapp.py      # Envoi / réception Meta Cloud API
│   │   ├── llm.py           # Génération de réponses (LLM + fallback)
│   │   └── context.py       # Construction du system prompt boutique
│   └── utils/
├── scripts/
├── tests/
├── requirements.txt
└── .env.example
```

## Stack

- FastAPI + SQLAlchemy (même style que le backend Exprex)
- PostgreSQL / SQLite
- Meta WhatsApp Cloud API
- LLM OpenAI-compatible (optionnel, mock disponible pour dev)

## Démarrage rapide (dev)

```bash
cd chatbot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Éditer .env (DATABASE_URL, META_*, OPENAI_API_KEY si besoin)

uvicorn app.main:app --reload --port 8001
```

Health check : `GET http://localhost:8001/api/health`

## Variables d’environnement principales

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connexion DB (sqlite ou postgres) |
| `META_VERIFY_TOKEN` | Token de vérification webhook Meta |
| `META_APP_SECRET` | Secret app Meta (signature) |
| `META_ACCESS_TOKEN` | Token d’accès Cloud API (ou par boutique) |
| `OPENAI_API_KEY` | Clé LLM (optionnel) |
| `OPENAI_BASE_URL` | Endpoint compatible OpenAI (optionnel) |
| `EXPREX_FRONTEND_URL` | Base URL pour les liens produits |
| `LLM_MOCK` | `true` = réponses mock sans appel LLM |

## Endpoints principaux

### Webhook Meta
- `GET  /webhook` — vérification Meta
- `POST /webhook` — réception des messages

### Boutiques (config bot)
- `POST /api/shops/{shop_id}/connect` — enregistrer phone_number_id + token
- `GET  /api/shops/{shop_id}` — config actuelle
- `PATCH /api/shops/{shop_id}` — mettre à jour system_prompt, horaires, etc.
- `POST /api/shops/{shop_id}/products-sync` — injecter un snapshot produits (phase 1)

### Conversations
- `GET  /api/shops/{shop_id}/conversations`
- `GET  /api/conversations/{id}/messages`
- `POST /api/conversations/{id}/handoff` — passer au vendeur
- `POST /api/conversations/{id}/resume` — reprendre le bot

## Modèle de données (tables propres au chatbot)

- `shop_bots` : liaison `shop_id` Exprex ↔ WhatsApp (`phone_number_id`, token, system_prompt, ton, actif…)
- `conversations` : fil de discussion client ↔ bot
- `messages` : historique

Les produits ne sont **pas** dupliqués en base métier. En phase 1 on accepte un snapshot JSON ; plus tard on lira directement la DB / API Exprex.

## Roadmap d’intégration

1. **Maintenant** : module autonome fonctionnel (webhook + réponses + config)
2. **Ensuite** : synchronisation produits / shops depuis le backend Exprex
3. **Puis** : endpoints + UI dans le dashboard vendeur Exprex
4. **Enfin** : pont éventuel avec Exprex AI Shopping

## Notes

- Multi-tenant strict : un message n’est traité que dans le contexte de la boutique propriétaire du `phone_number_id`.
- Handoff : le bot s’arrête dès que `conversation.handed_off = true` jusqu’à reprise explicite.
- Pas de modification du code `backend/` ou `frontend/` dans ce module.
