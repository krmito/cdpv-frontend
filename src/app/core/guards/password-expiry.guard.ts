import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const passwordExpiryGuard: CanActivateFn = async (route, state) => {
  if (state.url.includes('/change-password') || state.url.includes('/login')) return true;

  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) return true;

  const status = await firstValueFrom(
    authService.getPasswordStatus().pipe(catchError(() => of({ expirado: false, dias_restantes: 30 })))
  );

  if (status.expirado) {
    router.navigate(['/change-password']);
    return false;
  }

  return true;
};
