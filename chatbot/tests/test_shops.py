from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_connect_and_get_shop():
    payload = {
        "shop_id": "test-shop-xyz",
        "shop_name": "Boutique Test",
        "shop_slug": "boutique-test",
        "phone_number_id": "pnid_test_123",
        "tone": "amical",
        "welcome_message": "Salut !",
    }
    r = client.post("/api/shops/connect", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["shop_id"] == "test-shop-xyz"
    assert data["is_active"] is True
    assert data["phone_number_id"] == "pnid_test_123"

    r2 = client.get("/api/shops/test-shop-xyz")
    assert r2.status_code == 200
    assert r2.json()["shop_name"] == "Boutique Test"


def test_products_sync():
    # s'assurer que la boutique existe
    client.post(
        "/api/shops/connect",
        json={
            "shop_id": "test-shop-sync",
            "shop_name": "Sync Shop",
            "phone_number_id": "pnid_sync_456",
        },
    )
    products = {
        "products": [
            {
                "id": "1",
                "name": "Produit A",
                "price": 1000,
                "in_stock": True,
                "slug": "produit-a",
            }
        ]
    }
    r = client.post("/api/shops/test-shop-sync/products-sync", json=products)
    assert r.status_code == 200
    assert r.json()["products_count"] == 1
