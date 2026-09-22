import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenClaims, UserProfile } from '../models';

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

/** Ce que l'ecran de connexion a besoin de distinguer pour ecrire un message utile. */
export type AuthErrorCode = 'invalid_credentials' | 'account_disabled' | 'unavailable';

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
  }
}

/**
 * Session Keycloak, obtenue depuis nos propres ecrans.
 *
 * Le mobile passe par expo-auth-session, donc par les pages de Keycloak. Le web
 * ne les affiche pas : sortir du site pour se connecter, revenir, puis en
 * ressortir pour changer son mot de passe casse le fil, et l'ecran de Keycloak
 * n'a rien de BagBuddy. On utilise donc le grant `password` (« direct access
 * grant ») du client public `bagbuddy-web`, en echangeant identifiants contre
 * jetons depuis le formulaire maison.
 *
 * Ce que ce choix coute, a savoir explicitement : le mot de passe transite par
 * notre code au lieu de n'etre connu que de Keycloak, et ce grant ne sait pas
 * porter de MFA ni de federation (Google, Apple). Le jour ou l'un des deux est
 * necessaire, il faut revenir au flux redirection — le client Keycloak garde
 * ses redirectUris pour ca, il suffit de reactiver `standardFlowEnabled`.
 *
 * Le reste ne bouge pas : jetons dans localStorage, session rejouee au demarrage
 * par le provideAppInitializer, rafraichissement a la demande.
 */
@Service()
export class AuthService {
  private readonly session = signal<StoredSession | null>(null);
  private refreshInFlight: Promise<string> | null = null;

  readonly userInfo = signal<TokenClaims | null>(null);
  readonly isSignedIn = computed(() => this.session() !== null);
  /** Faux tant que la session stockee n'a pas ete rechargee au demarrage. */
  readonly isReady = signal(false);

  private get tokenEndpoint(): string {
    return `${environment.keycloakUrl}/protocol/openid-connect/token`;
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

  /** Ouvre une session. Leve une AuthError : l'ecran en tire son message. */
  async signIn(username: string, password: string): Promise<void> {
    const tokens = await this.postToken(
      new URLSearchParams({
        grant_type: 'password',
        client_id: environment.keycloakClientId,
        username,
        password,
        scope: 'openid profile email',
      }),
    );
    this.storeSession(tokens);
    await this.loadUserInfo();
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

  /**
   * Force un jeton neuf. A appeler apres un changement d'identite : les claims
   * du jeton courant (email, nom) datent d'avant la modification.
   */
  async refreshTokens(): Promise<void> {
    const session = this.session();
    if (!session) return;
    await this.refresh(session.refreshToken);
  }

  /**
   * Ferme la session : localement d'abord, puis on revoque le refresh token.
   * Sans flux redirection il n'y a pas de cookie SSO a nettoyer chez Keycloak,
   * donc plus de sortie du site pour se deconnecter. Si la revocation echoue,
   * l'utilisateur est deja deconnecte ici : on ne le retient pas pour autant.
   */
  async signOut(): Promise<void> {
    const session = this.session();
    this.clearSession();
    if (!session) return;
    try {
      await fetch(`${environment.keycloakUrl}/protocol/openid-connect/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: environment.keycloakClientId,
          refresh_token: session.refreshToken,
        }).toString(),
      });
    } catch {
      // Hors ligne : la session locale est deja effacee, le refresh token
      // expirera de lui-meme.
    }
  }

  /**
   * Recharge le profil : identite depuis Keycloak, puis complements applicatifs
   * depuis userservice.
   *
   * Keycloak ne connait ni la bio, ni la localisation, ni le telephone — c'est
   * userservice qui les porte, et la query `me` cree le profil au premier appel
   * a partir des claims du token. On appelle en fetch et non via HttpClient
   * pour eviter la dependance circulaire avec l'intercepteur, qui depend de ce
   * service.
   */
  async loadUserInfo(): Promise<void> {
    const token = await this.getValidAccessToken();
    if (!token) return;
    const response = await fetch(`${environment.keycloakUrl}/protocol/openid-connect/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('userinfo a echoue');
    const identity = (await response.json()) as TokenClaims;
    this.userInfo.set({ ...identity, ...(await this.loadAppProfile(token)) });
  }

  /**
   * Complements portes par userservice. Une panne de ce service ne doit pas
   * deconnecter l'utilisateur : on retombe sur la seule identite Keycloak.
   */
  private async loadAppProfile(token: string): Promise<Partial<TokenClaims>> {
    try {
      const response = await fetch(`${environment.apiUrl}/users/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: '{ me { bio location phone } }' }),
      });
      if (!response.ok) return {};
      // GraphQL repond 200 meme en echec : une panne se lit dans errors[], et ne
      // doit pas plus deconnecter qu'un 500 ne le faisait.
      const body = (await response.json()) as {
        data?: { me?: UserProfile | null } | null;
        errors?: unknown[];
      };
      if (body.errors?.length) return {};
      const profile = body.data?.me;
      if (!profile) return {};
      return { bio: profile.bio, location: profile.location, phone: profile.phone };
    } catch {
      return {};
    }
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
    let response: Response;
    try {
      response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
    } catch {
      throw new AuthError('unavailable');
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error_description?: string;
      } | null;
      throw new AuthError(this.errorCode(response.status, payload?.error_description));
    }
    return (await response.json()) as TokenResponse;
  }

  /**
   * Keycloak repond `invalid_grant` aussi bien pour un mot de passe faux que
   * pour un compte desactive ou temporairement bloque apres trop d'essais : le
   * detail n'est que dans la description.
   */
  private errorCode(status: number, description?: string): AuthErrorCode {
    if (description && /disabled|not fully set up|temporarily/i.test(description)) {
      return 'account_disabled';
    }
    return status === 400 || status === 401 ? 'invalid_credentials' : 'unavailable';
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
}
