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

Le design vient de l'app mobile : `theme/Colors.js`, `theme/Fonts.js` et
`theme/Styles.js` sont transposés en tokens CSS dans [src/styles.css](src/styles.css)
(`--bb-*`), et chaque composant partagé porte en commentaire le fichier mobile
dont il est le portage. Les teintes de marque (cyan `#0EA5E9`, vert, rouge,
ambre) ne passent pas WCAG AA en texte : chaque rôle a donc une déclinaison
« encre » (`--bb-primary`, adaptée au thème) pour le texte et les icônes, et une
déclinaison « surface » (`--bb-primary-strong`) pour les fonds qui portent du
texte blanc. Les aplats teintés (`--bb-cyan-a10`, etc.) gardent la teinte brute.

### Auth

OIDC + PKCE contre Keycloak, écrit à la main dans
[src/app/core/auth/auth.service.ts](src/app/core/auth/auth.service.ts) (portage
de `contexts/AuthContext.js`, qui utilisait expo-auth-session). Les tokens sont
dans `localStorage`, rejoués au démarrage par un `provideAppInitializer`, et
rafraîchis à la demande par `getValidAccessToken()`. Le client Keycloak est
`bagbuddy-web` (public, PKCE), défini dans le realm de `bagbuddy-back`.

Comme l'auth est purement navigateur, toutes les routes sont en
`RenderMode.Client` ([src/app/app.routes.server.ts](src/app/app.routes.server.ts)) :
le serveur ne sert que la coquille.

### Machine à états des transactions

`sellerStatus` / `buyerStatus` sont de simples colonnes texte côté back, qui ne
valide rien : la source de vérité est
[src/app/core/transaction-status.ts](src/app/core/transaction-status.ts), comme
dans l'app mobile. Ajouter un statut = le déclarer là, ajouter son style dans
`shared/ui/status-badge.ts`, son contenu dans
`features/transaction-detail/status-card.ts`, son cas dans le `@switch` de
`transaction-detail.page.ts` — **et** le répercuter à la main dans l'app mobile.

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
