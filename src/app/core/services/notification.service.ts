import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Alert, AlertCount } from '../../models/alert.model';
import { AuthService } from './auth.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);

  public unreadCount = signal<number>(0);
  public recentAlerts = signal<Alert[]>([]);
  public bannerAlert = signal<Alert | null>(null);

  private pollingInterval: any;
  private autoDismissTimer: any;
  private dismissedAlertIds = new Set<number>();

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.startPolling();
    }
  }

  startPolling(): void {
    this.refreshAlerts();
    if (!this.pollingInterval) {
      this.pollingInterval = setInterval(() => {
        if (this.authService.isAuthenticated()) {
          this.refreshAlerts();
        }
      }, 15000); // Polling cada 15 segundos para no saturar (HU020)
    }
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }

  refreshAlerts(): void {
    if (!this.authService.isAuthenticated()) return;

    this.http.get<AlertCount>(`${environment.apiUrl}/alertas/contador`).subscribe({
      next: res => this.unreadCount.set(res.totalNoAtendidas),
      error: () => {}
    });

    this.http.get<Alert[]>(`${environment.apiUrl}/alertas/recientes`).subscribe({
      next: alerts => {
        this.recentAlerts.set(alerts);
        // HU020: Mostrar notificación emergente sólo si es NUEVA y no ha sido descartada
        if (alerts.length > 0 && !this.bannerAlert()) {
          const newest = alerts[0];
          if (!this.dismissedAlertIds.has(newest.idAlerta)) {
            this.bannerAlert.set(newest);
            if (this.settingsService.isSoundEnabled()) {
              this.settingsService.playAlertSound();
            }
            // Auto-ocultar suavemente después de 8 segundos
            if (this.autoDismissTimer) clearTimeout(this.autoDismissTimer);
            this.autoDismissTimer = setTimeout(() => {
              this.dismissBanner();
            }, 8000);
          }
        }
      },
      error: () => {}
    });
  }

  // HU020 Escenario 2: Descarte permanente de la alerta para que no vuelva a aparecer repetidamente
  dismissBanner(): void {
    const current = this.bannerAlert();
    if (current) {
      this.dismissedAlertIds.add(current.idAlerta);
    }
    this.bannerAlert.set(null);
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }
}
