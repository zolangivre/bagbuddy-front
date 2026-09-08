import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UserInfo } from '../models';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
}

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresAt: number;
}

const SESSION_KEY = 'bagbuddy.session';
const VERIFIER_KEY = 'bagbuddy.pkce_verifier';
const RETURN_KEY = 'bagbuddy.return_url';

/**
 * OAuth2 / OIDC avec PKCE contre Keycloak, transpose depuis AuthContext du
 * mobile (expo-auth-session -> redirection navigateur). Les tokens vivent dans
 * localStorage et sont rafraichis a la demande par getValidAccessToken().
 */
@Service()
export class AuthService {
  private readonly session = signal<StoredSession | null>(null);
  private refreshInFlight: Promise<string> | null = null;

  readonly userInfo = signal<UserInfo | null>(null);
  readonly isSignedIn = computed(() => this.session() !== null);
  /** Faux tant que la session stockee n'a pas ete rechargee au demarrage. */
  readonly isReady = signal(false);

  private get tokenEndpoint(): string {
    return `${environment.keycloakUrl}/protocol/openid-connect/token`;
  }

  private get redirectUri(): string {
    return `${window.location.origin}/auth/callback`;
  }

  /** Rejoue la session stockee au demarrage (appele par l'APP_INITIALIZER). */
  async restore(): Promise<void> {
    if (typeof window === 'undefined') {
      this.isReady.set(true);
      return;
    }
    const stored = this.readSession();
    if (stored) {
      this.session.set(stored);
      try {
        await this.loadUserInfo();
      } catch {
        this.clearSession();
      }
    }
    this.isReady.set(true);
  }

  /** Redirige vers la page de login Keycloak (flow code + PKCE). */
  async signIn(returnUrl = '/home'): Promise<void> {
    const verifier = this.randomString(64);
    const challenge = await this.codeChallenge(verifier);
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(RETURN_KEY, returnUrl);

    const params = new URLSearchParams({
      client_id: environment.keycloakClientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    window.location.assign(
      `${environment.keycloakUrl}/protocol/openid-connect/auth?${params.toString()}`,
    );
  }

  /** Echange le code d'autorisation contre des tokens, au retour de Keycloak. */
  async handleCallback(code: string): Promise<string> {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);
    if (!verifier) throw new Error('Code verifier PKCE introuvable');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: environment.keycloakClientId,
      code,
      code_verifier: verifier,
      redirect_uri: this.redirectUri,
    });

    const tokens = await this.postToken(body);
    this.storeSession(tokens);
    await this.loadUserInfo();

    const returnUrl = sessionStorage.getItem(RETURN_KEY) ?? '/home';
    sessionStorage.removeItem(RETURN_KEY);
    return returnUrl;
  }

  /**
   * Accesseur a utiliser avant tout appel API : rafraichit le token s'il est
   * expire, deconnecte si le refresh echoue.
   */
  async getValidAccessToken(): Promise<string | null> {
    const session = this.session();
    if (!session) return null;
    if (Date.now() < session.expiresAt - 5000) return session.accessToken;

    this.refreshInFlight ??= this.refresh(session.refreshToken).finally(() => {
      this.refreshInFlight = null;
    });
    try {
      return await this.refreshInFlight;
    } catch {
      this.clearSession();
      return null;
    }
  }

  async signOut(): Promise<void> {
    const session = this.session();
    this.clearSession();
    const params = new URLSearchParams({
      client_id: environment.keycloakClientId,
      post_logout_redirect_uri: `${window.location.origin}/start`,
    });
    if (session?.idToken) params.set('id_token_hint', session.idToken);
    window.location.assign(
      `${environment.keycloakUrl}/protocol/openid-connect/logout?${params.toString()}`,
    );
  }

  /** Recharge le profil depuis Keycloak (apres edition dans la console compte). */
  async loadUserInfo(): Promise<void> {
    const token = await this.getValidAccessToken();
    if (!token) return;
    const response = await fetch(`${environment.keycloakUrl}/protocol/openid-connect/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('userinfo a echoue');
    this.userInfo.set((await response.json()) as UserInfo);
  }

  private async refresh(refreshToken: string): Promise<string> {
    const tokens = await this.postToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: environment.keycloakClientId,
        refresh_token: refreshToken,
      }),
    );
    this.storeSession(tokens);
    return tokens.access_token;
  }

  private async postToken(body: URLSearchParams): Promise<TokenResponse> {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!response.ok) throw new Error(`Echange de token refuse (${response.status})`);
    return (await response.json()) as TokenResponse;
  }

  private storeSession(tokens: TokenResponse): void {
    const session: StoredSession = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token ?? this.session()?.idToken,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    };
    this.session.set(session);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  }

  private readSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredSession;
      return parsed.refreshToken ? parsed : null;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    this.session.set(null);
    this.userInfo.set(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }

  private randomString(length: number): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
  }

  private async codeChallenge(verifier: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
