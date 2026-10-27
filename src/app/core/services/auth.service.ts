import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, ForgotPasswordRequest, LoginRequest, MessageResponse, ResetPasswordRequest } from '../../models/user.model';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'cardio_auth_token';
  private readonly USER_KEY = 'cardio_auth_user';
  private readonly INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos (HU003)

  public currentUser = signal<AuthResponse | null>(this.getStoredUser());
  private inactivityTimer: any;

  constructor() {
    if (this.isAuthenticated()) {
      this.startInactivityTimer();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.saveSession(response);
      })
    );
  }

  solicitarRecuperacionClave(request: ForgotPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${environment.apiUrl}/auth/recuperar-clave`, request);
  }

  restablecerClave(request: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${environment.apiUrl}/auth/restablecer-clave`, request);
  }

  logout(reason?: string): void {
    this.clearInactivityTimer();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);

    if (reason) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión caducada',
        text: reason,
        confirmButtonColor: '#0284C7'
      });
    }

    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private saveSession(auth: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, auth.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(auth));
    this.currentUser.set(auth);
    this.startInactivityTimer();
  }

  private getStoredUser(): AuthResponse | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  // HU003 Escenario 3: Cierre de sesión automático por inactividad tras 30 minutos
  public resetInactivityTimer(): void {
    if (this.isAuthenticated()) {
      this.clearInactivityTimer();
      this.startInactivityTimer();
    }
  }

  private startInactivityTimer(): void {
    this.inactivityTimer = setTimeout(() => {
      this.logout('Su sesión ha caducado automáticamente por motivos de seguridad tras 30 minutos de inactividad.');
    }, this.INACTIVITY_TIME);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
}
