# express-shop

## API catalogue paginé

`GET /api/products`

Paramètres compatibles : `search`, `city`, `category`, `subcategory`, `price_min`, `price_max`, `sort_by`.

Pagination offset :

- `page` : entier positif; défaut `1`; les valeurs inférieures à `1` sont ramenées à `1`.
- `page_size` : défaut `24`, plafonné à `100`.
- Réponse : `{ products, total, page, page_size, has_more }`.
- `has_more` est calculé à partir de l’offset réel et du nombre de lignes retournées.
- Sans `page` ni `page_size`, l’API conserve sa réponse historique sous forme de tableau.

Pagination cursor optionnelle :

- `cursor` : dernier identifiant reçu.
- `limit` : taille de page, plafonnée à `100`.
- Réponse complémentaire : `next_cursor` lorsqu’une page suivante existe.

La grille charge les produits par lots de 24 via `IntersectionObserver`. Le cache navigateur conserve les pages 60 secondes avec une taille maximale de 50 entrées; `dataVersion` invalide le cache catalogue.

Décision C8 : le backend expose une pagination cursor optionnelle via `cursor` et `limit`, tandis que le frontend conserve actuellement la pagination offset. Le cursor est donc disponible pour les clients sensibles aux mutations fréquentes. Le frontend reste protégé par le tri stable et la déduplication par identifiant.
