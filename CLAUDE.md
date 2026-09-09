You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## Ce projet

Front web de BagBuddy, place de marché de kilos de bagage entre voyageurs.
C'est le portage web de l'app mobile Expo (repo `BagBuddy`, dossier `front/`) ;
le backend microservices Spring Boot vit dans un repo séparé, `bagbuddy-back`.
Voir [README.md](README.md) pour lancer les deux ensemble.

### Design

La direction artistique vient de l'app mobile — bleu ciel de marque, cartes à
coins 16px, pastilles de statut teintées, bandeau dégradé, codes aéroport comme
motif récurrent — mais la mise en page est pensée pour le web, pas transposée
telle quelle. `theme/Colors.js`, `theme/Fonts.js` et `theme/Styles.js` sont
devenus des tokens CSS dans [src/styles.css](src/styles.css) (`--bb-*`), et
chaque composant partagé porte en commentaire le fichier mobile dont il est le
portage, avec ce qui a été adapté et pourquoi.

Les teintes de marque (cyan `#0EA5E9`, vert, rouge, ambre) ne passent pas WCAG
AA en texte : chaque rôle a donc une déclinaison « encre » (`--bb-primary`,
adaptée au thème — elle s'éclaircit en sombre) pour le texte et les icônes, et
une déclinaison « surface » (`--bb-primary-strong`, identique dans les deux
thèmes) pour les fonds qui portent du texte blanc. **Une couleur passée en fond
d'un élément à texte blanc doit toujours être la variante `-strong`** : c'est
l'erreur qui revient (segment actif, onglet de nav, bouton plein). Les aplats
teintés (`--bb-cyan-a10`, etc.) gardent la teinte brute.

Typographie : Barlow, plus Barlow Condensed pour les codes aéroport, horaires et
montants (classes `.bb-code`, `.bb-time`, `.bb-amount`, chiffres tabulaires).
C'est une grotesque de signalétique de transport — même caractère neutre que la
police système du mobile, choisie pour le sujet.

Adaptations web à conserver :

- l'annonce est une **carte d'embarquement** horizontale (trajet / perforation /
  talon), qui repasse en pile sous 900px — c'est le seul endroit où le design
  prend un risque, le reste reste sobre ;
- les filtres sont un **rail persistant** à partir de 1024px et une modale en
  dessous ([shared/ui/filters.ts](src/app/shared/ui/filters.ts)) ;
- les listes de transactions sont **tabulaires** : les colonnes viennent du token
  `--bb-tx-columns`, partagé par l'en-tête et les lignes — modifier l'un sans
  l'autre casse l'alignement ;
- détail de transaction, profil et formulaire d'annonce sont en **deux colonnes**
  avec une colonne collante (`.bb-rail-sticky`) qui garde les actions visibles ;
- les sélecteurs de mode (`bb-segmented`) sont bornés en largeur sur desktop :
  pleine largeur est un réflexe mobile ;
- le fond de page est `#F8FAFC` et les cartes blanches, là où le mobile est tout
  blanc — sans ça les cartes disparaissent sur grand écran ;
- les écrans d'accès (`/signin`, `/signup`) reprennent la carte d'embarquement :
  formulaire côté trajet, talon perforé à droite
  ([features/auth/auth-shell.ts](src/app/features/auth/auth-shell.ts)) ;
- le choix d'aéroport ([shared/ui/airport-input.ts](src/app/shared/ui/airport-input.ts))
  est une liste maison et non un `<datalist>` : le natif n'ouvrait rien tant
  qu'on n'avait pas tapé et coupait la liste sans prise sur le défilement. Elle
  s'ouvre au focus et rend 40 aéroports de plus chaque fois qu'on approche du
  bas, au scroll comme aux flèches. Le champ vaut un **code IATA** : on peut
  chercher par ville, mais une saisie qui n'est pas un code connu est effacée au
  blur plutôt que transmise au formulaire.

### Auth

**Le web ne sort jamais vers les pages de Keycloak.** Le mobile ouvre le
navigateur sur l'écran de Keycloak (expo-auth-session) ; ici la connexion,
l'inscription et l'écran de compte sont à nous, aux couleurs de l'app.
[core/auth/auth.service.ts](src/app/core/auth/auth.service.ts) échange donc
directement identifiants contre jetons, avec le grant `password` (direct access
grant) du client public `bagbuddy-web`.

Ce que ce choix coûte, à savoir avant de le reprendre ailleurs : le mot de passe
transite par notre code au lieu de n'être connu que de Keycloak, et ce grant ne
sait porter ni MFA ni fédération (Google, Apple). Le jour où l'un des deux est
nécessaire, il faut revenir au flux redirection — le client Keycloak garde ses
redirect URIs, il suffit de réactiver `standardFlowEnabled` et de réécrire un
écran de callback.

Le reste est inchangé : jetons dans `localStorage`, session rejouée au démarrage
par un `provideAppInitializer`, rafraîchie à la demande par
`getValidAccessToken()`. La déconnexion ne redirige plus non plus : sans flux
navigateur il n'y a pas de cookie SSO chez Keycloak, un POST sur `logout`
révoque le refresh token et on reste dans l'app.

Ce que Keycloak ne peut pas recevoir d'un navigateur — créer un compte, changer
un email, poser un mot de passe — passe par `userservice`, qui relaie vers l'API
d'administration : mutations `register` (seule opération sans jeton),
`updateIdentity` et `changePassword`. Les erreurs portent un `code` stable
(`email_already_used`, `invalid_current_password`, `password_rejected`) dans
`errors[0].extensions.code`, exposé par `GraphQlError.code` : **matcher sur le
code, jamais sur le libellé**. Après un changement d'identité il faut appeler
`refreshTokens()`, sinon les claims du jeton (nom, email) restent ceux d'avant.

L'écran de compte ([features/account](src/app/features/account/account.page.ts))
porte trois formulaires séparés — identité, profil public, mot de passe — parce
qu'ils ne touchent pas les mêmes données et n'ont pas les mêmes conséquences ;
un seul bouton « enregistrer » enverrait un mot de passe à chaque changement de
bio. Il remplace l'ouverture de la console compte de Keycloak, et le mock
`app/edit-profile.js` du mobile (qui n'enregistrait rien).

Comme l'auth est purement navigateur, toutes les routes sont en
`RenderMode.Client` ([src/app/app.routes.server.ts](src/app/app.routes.server.ts)),
sauf la vitrine `/start` qui est préchargée au build : le serveur ne sert que la
coquille.

### L'API est en GraphQL

Un schéma par service, une seule URL en `POST` :
`${apiUrl}/<service>/graphql` (trips, transactions, reviews, users, stripe).
Tout passe par [core/api/graphql.client.ts](src/app/core/api/graphql.client.ts),
qui poste `{ query, variables }` et **transforme `errors[]` en erreur
observable** : GraphQL répond toujours `200`, donc sans lui les `catchError` et
les callbacks `error:` des écrans ne se déclencheraient plus. `GraphQlError`
expose `classification` (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`BAD_REQUEST` — l'ex-statut HTTP) et `code` (l'ex-`ProblemDetail.code`).
`ValidationError` en `classification` n'est pas une erreur utilisateur mais un
bug : la requête ne respecte pas le schéma.

Conséquence sur les écritures : **les payloads sont construits explicitement
dans les services**, jamais relayés tels quels. Ce qu'un type `input` n'expose
pas provoque une `ValidationError` — les écrans passent encore la transaction
entière à `update()`, c'est `TransactionsService` qui ne retient que les statuts,
le poids et les drapeaux d'avis. De même `TripInput` n'accepte ni `userId` ni
`userInfo` (l'identité vient du jeton, seuls bio / localisation / téléphone
passent par `profile`), et `createTransaction` n'accepte que `listingId` et
`weight`.

Deux formes d'instantané utilisateur cohabitent dans
[core/models.ts](src/app/core/models.ts) et ne doivent pas être confondues :
`TokenClaims` (claims OIDC de `auth.userInfo()`, en **snake_case** — c'est le
standard OpenID) et `UserInfoView` (`Listing.userInfo`, `Transaction.buyerInfo`,
`ListingInfo.sellerUserInfo`, en **camelCase** — c'est le schéma GraphQL).

Trois méthodes ne renvoient plus `void` mais le booléen de leur mutation :
`trips.remove()`, `users.register()` et `users.changePassword()`.

`loadAppProfile()` dans `core/auth/auth.service.ts` reste en `fetch` brut (la
dépendance circulaire avec l'intercepteur n'a pas changé) : il poste
`{ me { bio location phone } }` et rend `{}` dès qu'il y a un `errors[]`, pour
qu'une panne de userservice ne déconnecte personne.

### Machine à états des transactions

Le **vocabulaire** des statuts vit ici,
[src/app/core/transaction-status.ts](src/app/core/transaction-status.ts), comme
dans l'app mobile. Ajouter un statut = le déclarer là, ajouter son style dans
`shared/ui/status-badge.ts`, son contenu dans
`features/transaction-detail/status-card.ts`, son cas dans le `@switch` de
`transaction-detail.page.ts` — **et** le répercuter à la main dans l'app mobile
ainsi que dans `bagbuddy.transaction.status` côté back.

Les **transitions**, elles, ne sont plus une affaire de front : le back
(`TransactionStateMachine`) refuse tout passage qui n'est pas une arête de la
machine, et vérifie quel côté a le droit de la franchir — un acheteur ne peut
pas accepter sa propre réservation ni se déclarer payé. Les deux colonnes
bougent ensemble à chaque étape, c'est bien ce que le front envoie.

Corollaire : trois choses ne sont plus à faire côté front, elles seraient sans
effet ou refusées.

| Ce qu'on ne fait plus | Qui s'en charge |
| --- | --- |
| décrémenter `remainingWeight` après une acceptation | le back, sous verrou, quand le vendeur accepte |
| calculer `total` (et envoyer `sellerId` / `buyerId`) | le back, à partir de l'annonce réelle et du token |
| poser `paidAt` à la confirmation de paiement | le webhook Stripe signé, côté back |

En dev local `stripe-service` est éteint, donc `PAYMENTS_REQUIRE_STRIPE=false`
côté back : la confirmation de paiement reste simulée. Pour brancher le vrai
paiement, `core/api/stripe.service.ts` expose déjà `createPaymentIntent()`.

### Profil utilisateur

Keycloak porte l'identité (email, nom, mot de passe) ; `userservice` porte ce
que Keycloak ne connaît pas : bio, localisation, téléphone, compte Stripe.
`AuthService.loadUserInfo()` lit les deux et les fusionne dans le signal
`userInfo`. `core/api/users.service.ts` expose `me()`, `updateMe()` et
`publicProfile(sub)` — ce dernier ne renvoie jamais email ni téléphone.

### i18n

`src/app/core/i18n/en.ts` et `fr.ts` sont repris tels quels des dictionnaires
mobiles ; `fr` est typé `Record<keyof typeof en, string>`, donc les deux fichiers
doivent rester alignés (le build échoue sinon). Les traductions s'utilisent via
`i18n.t('cle')` dans les templates : la langue est un signal, donc l'affichage se
met à jour tout seul.

### Icônes

`src/app/shared/icon/icons.ts` est **généré** depuis `lucide-static` (mêmes
icônes que `lucide-react-native` côté mobile) : ne pas l'éditer à la main, le
régénérer si de nouvelles icônes sont nécessaires.

### Accessibilité

Le rendu a été vérifié avec axe-core (0 violation sur les écrans principaux, en
thème clair et sombre) : garder ce niveau — nom accessible sur chaque bouton
icône, un `h1` par page, contrastes AA vérifiés sur fond teinté aussi.
