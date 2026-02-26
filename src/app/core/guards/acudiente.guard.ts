import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const acudienteGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (user.rol === 'acudiente') {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const staffGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (user.rol === 'acudiente') {
    router.navigate(['/portal/mis-hijos']);
    return false;
  }

  return true;
};
