import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { type ErrorRequestHandler } from 'express';
import { randomBytes } from 'node:crypto';
import { extname, join } from 'node:path';
import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Valeur de `ngCspNonce` dans index.html. Angular la recopie au build sur ses
 * scripts et styles inline (contrat d'event replay, chargement de la feuille
 * de style critique) ; chaque reponse HTML la remplace par un nonce neuf.
 */
const NONCE_PLACEHOLDER = '__CSP_NONCE__';

/** Origine d'une URL absolue de l'environnement ; une URL relative est deja couverte par 'self'. */
function originOf(url: string): string[] {
  return URL.canParse(url) ? [new URL(url).origin] : [];
}

/**
 * Politique de securite du contenu, en en-tete : `security.autoCsp` refuse de
 * se combiner avec le SSR, et `frame-ancestors` ne passe pas par `<meta>`.
 *
 * Scripts : les fichiers servis par l'app, les scripts inline qui portent le
 * nonce, et Stripe.js — charge a la demande, il est autorise par son origine.
 * Styles : `'unsafe-inline'` reste, un nonce ne couvrirait pas les attributs
 * `style` que posent Angular et Stripe ; l'injection de style ne donne pas
 * d'execution de code.
 *
 * Stripe : origines de https://docs.stripe.com/security/guide#content-security-policy,
 * limitees a ce que le Payment Element utilise (pas de Maps).
 *
 * Calculee une fois, coupee autour du nonce : seul lui change d'une reponse a l'autre.
 */
const [CSP_BEFORE_NONCE, CSP_AFTER_NONCE] = [
  "default-src 'self'",
  "script-src 'self' 'nonce-{nonce}' https://js.stripe.com https://*.js.stripe.com",
  // Google Fonts : feuille distante en dev, inlinee par le build de production.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://*.stripe.com",
  [
    "connect-src 'self'",
    ...originOf(environment.apiUrl),
    ...originOf(environment.keycloakUrl),
    'https://api.stripe.com',
  ].join(' '),
  'frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
]
  .join('; ')
  .split('{nonce}');

/**
 * Pose le nonce de la requete dans le HTML et la CSP qui l'autorise. Les
 * reponses non HTML (fichiers, erreurs de validation) passent telles quelles.
 */
async function withCsp(response: Response): Promise<Response> {
  if (!response.headers.get('content-type')?.includes('text/html')) return response;

  const nonce = randomBytes(16).toString('base64');
  const html = (await response.text()).replaceAll(NONCE_PLACEHOLDER, nonce);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('etag');
  // Un cache partage servirait le meme nonce a tous : on le reserve au navigateur,
  // qui revalide. Pas `no-store`, qui priverait les retours Stripe du back/forward cache.
  headers.set('cache-control', 'private, no-cache');
  headers.set('content-security-policy', `${CSP_BEFORE_NONCE}${nonce}${CSP_AFTER_NONCE}`);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Vrai pour une page HTML du build. Le chemin est decode et mis en minuscules
 * comme le fait `express.static` avant de chercher le fichier : sans ca,
 * `/index.csr%2Ehtml` ou `/INDEX.CSR.HTML` (disque insensible a la casse)
 * passeraient sans CSP. Un encodage invalide reste a `express.static`, qui
 * le refuse (400) sans rien servir.
 */
function isHtmlPath(path: string): boolean {
  try {
    return extname(decodeURIComponent(path)).toLowerCase() === '.html';
  } catch {
    return false;
  }
}

/**
 * Serve static files from /browser, sauf les pages HTML : elles portent le
 * marqueur de nonce et passent par le rendu Angular ci-dessous.
 */
const serveStatic = express.static(browserDistFolder, {
  maxAge: '1y',
  index: false,
  redirect: false,
});
app.use((req, res, next) => (isHtmlPath(req.path) ? next() : serveStatic(req, res, next)));

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? withCsp(response) : null))
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Reponse d'erreur sans detail : celle d'Express affiche la pile et les chemins
 * du serveur tant que `NODE_ENV` n'est pas `production`. Une URL mal encodee
 * (`%2G`) fait lever le routeur d'Angular : c'est une requete invalide, pas une panne.
 */
const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof URIError) {
    res.status(400).type('text/plain').send('Bad Request');
    return;
  }
  console.error(error);
  res.status(500).type('text/plain').send('Internal Server Error');
};
app.use(errorHandler);

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
