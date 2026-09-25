import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
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
 */
function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://*.js.stripe.com`,
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
  ].join('; ');
}

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
  // Un nonce ne sert qu'une fois : la page ne doit pas etre rejouee depuis un cache.
  headers.set('cache-control', 'no-store');
  headers.set('content-security-policy', contentSecurityPolicy(nonce));
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
 * Serve static files from /browser, sauf les pages HTML : elles portent le
 * marqueur de nonce et passent par le rendu Angular ci-dessous.
 */
const serveStatic = express.static(browserDistFolder, {
  maxAge: '1y',
  index: false,
  redirect: false,
});
app.use((req, res, next) => (req.path.endsWith('.html') ? next() : serveStatic(req, res, next)));

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
