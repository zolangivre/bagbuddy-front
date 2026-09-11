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

Le logo, `public/logo.webp` (168×252, ~12 Ko), est un export de
`images/logo.png` du repo mobile (1024×1536, 909 Ko) à 3× sa plus grande taille
affichée (56×84 sur `/start`). Le réexporter depuis ce master plutôt que de
remettre le PNG dans `public/`, et garder à l'`<img>` le ratio 2:3 du fichier.

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
- les chiffres de tête ([shared/ui/stat-card.ts](src/app/shared/ui/stat-card.ts))
  sont des **champs de billet**, pas des cartes : libellé discret au-dessus,
  valeur en Barlow Condensed dessous, filet entre deux champs — la grammaire du
  talon de la carte d'embarquement. Le mobile les met dans des boîtes centrées ;
  sur le bandeau dégradé ces boîtes se voyaient plus que les chiffres. Deux mises
  en page : `stack` (rangée, sur le bandeau) et `inline` (liste libellé / valeur,
  pour une colonne étroite comme l'identité du profil). Les couleurs passent par
  `tone` (`inverse`, `neutral`, `primary`, `success`), jamais par des couleurs
  passées à la main. En `stack`, **le parent pose la grille** et chaque champ est
  une cellule de `subgrid` : les libellés partagent une ligne et les valeurs une
  autre, donc un libellé qui passe à deux lignes décale toutes les valeurs
  ensemble au lieu de casser l'alignement (le parent porte la classe globale
  `.bb-stat-row`). Sur le bandeau, le libellé est en blanc à 0,92 et
  non en gris clair : le dégradé s'éclaircit vers la droite, là où sont les
  champs, et le gris n'y tenait plus 4,5:1 ;
- les pastilles (`bb-badge`) ont par défaut un liseré tiré de la couleur du texte
  (`color-mix` à 22 %) : même contour pour toutes les teintes sans le répéter à
  chaque appel ;
- le choix d'aéroport ([shared/ui/airport-input.ts](src/app/shared/ui/airport-input.ts))
  est une liste maison et non un `<datalist>` : le natif n'ouvrait rien tant
  qu'on n'avait pas tapé et coupait la liste sans prise sur le défilement. Elle
  s'ouvre au focus et rend 40 aéroports de plus chaque fois qu'on approche du
  bas, au scroll comme aux flèches. Le champ vaut un **code IATA** : on peut
  chercher par ville, mais une saisie qui n'est pas un code connu est effacée au
  blur plutôt que transmise au formulaire.

### Changer de langue ne doit rien deplacer

Un texte francais est plus long que son equivalent anglais : tout element
dimensionne sur son libelle change de taille avec la langue, et pousse ses
voisins. La regle ici est qu'un changement de langue **ne change que le texte** —
les boites, les marges et les positions restent identiques.

Deux outils, dans cet ordre :

1. **Repartir la place plutot que la deduire du texte** : colonnes de grille
   egales pour les champs chiffres (`bb-stat-card`, voir Design) et pour les deux
   horaires d'une carte (`.times`), largeur fixe pour la liste de tri
   (`bb-sort-select`), colonne de formulaire bornee sur la carte d'acces
   (`auth-shell`). C'est toujours la premiere reponse : elle vaut aussi pour les
   textes qui ne sont pas des traductions (dates, montants, pseudos).
2. **[shared/ui/t.ts](src/app/shared/ui/t.ts) (`<bb-t key="…" />`)** quand la
   boite doit epouser le libelle : le composant rend *toutes* les langues dans la
   meme cellule de grille, les inactives en `visibility: hidden`. La boite prend
   donc la largeur — et la hauteur, si une langue passe a deux lignes — de la
   plus longue, et seul le texte visible change. `visibility: hidden` sort les
   variantes de l'arbre d'accessibilite, de la recherche dans la page et de la
   selection : un lecteur d'ecran n'entend que la langue courante.
   `[params]` pour une interpolation, `[reserve]` pour un libelle qui alterne
   (« Enregistrer » / « Enregistrement… »).

Les composants partages qui portent un libelle acceptent donc une **cle** plutot
qu'une chaine deja traduite : `bb-stat-card[labelKey]`, `bb-segmented`
(`SegmentedOption.labelKey`), `bb-how-step[titleKey|subtitleKey]`,
`bb-auth-shell[titleKey|ledeKey]`. `bb-button` et `bb-badge` projettent leur
contenu : y placer un `<bb-t>` plutot que de passer `[text]`.

A ne pas envelopper : un paragraphe ou un titre pleine largeur, dont la boite est
deja stable — `{{ i18n.t('cle') }}` suffit, et reserver la place de deux langues
n'y ferait qu'ajouter du blanc.

Ce qui bouge encore, volontairement : les formats localises eux-memes (`06:00 PM`
vs `18:00`, `Dec 1, 2026` vs `1 déc. 2026`) et les libelles qui portent un
nombre. Le texte se recentre dans sa boite, mais la boite, elle, ne bouge plus.

Enfin, deux regles de [styles.css](src/styles.css) tiennent le gabarit : le
composant rendu par le router est passe en `display: block` (un element inconnu
est `inline` par defaut, et toute la page se dimensionnerait alors sur son
contenu), et `.bb-page` porte un `width: 100%` explicite (dans un conteneur flex,
`margin: 0 auto` annule l'etirement). Sans elles, la vitrine `/start` se
redimensionnait de pres de 200px d'une langue a l'autre.

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

L'inscription ([features/auth/sign-up.page.ts](src/app/features/auth/sign-up.page.ts))
sert de modèle pour un formulaire qui écrit :

- **Envoi par `submit()` de Signal Forms.** Une erreur qui désigne un champ
  (`email_already_used`, `password_rejected`) est renvoyée par l'action avec
  son `fieldTree` : elle s'affiche sous le champ, reçoit le focus et s'efface
  dès que la valeur change. Une erreur générale (réseau, service indisponible,
  `BAD_REQUEST` sans code) va dans un signal à part, affiché en tête de
  formulaire : en erreur de soumission, elle bloquerait tout renvoi tant
  qu'aucun champ n'a changé.
- **Pendant l'envoi**, les champs sont désactivés par le schéma
  (`disabled(path, { when })`), le formulaire porte `aria-busy`, et le bouton
  dit l'étape en cours (création puis connexion). Après un échec, le focus va
  au message (`tabindex="-1"`), sinon il resterait sur un bouton désactivé.
- **Validation croisée** avec `validate()` et `valueOf()` (confirmation du mot de
  passe), bornes recopiées de `RegisterRequest` côté back. Les messages sont
  des fonctions (`message: () => i18n.t(…)`) pour suivre la langue.
- **Compte créé, connexion refusée** : ce n'est pas un échec. L'écran le dit et
  envoie vers `/signin?email=…`, qui préremplit l'email et place le focus sur le
  mot de passe — renvoyer le formulaire répondrait « email déjà utilisé ».

`bb-text-field` implémente le contrat de contrôle de Signal Forms : `disabled`,
`required` et `maxLength` viennent de `[formField]`, `focus()` sert à
`focusBoundControl()`, et `touch` est émis au blur **d'un champ rempli
seulement** — un champ traversé vide n'affiche pas « obligatoire », et une erreur
apparue sous le dernier champ au moment du clic décalerait le bouton d'envoi
sous le pointeur.

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

Trois règles pour ne pas payer GraphQL plus cher que REST :

- **Un écran, une requête par schéma.** Plusieurs champs racine d'un même
  service se demandent dans un seul document : `transactions.statsForUser()`
  (nombre, gagné, dépensé) et `reviews.summaryForReviewee()` (avis et moyenne)
  remplacent trois et deux POST. Les méthodes unitaires restent pour qui n'a
  besoin que d'un chiffre.
- **Une mutation renvoie l'objet à jour : s'en servir.** Le détail de
  transaction pose le résultat de `createTransaction` / `updateTransaction` dans
  ses signaux (`show()`), et met à jour la liste d'avis avec le retour de
  `createReview` / `updateReview`. Relire après coup coûtait un aller-retour et
  un écran de chargement.
- **Pas de pagination serveur pour l'instant, un rendu par tranches.** L'accueil
  et les transactions filtrent, trient et totalisent côté client sur la liste
  complète ; `activeTrips` accepte `limit`/`offset` mais sans filtre ni tri, et
  `myTransactions` n'a pas de `limit` — couper la requête fausserait les
  filtres. La lecture reste entière et le DOM est monté 20 (30) cartes à la fois
  par [shared/ui/reveal-more.ts](src/app/shared/ui/reveal-more.ts), la tranche
  repartant à zéro quand la liste filtrée change (`linkedSignal`). Le jour où le
  schéma prend filtres et tri, c'est là qu'on passera à `limit`/`offset`.

**Une lecture en échec ne ressemble pas à une liste vide.** Chaque écran garde
un signal `loadError` alimenté par `loadErrorKey(error)`
([core/api/load-error.ts](src/app/core/api/load-error.ts)) et affiche
`<bb-load-error (retry)="…">` à la place de son état vide : réseau injoignable
(statut 0), service indisponible (502–504 ou code `service_unavailable`), ou
échec générique. Un `NOT_FOUND` garde son propre écran « introuvable ». Tant
que rien n'est chargé, les chiffres de tête affichent « – » et non « 0 ».

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

Le profil public (`/profile-view/:sub`) lit son identité dans
`publicProfile(sub)`, et non plus dans l'instantané d'une annonce : un membre
sans annonce s'y affichait sous son `sub` brut. L'annonce reste en repli, parce
que le profil userservice n'est créé qu'au premier `me` d'un membre — tant qu'il
n'a pas ouvert l'app web, `user(sub)` répond `NOT_FOUND`.

### i18n

`src/app/core/i18n/en.ts` et `fr.ts` sont repris tels quels des dictionnaires
mobiles ; `fr` est typé `Record<keyof typeof en, string>`, donc les deux fichiers
doivent rester alignés (le build échoue sinon). Les traductions s'utilisent via
`i18n.t('cle')` dans les templates : la langue est un signal, donc l'affichage se
met à jour tout seul. `i18n.translateIn(langue, cle)` traduit dans une langue
imposée — c'est ce dont `bb-t` a besoin pour réserver la place de la plus longue
langue (voir « Changer de langue ne doit rien déplacer »).

### Icônes

`src/app/shared/icon/icons.ts` est **généré** depuis `lucide-static` (mêmes
icônes que `lucide-react-native` côté mobile) : ne pas l'éditer à la main, le
régénérer si de nouvelles icônes sont nécessaires.

### Accessibilité

Le rendu a été vérifié avec axe-core (0 violation sur les écrans principaux, en
thème clair et sombre) : garder ce niveau — nom accessible sur chaque bouton
icône, un `h1` par page, contrastes AA vérifiés sur fond teinté aussi.
