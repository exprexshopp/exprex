"""Phase 1 - Sécurité JWT : un seul secret, obligatoire, sans valeur par défaut.

Lancer depuis le dossier backend/ :
    python -m unittest discover -s tests -v
Aucune base réelle n'est touchée : une base SQLite temporaire est utilisée.
"""
import os
import re
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_SECRET = "test-secret-phase1-0123456789abcdef"

_tmp = tempfile.mkdtemp(prefix="exprex_test_")
TEST_DB_URL = "sqlite:///" + Path(_tmp, "test.db").as_posix()
os.environ["DATABASE_URL"] = TEST_DB_URL
os.environ["SECRET_KEY"] = TEST_SECRET
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)  # UPLOAD_DIR est relatif (./static/storage)


def _import_config_in_subprocess(secret):
    """Importe app.config dans un process neuf. secret=None => variable absente."""
    env = {k: v for k, v in os.environ.items() if k != "SECRET_KEY"}
    env["DATABASE_URL"] = TEST_DB_URL
    if secret is not None:
        env["SECRET_KEY"] = secret
    return subprocess.run(
        [sys.executable, "-c", "import app.config"],
        cwd=BACKEND_DIR, env=env, capture_output=True, text=True,
    )


class TestSecretKeyRequired(unittest.TestCase):
    def test_absent_secret_refuses_to_start(self):
        r = _import_config_in_subprocess(None)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("SECRET_KEY", r.stderr)

    def test_blank_secret_refuses_to_start(self):
        r = _import_config_in_subprocess("   ")
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("SECRET_KEY", r.stderr)

    def test_valid_secret_starts(self):
        r = _import_config_in_subprocess(TEST_SECRET)
        self.assertEqual(r.returncode, 0, r.stderr)


class TestSingleSecretInCode(unittest.TestCase):
    def test_no_hardcoded_secret_left(self):
        offenders = []
        for f in (BACKEND_DIR / "app").rglob("*.py"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            if "express-shop-dev-secret" in text or "votre_cl" in text:
                offenders.append(str(f))
            if re.search(r"SECRET_KEY\s*(:\s*str\s*)?=\s*[\"']", text):
                offenders.append(str(f))
        self.assertEqual(offenders, [])

    def test_redundant_jwt_module_removed(self):
        self.assertFalse((BACKEND_DIR / "app" / "utils" / "jwt.py").exists())


class TestAuthFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from fastapi.testclient import TestClient
        from app.main import app
        cls.client = TestClient(app)
        cls.email = "phase1@example.com"
        cls.password = "Motdepasse123"
        r = cls.client.post("/api/auth/register", json={
            "email": cls.email, "username": "phase1user", "password": cls.password,
            "first_name": "Phase", "last_name": "Un", "role": "CUSTOMER",
        })
        assert r.status_code == 200, r.text
        cls.register_token = r.json()["access_token"]

    def test_login_returns_token_signed_with_settings_secret(self):
        from jose import jwt
        r = self.client.post("/api/auth/token",
                             data={"username": self.email, "password": self.password})
        self.assertEqual(r.status_code, 200, r.text)
        payload = jwt.decode(r.json()["access_token"], TEST_SECRET, algorithms=["HS256"])
        self.assertTrue(payload["sub"])

    def test_login_wrong_password_401(self):
        r = self.client.post("/api/auth/token",
                             data={"username": self.email, "password": "mauvais"})
        self.assertEqual(r.status_code, 401)

    def test_me_with_valid_token(self):
        r = self.client.post("/api/auth/token",
                             data={"username": self.email, "password": self.password})
        token = r.json()["access_token"]
        me = self.client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me.status_code, 200, me.text)
        self.assertEqual(me.json()["email"], self.email)

    def test_me_with_register_token(self):
        me = self.client.get("/api/users/me",
                             headers={"Authorization": f"Bearer {self.register_token}"})
        self.assertEqual(me.status_code, 200, me.text)

    def test_me_rejects_token_signed_with_other_secret(self):
        from jose import jwt
        good = self.client.post("/api/auth/token",
                                data={"username": self.email, "password": self.password})
        sub = jwt.get_unverified_claims(good.json()["access_token"])["sub"]
        forged = jwt.encode({"sub": sub, "exp": datetime.utcnow() + timedelta(minutes=5)},
                            "un-autre-secret", algorithm="HS256")
        me = self.client.get("/api/users/me", headers={"Authorization": f"Bearer {forged}"})
        self.assertEqual(me.status_code, 401)

    def test_me_without_token_rejected(self):
        me = self.client.get("/api/users/me")
        self.assertIn(me.status_code, (401, 403))


class TestMiddlewareImportable(unittest.TestCase):
    def test_middleware_auth_imports_and_uses_settings(self):
        import app.middleware.auth as mw
        self.assertTrue(hasattr(mw, "settings"))
        self.assertTrue(callable(mw.get_current_user))


if __name__ == "__main__":
    unittest.main()
