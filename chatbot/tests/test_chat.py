import os

os.environ["LLM_MOCK"] = "true"
os.environ["DATABASE_URL"] = "sqlite:////tmp/chatbot_web_test.db"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["channel"] == "web"


def test_catalog_and_chat():
    r = client.post(
        "/api/catalog/sync",
        json={
            "scope": "marketplace",
            "products": [
                {
                    "id": "p1",
                    "name": "Sneakers Pro",
                    "description": "Confort urbain",
                    "price": 25000,
                    "slug": "sneakers-pro",
                    "in_stock": True,
                    "shop_name": "Demo Shop",
                }
            ],
        },
    )
    assert r.status_code == 200
    assert r.json()["products_count"] == 1

    r = client.post(
        "/api/chat/message",
        json={
            "visitor_id": "vis_test_1",
            "message": "Bonjour, je cherche des sneakers",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["session_id"]
    assert data["assistant_message"]["role"] == "assistant"
    assert data["assistant_message"]["content"]
