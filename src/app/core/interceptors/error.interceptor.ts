import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't intercept login errors so the login component can show the exact message (HU001/HU002)
      if (req.url.includes('/api/auth/login')) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        authService.logout('Sesión no autorizada o expirada. Inicie sesión nuevamente.');
      } else if (error.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'No cuenta con los permisos necesarios para realizar esta acción clínica.',
          confirmButtonColor: '#0284C7'
        });
      }

      return throwError(() => error);
    })
  );
};
