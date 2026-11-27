from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["module"] == "chatbot"


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert "docs" in r.json()
