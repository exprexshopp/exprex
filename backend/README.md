# eXpress Shop - Backend (FastAPI)

## Variables d'environnement

Voir `.env.example`. `DATABASE_URL` et `SECRET_KEY` sont **obligatoires** : le backend refuse de démarrer sans elles.
`Settings` lit uniquement les variables d'environnement du processus (pas de fichier `.env`).

## Lancer les tests (venv dédié, hors du dépôt)

Les tests utilisent une base SQLite temporaire et définissent eux-mêmes `DATABASE_URL` et `SECRET_KEY`.
Aucune base réelle n'est touchée. Ne pas installer les dépendances dans le Python global.

```powershell
python -m venv C:\Users\ONIX\venvs\exprex-test
C:\Users\ONIX\venvs\exprex-test\Scripts\activate
cd backend
pip install -r requirements.txt
pip install httpx==0.28.1        # requis par fastapi.testclient (tests uniquement)
python -m unittest discover -s tests -v
```

### Python 3.13 : `pip install -r requirements.txt` peut échouer

`asyncpg==0.29.0` n'a pas de wheel pour Python 3.13 et tente une compilation (erreur `Cython<3.0.0`).
`psycopg2-binary==2.9.9` est dans le même cas. Aucun des deux n'est nécessaire pour les tests (SQLite).
Contournement, sans modifier `requirements.txt` :

```powershell
Get-Content requirements.txt | Where-Object { $_ -notmatch '^(asyncpg|psycopg2-binary)' } | Set-Content $env:TEMP\req-test.txt
pip install -r $env:TEMP\req-test.txt httpx==0.28.1
```

### Compatibilité bcrypt

`passlib==1.7.4` est incompatible avec `bcrypt>=5` (erreur au premier hachage).
`bcrypt==4.0.1` est donc épinglé dans `requirements.txt`. Ne pas le mettre à jour sans vérifier passlib.

## Sécurité : où est quoi

- `app/utils/security.py` : hachage des mots de passe (bcrypt, migration transparente depuis SHA-256 au login) et JWT (un seul secret : `settings.SECRET_KEY`).
- `app/routers/auth.py` : inscription, login, `get_current_user`, `get_current_admin`.
