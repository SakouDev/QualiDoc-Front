# QualiDoc — Front

<img src="https://raw.githubusercontent.com/SakouDev/QualiDoc-API/master/QualiDoc.jpg" alt="Logo QualiDoc" width="500">

Interface Vue 3 pour QualiDoc, une plateforme de prise de rendez-vous médicaux.
Test technique développeur full-stack pour QualiJob.

Le back associé (CodeIgniter 4) se trouve dans le repo [qualidoc-api](https://github.com/SakouDev/QualiDoc-API).

## Stack technique

- **Vue 3** (Composition API) + **Vite** + **TypeScript**
- **Nuxt UI 4** en mode standalone (composants seuls, pas le framework Nuxt.js)
- **Pinia** pour l'état d'authentification
- **Tailwind CSS v4**

## Choix techniques

- **Nuxt UI en standalone plutôt que Nuxt.js complet** : le sujet impose Vue.js, pas Nuxt — utiliser les composants Nuxt UI seuls donne une bibliothèque de composants cohérente et accessible sans embarquer tout le framework (SSR, routing fichier, etc.) dont ce projet n'a pas besoin.
- **Renouvellement/expiration du token** (§5.2) : pas de refresh silencieux. Un intercepteur Axios ([ApiService.ts](src/api/ApiService.ts)) surveille les réponses 401 (token expiré ou invalide), déconnecte l'utilisateur et le renvoie sur `/login`. Simple, suffisant pour une durée de vie de 15 jours, et évite la complexité d'un flux de refresh token pour ce périmètre.
- **Recherche insensible aux accents** : normalisation Unicode côté client ([normalize.ts](src/utils/normalize.ts)) pour que "generaliste" trouve "Généraliste".

## Installation

### Prérequis

- Node.js 22.18+ ou 24.12+
- npm

### Étapes

```bash
npm install
npm run dev
```

L'app est disponible sur `http://localhost:5173`. Le fichier `.env` (déjà présent, pas de secret dedans) pointe vers l'API :

```
VITE_API_URL=http://localhost:8080/api
```

Adapte cette URL si ton API tourne ailleurs.

## Gestion des disponibilités (bonus)

Onglet dédié dans l'espace admin ([DisponibilitesPanel.vue](src/components/admin/DisponibilitesPanel.vue)) : sélectionner un médecin affiche ses créneaux (planning par défaut auto-généré à sa création), avec ajout/suppression de plages horaires.

## Avec Docker (bonus)

```bash
docker network create qualidoc
docker compose up -d --build
```

Nécessite que l'API (`qualidoc-api`, même réseau `qualidoc`) tourne aussi — voir son README. Une fois les deux lancés, le front est sur `http://localhost:5173` comme en local.

## Organisation Git

Une branche par fonctionnalité, mergée sur `master` via pull request —
`master` est protégée (PR obligatoire, force-push bloqué).

## Authentification

Toutes les routes sauf `/login` et `/register` nécessitent d'être connecté (redirection automatique sinon). `/admin` nécessite en plus un compte admin.

Comptes de test seedés dans `schema.sql` :

| Rôle    | Email                       | Mot de passe |
|---------|------------------------------|---------------|
| Admin   | `admin@qualidoc.fr`          | `password`    |
| Patient | `luc.dupont@example.com`     | `password`    |

## Limites connues

- `src/stores/auth.ts` lit `localStorage.patient` sans `try/catch` autour du `JSON.parse` : si cette donnée est corrompue (extension navigateur, écriture partielle), l'app plante entièrement au démarrage plutôt que de se rattraper proprement. Cas limite peu probable en usage normal, identifié en stress-test.

## Pistes d'amélioration

- Génération automatique des disponibilités d'un médecin à partir d'un planning hebdomadaire récurrent + jours "off" déclarés, plutôt que blocs à saisir un par un dans le panel admin.
- Tests automatisés (composants critiques : recherche, réservation, auth).
