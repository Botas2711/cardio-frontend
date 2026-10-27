import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SearchStateService } from '../../../core/services/search-state.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Toast Flotante de Alerta Crítica (Exacto según alert-toast.png) -->
    @if (notificationService.bannerAlert(); as alert) {
      <div class="fixed top-4 right-8 z-50 bg-white rounded-2xl shadow-2xl border-2 border-brand p-3.5 flex items-center justify-between space-x-4 max-w-md w-full transition-all duration-300 animate-in fade-in slide-in-from-top-3">
        <!-- Ícono de Alerta en Contenedor Suave -->
        <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-brand shrink-0">
          <svg class="w-6 h-6 text-brand animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>

        <!-- Información de Paciente y Pulso Crítico -->
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">¡Alerta Crítica!</h4>
          <p class="text-xs text-slate-500 truncate mt-0.5 font-medium">
            {{ alert.nombrePaciente }} — {{ formatAlertType(alert.tipoAlerta) }} ({{ alert.valorRegistrado || '110 BPM' }})
          </p>
        </div>

        <!-- Botón de Acción Abrir y Cerrar -->
        <div class="flex items-center space-x-2 shrink-0">
          <button
            (click)="goToPatient(alert.idPaciente)"
            class="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition active:scale-95"
          >
            Abrir
          </button>
          <button
            (click)="dismissBanner()"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Cerrar notificación"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    }

    <!-- Barra Superior Oficial -->
    <header class="bg-white border-b border-slate-200 text-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-30 select-none">
      <!-- Buscador de Pacientes (dashboard.png / empty-search.png) -->
      <div class="flex items-center w-full max-w-md">
        <div class="relative w-full">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <input
            type="text"
            [ngModel]="searchStateService.searchQuery()"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Buscar paciente por nombre o DNI..."
            class="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-slate-300 focus:outline-none transition"
          />
          @if (searchStateService.searchQuery()) {
            <button
              (click)="clearSearch()"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              title="Limpiar búsqueda"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          }
        </div>
      </div>

      <!-- Acciones de Usuario y Campana de Notificación -->
      <div class="flex items-center space-x-6">
        <!-- Campana de Notificaciones con Desplegable de Alertas Recibidas -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleAlertDropdown($event)"
            class="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition relative"
            title="Ver alertas recibidas"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            @if (notificationService.recentAlerts().length > 0 || notificationService.unreadCount() > 0) {
              <!-- Punto de Alerta Activa -->
              <span class="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-white animate-pulse"></span>
            }
          </button>

          <!-- Menú Desplegable de Alertas Recibidas -->
          @if (showAlertDropdown) {
            <div
              (click)="$event.stopPropagation()"
              class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2"
            >
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center space-x-2">
                  <h4 class="text-sm font-black text-slate-900">Alertas Recibidas</h4>
                  @if (notificationService.recentAlerts().length > 0) {
                    <span class="bg-rose-100 text-brand text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {{ notificationService.recentAlerts().length }}
                    </span>
                  }
                </div>
                <button
                  (click)="showAlertDropdown = false"
                  class="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-xs"
                >
                  ✕
                </button>
              </div>

              <!-- Lista de Alertas -->
              <div class="mt-3 space-y-2 max-h-72 overflow-y-auto">
                @if (notificationService.recentAlerts().length > 0) {
                  @for (alert of notificationService.recentAlerts(); track alert.idAlerta) {
                    <div
                      (click)="goToPatient(alert.idPaciente)"
                      class="p-3 rounded-xl bg-slate-50 hover:bg-rose-50/70 border border-slate-100 hover:border-rose-200 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div class="flex items-center space-x-3 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-rose-100 text-brand flex items-center justify-center shrink-0">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <p class="text-xs font-bold text-slate-900 group-hover:text-brand transition truncate">
                            {{ alert.nombrePaciente }}
                          </p>
                          <p class="text-[11px] text-slate-500 font-medium truncate">
                            {{ formatAlertType(alert.tipoAlerta) }} — Pico {{ alert.valorRegistrado || '110 BPM' }}
                          </p>
                        </div>
                      </div>

                      <button
                        (click)="goToPatient(alert.idPaciente); $event.stopPropagation()"
                        class="ml-2 px-3 py-1 bg-white group-hover:bg-brand group-hover:text-white border border-slate-200 group-hover:border-transparent text-xs font-bold text-slate-700 rounded-lg shadow-2xs transition"
                      >
                        Ver
                      </button>
                    </div>
                  }
                } @else {
                  <div class="py-8 text-center text-slate-400">
                    <svg class="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p class="text-xs font-medium">No hay alertas críticas pendientes</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Perfil Médico Oficial: Dr. [Primer Nombre] [Primer Apellido] -->
        <div class="flex items-center space-x-3 select-none">
          <div class="text-right">
            <p class="text-xs font-bold text-slate-900 leading-tight">{{ doctorDisplayName }}</p>
            <p class="text-[11px] text-slate-400 font-medium leading-tight">Cardiólogo</p>
          </div>
          <div class="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
      </div>
    </header>
  `
})
export class NavbarComponent {
  private authService = inject(AuthService);
  public notificationService = inject(NotificationService);
  public searchStateService = inject(SearchStateService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  showAlertDropdown = false;

  get doctorDisplayName(): string {
    const settings = this.settingsService.getSettings();
    if (settings && settings.nombres && settings.apellidos) {
      const primerNombre = settings.nombres.trim().split(/\s+/)[0];
      const primerApellido = settings.apellidos.trim().split(/\s+/)[0];
      return `Dr. ${primerNombre} ${primerApellido}`;
    }
    const user = this.authService.currentUser();
    if (user && user.nombres && user.apellidos) {
      const primerNombre = user.nombres.trim().split(/\s+/)[0];
      const primerApellido = user.apellidos.trim().split(/\s+/)[0];
      return `Dr. ${primerNombre} ${primerApellido}`;
    }
    return 'Dr. Pablo Rojas';
  }

  formatAlertType(tipo: string | undefined): string {
    if (!tipo || tipo === 'TAQUICARDIA_CRITICA' || tipo === 'TAQUICARDIA') {
      return 'Riesgo detectado';
    }
    if (tipo === 'BRADICARDIA_SEVERA' || tipo === 'BRADICARDIA') {
      return 'Bradicardia';
    }
    return tipo.replace(/_/g, ' ');
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showAlertDropdown = false;
  }

  toggleAlertDropdown(event: Event): void {
    event.stopPropagation();
    this.showAlertDropdown = !this.showAlertDropdown;
  }

  onSearchChange(value: string): void {
    this.searchStateService.setQuery(value);
    if (this.router.url !== '/triage') {
      this.router.navigate(['/triage']);
    }
  }

  clearSearch(): void {
    this.searchStateService.clearQuery();
  }

  goToTriage(): void {
    this.showAlertDropdown = false;
    this.router.navigate(['/triage']);
  }

  dismissBanner(): void {
    this.notificationService.dismissBanner();
  }

  goToPatient(patientId: number): void {
    this.showAlertDropdown = false;
    this.notificationService.dismissBanner();
    this.router.navigate(['/live-monitoring', patientId]);
  }
}

