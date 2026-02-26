import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermisosService } from '../services/permisos.service';

export const permisosGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const permisosService = inject(PermisosService);
  const router = inject(Router);

  const user = authService.currentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // Administrador tiene acceso completo
  if (user.rol === 'administrador') return true;

  const modulo = route.data['modulo'] as string;
  if (!modulo) return true;

  if (permisosService.canView(modulo)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasRole(['administrador'])) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
