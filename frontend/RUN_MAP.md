# RUN_MAP

## État global

- [✅] Étape 0 : Résolution des incohérences et du typage
  - Vérification typée effectuée ; imports `../types` et cohérence UI résolus.
- [✅] Étape 1 : Vraie base de données & backend Express
  - SQLite + Express + routes API backend confirmés et cohérents avec la façade front `db`.
- [✅] Étape 2 : Gestion & upload des images
  - Endpoint d’upload Sharp/WebP existant et UI d’ajout local intégré côté formulaires.
- [✅] Étape 3 : Sécurisation & contrôle d’accès
  - Protection JWT + `adminRequired` côté API présente ; accès admin/démonstration UI aligné avec le rôle `ADMIN`.
- [✅] Étape 4 : Métier boutiques (horaires & tri par ville)
  - Horaires supportés ; filtre de ville limité aux villes ayant une boutique active ; liste des villes d’inscription alignée sur la base.
- [✅] Étape 5 : Dashboard Admin Complet (CRUD)
  - CRUD admin utilisateur + validation des boutiques + logs déjà présent et exploitable ; endpoints backend ciblés disponibles.
- [✅] Étape finale : Vérification TypeScript / build / runtime
  - `npx tsc --noEmit --pretty false` exécuté sans sortie d’erreur.
  - `pnpm build` exécuté avec génération réussie de la bundle client + serveur.
  - `PORT=3001 node dist/index.js` exécuté avec message « Server running on http://localhost:3001/ ».
