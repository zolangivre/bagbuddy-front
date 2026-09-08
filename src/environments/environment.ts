export const environment = {
  production: false,
  /** API gateway du repo bagbuddy-back (docker compose -f docker-compose.dev.yml up). */
  apiUrl: 'http://localhost:8080',
  /** Realm Keycloak importe par bagbuddy-back/keycloak/import/bagbuddy-realm.json. */
  keycloakUrl: 'http://localhost:8000/realms/bagbuddy',
  /** Client public PKCE cree pour le front web. */
  keycloakClientId: 'bagbuddy-web',
  keycloakAccountConsole: 'http://localhost:8000/realms/bagbuddy/account',
};
