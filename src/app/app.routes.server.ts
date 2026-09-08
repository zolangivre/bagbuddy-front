import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * App authentifiee : les tokens et le stockage local ne vivent que dans le
 * navigateur, donc on rend cote client. Le serveur ne sert que la coquille.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
