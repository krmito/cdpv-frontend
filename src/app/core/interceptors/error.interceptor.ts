import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // No mostrar toast para peticiones de auth (login) ni de escaneo de documentos
      const isAuthRequest = req.url.includes('/auth/');
      const isScanRequest = req.url.includes('/extraer-documento');

      if (!isAuthRequest && !isScanRequest) {
        switch (err.status) {
          case 0:
            toast.error('Sin conexión con el servidor. Verifica tu red.');
            break;
          case 400:
            toast.error(err.error?.message ?? 'Solicitud inválida.');
            break;
          case 401:
            toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
            router.navigate(['/login']);
            break;
          case 403:
            toast.error('No tienes permiso para realizar esta acción.');
            break;
          case 404:
            toast.error('El recurso solicitado no existe.');
            break;
          case 409:
            toast.error(err.error?.message ?? 'El registro ya existe o genera un conflicto.');
            break;
          case 500:
          case 502:
          case 503:
            toast.error('Error interno del servidor. Intenta más tarde.');
            break;
          default:
            if (err.status >= 400) {
              toast.error(err.error?.message ?? 'Ocurrió un error inesperado.');
            }
        }
      }

      return throwError(() => err);
    })
  );
};
