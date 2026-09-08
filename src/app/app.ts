import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { I18nService } from './core/i18n/i18n.service';
import { ThemeService } from './core/theme.service';
import { AppNav } from './shared/ui/app-nav';
import { DialogHost } from './shared/ui/dialog-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNav, DialogHost],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  constructor() {
    // Instancie le service : c'est lui qui applique le theme des le demarrage.
    inject(ThemeService);
  }
}
