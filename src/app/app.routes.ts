import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

/**
 * Meme decoupage que l'app mobile (expo-router) : /start public, le groupe
 * (tabs) devient /home, /transactions, /profile, et les ecrans pousses
 * par-dessus deviennent des routes de premier niveau.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'start' },
  {
    path: 'start',
    loadComponent: () => import('./features/start/start.page').then((m) => m.StartPage),
  },
  {
    path: 'signin',
    loadComponent: () => import('./features/auth/sign-in.page').then((m) => m.SignInPage),
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/sign-up.page').then((m) => m.SignUpPage),
  },
  {
    path: 'forgot-password',
    data: { accessScreen: true },
    loadComponent: () =>
      import('./features/auth/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    // Ouvert depuis le lien de l'email : le jeton est dans le fragment (#...).
    path: 'reset-password',
    data: { accessScreen: true },
    loadComponent: () =>
      import('./features/auth/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    // Lien de verification : connecte ou non, le jeton est dans le fragment.
    path: 'verify-email',
    data: { accessScreen: true },
    loadComponent: () => import('./features/auth/verify-email.page').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transactions/transactions.page').then((m) => m.TransactionsPage),
  },
  {
    path: 'transaction-detail',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transaction-detail/transaction-detail.page').then(
        (m) => m.TransactionDetailPage,
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/account.page').then((m) => m.AccountPage),
  },
  {
    path: 'profile-view/:sub',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile-view/profile-view.page').then((m) => m.ProfileViewPage),
  },
  {
    path: 'listings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/listings/all-listings.page').then((m) => m.AllListingsPage),
  },
  {
    path: 'listings/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/listings/edit-listing.page').then((m) => m.EditListingPage),
  },
  {
    path: 'listings/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/listings/edit-listing.page').then((m) => m.EditListingPage),
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () => import('./features/favorites/favorites.page').then((m) => m.FavoritesPage),
  },
  {
    path: 'alerts',
    canActivate: [authGuard],
    loadComponent: () => import('./features/alerts/alerts.page').then((m) => m.AlertsPage),
  },
  {
    path: 'reviews',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reviews/all-reviews.page').then((m) => m.AllReviewsPage),
  },
  { path: '**', redirectTo: 'start' },
];
