# BagBuddy — front web

Version web de l'app mobile BagBuddy : une place de marché entre voyageurs qui
ont des kilos libres dans leurs bagages et personnes qui veulent envoyer ou
faire ramener quelque chose depuis l'étranger.

Angular 22 (standalone, signaux, SSR), design repris de l'app mobile Expo.

## Les deux repos

| Repo             | Contenu                                                        |
| ---------------- | -------------------------------------------------------------- |
| `bagbuddy-front` | ce repo — le front web Angular                                  |
| `bagbuddy-back`  | les microservices Spring Boot + Keycloak (Docker Compose)       |

Le front tape sur l'API gateway (`http://localhost:8080`) et s'authentifie
directement auprès de Keycloak (`http://localhost:8000`), en OIDC + PKCE avec le
client public `bagbuddy-web`.

## Lancer en local

**1. Le backend** — voir `bagbuddy-back/README.md`

```bash
cd ../bagbuddy-back
cp .env.example .env      # remplir avec des mots de passe locaux
docker compose -f docker-compose.dev.yml up --build -d
```

**2. Le front**

```bash
npm install
npm start                 # http://localhost:4200
```

**3. Se connecter** avec le compte de test créé automatiquement par Keycloak :

- identifiant : `testuser`
- mot de passe : `Test1234!`

Les URLs du backend et de Keycloak sont dans
[`src/environments/environment.ts`](src/environments/environment.ts). Si tu sers
le front sur un autre port que 4200, mets à jour `CORS_ALLOWED_ORIGINS` côté back
et les redirect URIs du client `bagbuddy-web` dans le realm Keycloak.

## Commandes

```bash
npm start          # serveur de dev
npm run build      # build de production
npm test           # tests unitaires (vitest)
npx tsc --noEmit -p tsconfig.app.json   # vérification de types
npx prettier --write "src/**/*.{ts,html,css}"
```

## Ce que couvre le front

| Route                     | Écran mobile correspondant        |
| ------------------------- | --------------------------------- |
| `/start`                  | `app/start.js` (vitrine + login)  |
| `/home`                   | onglet Accueil (acheter / vendre) |
| `/transactions`           | onglet Transactions               |
| `/transaction-detail`     | `app/transaction-detail.js`       |
| `/profile`                | onglet Profil (+ réglages)        |
| `/profile-view/:sub`      | `app/profile-view.js`             |
| `/listings`, `/listings/new`, `/listings/:id/edit` | `app/all-listing.js`, `app/edit-listing.js` |
| `/reviews`                | `app/all-reviews.js`              |

Le paiement Stripe n'est pas branché : `stripeservice` est désactivé par défaut
côté back (il lui faut de vraies clés). Le bouton « Effectuer le paiement »
confirme la transaction sans débit réel — voir `completePayment()` dans
`src/app/features/transaction-detail/transaction-detail.page.ts`.
