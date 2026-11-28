# Exprex AI Shopping (chatbot web)

Assistant d’achat **intégré à la plateforme** [exprex.vercel.app](https://exprex.vercel.app).  
**Pas de WhatsApp** — canal unique : interface de discussion sur le site.

## Démarrage

```bash
cd chatbot
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## API

| Méthode | Path | Description |
|---------|------|-------------|
| POST | `/api/chat/message` | Envoyer un message (crée la session si besoin) |
| POST | `/api/chat/sessions` | Créer une session |
| GET | `/api/chat/sessions/{id}/messages` | Historique |
| POST | `/api/catalog/sync` | Pousser le catalogue (marketplace ou shop) |
| GET | `/api/health` | Santé |

## Variables

Voir `.env.example` — plus aucune variable Meta / WhatsApp.

## Intégration Exprex

- Backend : pont optionnel `CHATBOT_URL` + sync catalogue  
- Frontend : widget flottant `ExprexChatWidget` (dossier `integration/`)
