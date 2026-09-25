# BagBuddy — front web

Place de marché de kilos de bagage entre voyageurs : qui prend l'avion avec des
kilos libres les propose, qui veut envoyer ou faire rapporter un colis les
réserve. L'app couvre tout le parcours — recherche d'un vol, réservation,
paiement, messagerie, code de remise du colis, avis.

Portage web de mon app mobile Expo (repo `BagBuddy`), avec un backend
microservices dans un repo séparé (`bagbuddy-back`).

## Stack

**Angular 22** — composants standalone, signaux, Signal Forms, SSR, routes en
lazy loading. **TypeScript strict**, zéro `any`. CSS maison sur des tokens de
design, Tailwind en appoint.

Côté serveur : **API GraphQL** (5 schémas Spring Boot derrière une gateway) et
**Keycloak** pour l'authentification.

## Ce que le projet montre

- **Auth sans sortir de l'app** — connexion, inscription, mot de passe oublié et
  vérification d'email sont nos écrans, pas ceux de Keycloak. Jetons en
  `localStorage`, session rejouée au démarrage, refresh à la demande.
- **Paiement Stripe** — Payment Element, versement au voyageur ou remboursement
  de l'acheteur, code de remise à 5 essais pour clore la transaction.
- **Machine à états** des transactions (demande → acceptée → payée → remise →
  avis), validée côté back, reflétée écran par écran.
- **Bilingue FR/EN sans rien déplacer** — un texte français est plus long que
  l'anglais ; ici les boîtes réservent la place des deux langues, donc changer
  de langue ne change que le texte.
- **Accessibilité** — 0 violation axe-core sur les écrans principaux, en thème
  clair comme en sombre.
- **Thème clair/sombre**, devise EUR/USD, favoris, alertes de trajet.

## Lancer en local

Il faut le backend (Docker) puis le front.

```bash
# 1. backend — voir bagbuddy-back/README.md
cd ../bagbuddy-back
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build -d

# 2. front
npm install
npm start          # http://localhost:4200
```

La base de dev arrive remplie : 5 membres, des annonces et des transactions
dans tous les statuts. Mot de passe partout `Test1234!`, par exemple
`camille.martin@bagbuddy.local`. L'inscription depuis `/signup` marche aussi.

## Commandes

```bash
npm start      # serveur de dev
npm run build  # build de production
npm test       # tests unitaires (vitest)
npm run serve:ssr:bagbuddy-front  # sert le build sur http://localhost:4000
```

Le build de production prend `environment.prod.ts` : API et Keycloak y sont
en chemins relatifs (`/api`, `/auth`), à router par le reverse proxy placé
devant le serveur Node. Sans lui, `serve:ssr` affiche l'app mais n'atteint
pas le backend ; pour développer, rester sur `npm start`.

Le serveur refuse (400) toute requête dont l'en-tête `Host` n'est pas
autorisé : seuls `localhost` et `127.0.0.1` le sont dans `angular.json`.
Déclarer les autres noms, sans `*` : le domaine public en déploiement, une IP
du réseau local pour tester depuis un téléphone, le nom du conteneur pour un
health check Docker.

```bash
NG_ALLOWED_HOSTS=bagbuddy.example.com node dist/bagbuddy-front/server/server.mjs
```

## Organisation du code

```
src/app/
  core/       services sans UI — API GraphQL, auth, i18n, thème, devise
  features/   un dossier par écran, chargé en lazy
  shared/ui/  les briques réutilisables (boutons, pastilles, filtres…)
  styles.css  les tokens de design
```

Les choix d'architecture et de design sont documentés en détail dans
[CLAUDE.md](CLAUDE.md).
