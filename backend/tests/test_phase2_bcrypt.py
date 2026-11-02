"""Phase 2 - Mots de passe : bcrypt + migration transparente depuis SHA-256.

Lancer depuis le dossier backend/ :
    python -m unittest discover -s tests -v
Base SQLite temporaire uniquement : aucune base réelle n'est touchée.
"""
import hashlib
import os
import sys
import tempfile
import unittest
import uuid
from pathlib import Path
from unittest import mock

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_SECRET = "test-secret-phase1-0123456789abcdef"  # identique à test_phase1_jwt.py

# Base de test : réutilise celle du module phase 1 si déjà définie, sinon en crée une.
# Garde-fou : on n'utilise JAMAIS un DATABASE_URL qui ne soit pas une base de test temporaire.
_existing = os.environ.get("DATABASE_URL", "")
if not (_existing.startswith("sqlite:///") and "exprex_test_" in _existing):
    _tmp = tempfile.mkdtemp(prefix="exprex_test_")
    os.environ["DATABASE_URL"] = "sqlite:///" + Path(_tmp, "test.db").as_posix()
os.environ["SECRET_KEY"] = TEST_SECRET
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)

PASSWORD = "test123"


def _sha256(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


class TestPasswordHashingUnit(unittest.TestCase):
    def test_hash_password_is_bcrypt(self):
        from app.utils.security import hash_password
        h = hash_password(PASSWORD)
        self.assertTrue(h.startswith("$2b$"))
        self.assertEqual(len(h), 60)

    def test_verify_bcrypt_and_legacy(self):
        from app.utils.security import hash_password, verify_password
        self.assertTrue(verify_password(PASSWORD, hash_password(PASSWORD)))
        self.assertFalse(verify_password("autre", hash_password(PASSWORD)))
        self.assertTrue(verify_password(PASSWORD, _sha256(PASSWORD)))
        self.assertFalse(verify_password("autre", _sha256(PASSWORD)))

    def test_unreadable_hash_returns_false_not_exception(self):
        from app.utils.security import verify_password
        for bad in ("", None, "pas-un-hash", "$2b$12$tronque", "G" * 64):
            self.assertFalse(verify_password(PASSWORD, bad), repr(bad))

    def test_needs_rehash_only_for_legacy_sha256(self):
        from app.utils.security import hash_password, needs_password_rehash
        self.assertTrue(needs_password_rehash(_sha256(PASSWORD)))
        self.assertFalse(needs_password_rehash(hash_password(PASSWORD)))
        self.assertFalse(needs_password_rehash("pas-un-hash"))

    def test_users_router_gets_bcrypt_hasher(self):
        # routers/users.py importe get_password_hash depuis routers/auth.py
        from app.routers.users import get_password_hash
        self.assertTrue(get_password_hash("x").startswith("$2b$"))


class TestLoginAndMigration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from fastapi.testclient import TestClient
        from app.config import settings
        assert settings.DATABASE_URL.startswith("sqlite:///") and "exprex_test_" in settings.DATABASE_URL
        from app.main import app
        cls.client = TestClient(app)

    # -- helpers ---------------------------------------------------
    def _create_user(self, hashed_password: str) -> str:
        from app.database import SessionLocal
        from app.models.user import User, UserRole
        suffix = uuid.uuid4().hex[:8]
        email = f"p2_{suffix}@example.com"
        db = SessionLocal()
        try:
            db.add(User(
                id=f"usr_{suffix}", email=email, username=f"p2_{suffix}",
                first_name="P", last_name="Deux", role=UserRole.CUSTOMER,
                is_staff=False, hashed_password=hashed_password, permissions="[]",
            ))
            db.commit()
        finally:
            db.close()
        return email

    def _hash_in_db(self, email: str) -> str:
        from app.database import SessionLocal
        from app.models.user import User
        db = SessionLocal()  # nouvelle session : pas de cache d'objet périmé
        try:
            return db.query(User).filter(User.email == email).first().hashed_password
        finally:
            db.close()

    def _login(self, email: str, password: str):
        return self.client.post("/api/auth/token", data={"username": email, "password": password})

    # -- tests -----------------------------------------------------
    def test_new_user_gets_bcrypt_hash(self):
        suffix = uuid.uuid4().hex[:8]
        email = f"reg_{suffix}@example.com"
        r = self.client.post("/api/auth/register", json={
            "email": email, "username": f"reg_{suffix}", "password": PASSWORD,
            "first_name": "Nouveau", "last_name": "Utilisateur", "role": "CUSTOMER",
        })
        self.assertEqual(r.status_code, 200, r.text)
        stored = self._hash_in_db(email)
        self.assertTrue(stored.startswith("$2b$"))
        self.assertEqual(self._login(email, PASSWORD).status_code, 200)

    def test_existing_bcrypt_user_login_ok_and_hash_unchanged(self):
        from app.utils.security import hash_password
        h = hash_password(PASSWORD)
        email = self._create_user(h)
        self.assertEqual(self._login(email, PASSWORD).status_code, 200)
        self.assertEqual(self._hash_in_db(email), h)

    def test_existing_sha256_user_login_ok_and_rehash(self):
        email = self._create_user(_sha256(PASSWORD))
        r = self._login(email, PASSWORD)
        self.assertEqual(r.status_code, 200, r.text)
        migrated = self._hash_in_db(email)
        self.assertTrue(migrated.startswith("$2b$"))
        # deuxième login : fonctionne avec bcrypt, hash stable
        self.assertEqual(self._login(email, PASSWORD).status_code, 200)
        self.assertEqual(self._hash_in_db(email), migrated)

    def test_wrong_password_bcrypt_401(self):
        from app.utils.security import hash_password
        email = self._create_user(hash_password(PASSWORD))
        self.assertEqual(self._login(email, "wrong").status_code, 401)

    def test_wrong_password_sha256_401_and_no_rehash(self):
        legacy = _sha256(PASSWORD)
        email = self._create_user(legacy)
        self.assertEqual(self._login(email, "wrong").status_code, 401)
        self.assertEqual(self._hash_in_db(email), legacy)  # toujours SHA-256, inchangé

    def test_unknown_user_401(self):
        self.assertEqual(self._login("inconnu@example.com", PASSWORD).status_code, 401)

    def test_unrecognized_hash_format_401_not_500(self):
        email = self._create_user("ceci-n-est-pas-un-hash")
        self.assertEqual(self._login(email, PASSWORD).status_code, 401)

    def test_rehash_failure_does_not_block_login(self):
        legacy = _sha256(PASSWORD)
        email = self._create_user(legacy)
        with mock.patch("app.routers.auth.hash_password", side_effect=RuntimeError("boom")):
            r = self._login(email, PASSWORD)
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(self._hash_in_db(email), legacy)  # migration reportée au prochain login


if __name__ == "__main__":
    unittest.main()
