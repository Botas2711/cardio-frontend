import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    // Validar que el usuario sea CARDIOLOGO para acceder al portal web clínico
    if (user && user.rol === 'CARDIOLOGO') {
      return true;
    }
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
