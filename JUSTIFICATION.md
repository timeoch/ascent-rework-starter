# JUSTIFICATION

1) Pourquoi pas `fs.readFileSync` au démarrage ?
- Données figées : si quelqu'un modifie `data/homepage.json` pendant que le serveur tourne, le service continue de renvoyer l'ancienne version jusqu'à redémarrage.
- Démarrage plus lent / blocage : `readFileSync` bloque l'Event Loop pendant la lecture/parsing — mauvais pour la robustesse et le scale.
- Risque d'échec : un JSON malformé peut causer des problèmes au démarrage.

2) Ce que j'ai fait (simple et sûr)
- J'ai gardé un fichier `cacheSync.js` pour montrer la solution « du senior », mais l'API utilise `homepageCache.js`.
- `homepageCache.js` : lecture asynchrone, validation, swap atomique en mémoire, `fs.watch` avec debounce pour reloads à chaud, et coalescing des rechargements via une `loadingPromise`.

3) Concurrence (en clair)
- Si le cache est déjà présent : je sers la copie en mémoire immédiatement (pas d'attente). Un reload peut s'exécuter en arrière‑plan.
- Si le cache est absent (premier appel) : la première requête attend la lecture initiale ; les autres requêtes en attente réutilisent la même promesse (pas de lectures parallèles inutiles).
- Si on force `?reload=1` : le rechargement est coalescé — une seule lecture réelle.

4) Métriques disponibles
- `hits`, `misses`, `loads`, `lastLoadMs`, `lastLoadAt` (endpoint : `/api/content/homepage/metrics`).

5) Test rapide (PowerShell)
cd backend
npm run start
curl http://localhost:4200/api/content/homepage
curl "http://localhost:4200/api/content/homepage?reload=1"
curl http://localhost:4200/api/content/homepage/metrics

Remarque
`fs.watch` dépend de la plateforme et peut se comporter différemment selon l'OS ; pour plusieurs instances en production, prévoir un cache partagé (Redis/pubsub) si on a besoin d'invalidation instantanée.
