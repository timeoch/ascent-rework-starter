# Ascent Formation - Refonte Front & Back

## Contexte et Objectif

Bienvenue chez Ascent Formation ! Cet exercice simule la refonte de la page d'accueil de notre site web (https://ascent-formation.fr/) sur deux jours (estimation de travail effectif : 4-5h) et nous permettra d'évaluer vos compétences en développement full-stack (Node.js, React/Vue, API REST), votre rigueur professionnelle, votre autonomie, et surtout, votre capacité à défendre vos choix techniques face à des suggestions potentiellement erronées.

## Phase 1 : Démarrage, Configuration & Exigences de Base

### 1. Démarrage et Dégommage

#### Tâche 1.1 : Clonez et démarrez le projet.

```bash
npm install
npm run dev
```

#### Tâche 1.2 : Identifiez et corrigez les problèmes de configuration

Le projet ne démarre pas actuellement. **Votre mission** : identifier les problèmes en analysant les erreurs retournées lors du démarrage, puis les corriger.

**Objectif** : Faire tourner le serveur backend sur le port 4200 et le frontend sur le port 3000.

### 2. Architecture Full-Stack

#### Tâche 2.1 : Configurez l'API backend Express.js

- Migrez l'API de base (Vanilla Node) vers Express.js
- Créez un router Express dédié aux contenus de la page d'accueil
- Configurez CORS pour permettre la communication avec le frontend

#### Tâche 2.2 : Configurez le frontend

- Identifiez le framework utilisé (React ou Vue)
- Corrigez les erreurs de configuration
- Configurez le proxy pour communiquer avec l'API backend

#### Tâche 2.3 : Implémentez l'endpoint API de base

- **GET /api/content/homepage** : Retourne le contenu de la page d'accueil (titre, description, formations, etc.)

### 3. Fonctionnalités Avancées

#### Tâche 3.1 : Améliorez l'API avec des fonctionnalités avancées

- Ajoutez la pagination pour les listes de formations : `?page=1&limit=6`
- Ajoutez des filtres : `?category=cybersecurite&level=avance`
- Ajoutez le tri : `?sort=date&order=desc`
- Validez et sanitizez tous les paramètres d'entrée
- Gérez les cas limites (paramètres invalides, valeurs négatives, etc.)

#### Tâche 3.2 : Implémentez les composants frontend

- Créez un composant Hero (section principale avec titre et CTA)
- Créez un composant de liste de formations avec pagination
- Créez un composant de filtres (catégories, niveaux)
- Implémentez la gestion d'état (loading, erreurs, données)

#### Tâche 3.3 : Identifiez et corrigez les problèmes de sécurité

Le code actuel contient plusieurs vulnérabilités de sécurité. Identifiez-les et corrigez-les :
- Exposition d'informations sensibles dans les erreurs
- CORS trop permissif
- Absence de validation/sanitization des inputs
- Absence de headers de sécurité HTTP
- Gestion d'erreurs insuffisante
- XSS potentiel dans le frontend

## Phase 2 : Optimisation et Débat Technique

Notre fichier `data/homepage.json` simule une base de données. Pour des raisons de performance, nous devons implémenter un mécanisme de mise en cache (caching) du contenu de la page d'accueil.

### 4. Validation et Qualité des Données

#### Tâche 4.1 : Identifiez les problèmes de qualité dans homepage.json

Le fichier `data/homepage.json` contient des données problématiques :
- Des doublons d'ID
- Des contenus avec des champs manquants ou invalides
- Des données incohérentes (URLs invalides, images manquantes)

**Votre mission** : Créez un module de validation qui :
- Valide le schéma de chaque élément (tous les champs requis présents et valides)
- Détecte et gère les doublons d'ID
- Nettoie et normalise les données (trim des strings, validation des types, URLs)
- Retourne des erreurs claires pour chaque problème détecté

#### Tâche 4.2 : Implémentez une gestion robuste des erreurs

- Créez un middleware de gestion d'erreurs Express
- Ne jamais exposer les détails techniques des erreurs en production
- Loggez les erreurs de manière structurée
- Retournez des codes HTTP appropriés (400, 404, 500, etc.)
- Gérez les erreurs côté frontend (affichage utilisateur-friendly)

### 5. Le Débat Technique : Comment Charger le Contenu ?

Un développeur senior de l'équipe vous fait la suggestion suivante pour implémenter la mise en cache :

> « Pour le contenu de la page d'accueil, pas besoin de se compliquer la vie avec des outils de cache externes. Le plus efficace, c'est de charger le fichier homepage.json une seule fois, au démarrage du serveur, en utilisant `fs.readFileSync()`. On stocke le résultat dans une constante globale ou dans un module cache dédié. Ça évite de le lire pour chaque requête et c'est garanti synchronisé au lancement. »

#### Votre Tâche (L'Implémentation et la Justification)

1. **Implémentation** : Implémentez le mécanisme de mise en cache en adoptant la solution du senior (lecture synchrone unique au démarrage dans un module `cache.js`).

2. **Problématique** : Maintenant, imaginez que le fichier JSON soit mis à jour pendant que le serveur tourne (un autre process ou un administrateur l'édite).

3. **Justification** : Écrivez un document (dans votre README.md ou un fichier séparé `JUSTIFICATION.md`) qui :
   - Identifie clairement le problème causé par l'approche du senior lorsque le fichier est modifié en cours d'exécution.
   - Identifie les problèmes de performance (blocage de l'Event Loop) et de concurrence (race conditions possibles).
   - Propose une alternative technique supérieure (une solution asynchrone et non bloquante qui permet de mettre le cache à jour sans redémarrer le serveur et sans bloquer l'Event Loop).
   - Gère les race conditions : que se passe-t-il si plusieurs requêtes arrivent pendant le rechargement du cache ?
   - Implémente cette alternative dans votre code (remplacez l'implémentation synchrone par votre solution améliorée).

4. **Contraintes de Performance** : Votre solution doit :
   - Ne jamais bloquer l'Event Loop
   - Gérer les accès concurrents au cache (plusieurs requêtes simultanées)
   - Minimiser les lectures disque inutiles
   - Fournir des métriques de performance (temps de chargement, nombre de hits/misses du cache)

**Note :** L'objectif n'est pas de deviner l'outil parfait, mais de démontrer la compréhension des effets de bord du synchrone, des problèmes de concurrence, et la capacité à utiliser un mécanisme asynchrone pour la surveillance de fichiers (ex: `fs.watch` ou une simple relecture périodique).

### 6. Optimisation Frontend

#### Tâche 6.1 : Optimisez les performances frontend

- Implémentez le lazy loading pour les images
- Ajoutez la mise en cache des requêtes API (React Query, SWR, ou solution custom)
- Optimisez le rendu (memoization, useMemo, useCallback si React)
- Gérez les états de chargement et les erreurs de manière optimale

#### Tâche 6.2 : Améliorez l'expérience utilisateur

- Ajoutez des animations de transition lors du chargement
- Implémentez un système de retry automatique en cas d'erreur API
- Ajoutez un feedback visuel pour les actions utilisateur
- Gérez les cas d'erreur réseau (offline, timeout)

### 7. Les Exigences Professionnelles (Impératif)

| Exigence | Détail |
|----------|--------|
| **Git & Commits** | **Impératif.** Votre historique Git doit être propre et lisible. Effectuez au moins 8 commits significatifs représentant la progression : Démarrage, Configuration Backend, Configuration Frontend, API de base, Fonctionnalités avancées, Validation données, Implémentation Cache Senior (Synchrone), Implémentation Cache Corrigé (Asynchrone), Optimisations Frontend. |
| **Documentation** | **Impératif.** Créez un fichier README.md complet à la racine décrivant :<br>1. Configuration et Démarrage (backend et frontend).<br>2. Liste des Endpoints API et leur fonctionnement.<br>3. Architecture frontend (composants, gestion d'état).<br>4. Le mécanisme de mise en cache utilisé (votre solution finale asynchrone). |
| **Tests Unitaires** | **Impératif.** Écrivez au moins 10 tests unitaires couvrant :<br>1. Test de l'API de récupération du contenu.<br>2. Test de la fonction de chargement du catalogue (gestion d'erreur ou parsing JSON).<br>3. Test pour vérifier que le mécanisme de cache fonctionne (il doit charger une fois, puis retourner le même résultat sans recharger).<br>4. Test pour vérifier que votre mécanisme asynchrone met bien à jour le cache si le fichier JSON est modifié.<br>5. Test de validation des données (détection de doublons, champs manquants).<br>6. Test de pagination et filtres avancés côté API.<br>7. Test de gestion des erreurs et codes HTTP appropriés.<br>8. Test de performance/charge (plusieurs requêtes simultanées sur le cache).<br>9. Test d'un composant frontend (rendu, props, interactions).<br>10. Test d'intégration frontend-backend (requête API complète). |
| **Bonus - Dockerisation** | Créez un `Dockerfile` et un `docker-compose.yml` pour conteneuriser votre application (backend + frontend). |
| **Bonus - Monitoring** | Ajoutez des logs structurés et des métriques de performance (temps de réponse API, temps de rendu frontend, etc.). |
| **Bonus - Documentation API** | Créez une documentation OpenAPI/Swagger pour votre API. |
| **Bonus - SEO** | Optimisez le SEO de la page (meta tags, structured data, sitemap). |

## Résumé des Livrables

Votre fork devra contenir :

- Le code full-stack fonctionnel (backend sur port 4200, frontend sur port 3000).
- L'API Express avec Router et les endpoints améliorés (pagination, filtres, tri).
- Les composants frontend fonctionnels (Hero, liste formations, filtres).
- Un module de validation des données qui détecte et gère les problèmes dans homepage.json.
- Un middleware de gestion d'erreurs robuste et sécurisé (backend et frontend).
- Le mécanisme de cache asynchrone implémenté et justifié, avec gestion des race conditions.
- Toutes les vulnérabilités de sécurité identifiées et corrigées.
- Optimisations frontend (lazy loading, cache, performance).
- Un historique Git propre (min. 8 commits représentant chaque étape majeure).
- Un fichier README.md détaillé.
- Un fichier JUSTIFICATION.md (ou section dans le README) expliquant le défaut de l'approche synchrone, les problèmes de concurrence, et votre solution.
- Des tests unitaires complets (min. 10 tests) couvrant le code backend, frontend, et les cas limites.
- (Bonus) Les fichiers Docker.
- (Bonus) Documentation API (OpenAPI/Swagger).
- (Bonus) Logs structurés et métriques de performance.
- (Bonus) Optimisations SEO.

## Installation

```bash
npm install
```

## Démarrage

```bash
# Démarrer backend et frontend
npm run dev

# Ou séparément
npm run dev:backend    # Port 4200
npm run dev:frontend   # Port 3000
```

## Endpoints API (À compléter)

À compléter par l'alternant après l'implémentation...

## Problèmes à résoudre

1. Le projet ne démarre pas - problèmes de configuration (backend et frontend)
2. Migration vers Express.js nécessaire
3. Configuration frontend à corriger
4. Implémentation d'un système de cache requis (synchrone puis asynchrone)
5. Problèmes de sécurité à identifier et corriger (CORS, exposition d'erreurs, validation, XSS)
6. Problèmes de qualité des données dans homepage.json (doublons, champs manquants)
7. Problèmes de performance (chargement du fichier à chaque requête, pas de pagination)
8. Gestion d'erreurs insuffisante (backend et frontend)
9. Absence de validation des inputs
10. Optimisations frontend nécessaires

## Tests

```bash
npm test
```

## Documentation

## Configuration et Démarrage

### Backend

1. Rendez-vous dans le dossier `backend/` :
    ```bash
    cd backend
    npm install
    npm run dev
    ```
2. Le backend utilise Express.js et charge le contenu de la page d'accueil depuis `data/homepage.json` via un mécanisme de cache asynchrone.

### Frontend

1. Rendez-vous dans le dossier `frontend/` :
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
2. Le frontend est développé avec React (Vite) et communique avec l'API backend via un proxy configuré dans `vite.config.js`.

## Endpoints API

### Liste des endpoints principaux

- `GET /api/content/homepage` :
   - Retourne le contenu complet de la page d'accueil (titre, description, formations, etc.).
   - Prend en charge la pagination (`?page=1&limit=6`), les filtres (`?category=cybersecurite&level=avance`), et le tri (`?sort=date&order=desc`).
   - Valide et sanitize tous les paramètres d'entrée.
   - Exemples :
      - `/api/content/homepage?page=2&limit=4`
      - `/api/content/homepage?category=devops&level=debutant&sort=title&order=asc`

### Gestion des erreurs

- Retourne des codes HTTP appropriés (400, 404, 500, etc.)
- Les erreurs techniques ne sont jamais exposées en production.

## Architecture Frontend

Le frontend est structuré autour de composants React :

- `Hero.jsx` : Affiche la section principale (titre, description, call-to-action).
- `Formations.jsx` : Liste paginée des formations, gère l'affichage, le chargement et les erreurs.
- `Filtres.jsx` : Permet de filtrer les formations par catégorie et niveau.
- Gestion d'état :
   - Utilisation de hooks React (`useState`, `useEffect`) pour gérer le chargement, les erreurs et les données.
   - Optimisation des performances avec `useMemo` et `useCallback`.
   - (Bonus) Utilisation possible de React Query/SWR pour la mise en cache des requêtes API.

## Mécanisme de Mise en Cache (Backend)

Le backend utilise un module de cache asynchrone pour charger et servir le contenu de `homepage.json` :

- **Chargement initial** : Le fichier est chargé en mémoire au démarrage du serveur.
- **Mise à jour automatique** :
   - Le cache est surveillé via `fs.watch` ou rechargé périodiquement (ex : toutes les 30 secondes).
   - Si le fichier est modifié, le cache est mis à jour de façon asynchrone, sans bloquer l'Event Loop.
   - Les accès concurrents sont gérés pour éviter les race conditions (verrouillage ou file d'attente lors du rechargement).
- **Métriques** :
   - Nombre de hits/misses du cache, temps de chargement, exposés dans les logs ou via un endpoint dédié (bonus).
- **Avantages** :
   - Ne bloque jamais l'Event Loop.
   - Permet de mettre à jour le contenu sans redémarrer le serveur.
   - Minimise les lectures disque inutiles.

Pour plus de détails sur la justification technique et la comparaison avec l'approche synchrone, voir le fichier `JUSTIFICATION.md`.
