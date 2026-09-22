export const environment = {
  production: false,
  /** API gateway du repo bagbuddy-back (docker compose -f docker-compose.dev.yml up). */
  apiUrl: 'http://localhost:8080',
  /** Realm Keycloak importe par bagbuddy-back/keycloak/import/bagbuddy-realm.json. */
  keycloakUrl: 'http://localhost:8000/realms/bagbuddy',
  /** Client public du front web (grant `password`, voir core/auth/auth.service.ts). */
  keycloakClientId: 'bagbuddy-web',
};
