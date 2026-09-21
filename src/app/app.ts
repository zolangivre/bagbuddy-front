import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { I18nService } from './core/i18n/i18n.service';
import { ThemeService } from './core/theme.service';
import { AppNav } from './shared/ui/app-nav';
import { DialogHost } from './shared/ui/dialog-host';
import { T } from './shared/ui/t';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNav, DialogHost, T],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  /**
   * Route marquee `data: { accessScreen: true }` : elle porte son propre
   * en-tete (bb-auth-shell). La connexion et l'inscription n'en ont pas besoin,
   * elles renvoient un membre connecte vers l'accueil ; un lien de mot de passe
   * oublie, lui, peut etre ouvert par un membre connecte.
   */
  private readonly accessScreen = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) route = route.firstChild;
        return route.data['accessScreen'] === true;
      }),
    ),
    { initialValue: false },
  );

  protected readonly showNav = computed(() => this.auth.isSignedIn() && !this.accessScreen());

  constructor() {
    // Instancie le service : c'est lui qui applique le theme des le demarrage.
    inject(ThemeService);
  }
}
