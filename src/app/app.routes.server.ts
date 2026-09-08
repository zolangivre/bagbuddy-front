import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * App authentifiee : les tokens et le stockage local ne vivent que dans le
 * navigateur, donc on rend cote client. Le serveur ne sert que la coquille.
 */
export const serverRoutes: ServerRoute[] = [
  // La vitrine est publique et sans donnee utilisateur : on la prerend pour que
  // le premier ecran s'affiche sans attendre le bundle applicatif.
  { path: 'start', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
