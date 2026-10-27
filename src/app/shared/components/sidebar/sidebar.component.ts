import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="w-64 bg-white text-slate-700 min-h-screen flex flex-col justify-between border-r border-slate-200 shrink-0 py-6 px-4 select-none">
      <!-- Sección Superior: Logo Oficial y Enlaces -->
      <div class="space-y-8">
        <!-- Logo Oficial de Marca PonteCorazonPe en Rojo -->
        <div class="px-3 flex items-center space-x-2.5">
          <svg
            class="w-8 h-8 text-brand shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            aria-hidden="true"
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
            <polyline
              points="3 12 8 12 10 8 13 16 15 11 17 12 21 12"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="text-xl font-bold tracking-tight text-brand whitespace-nowrap">
            PonteCorazonPe
          </span>
        </div>

        <!-- Enlaces Principales -->
        <nav class="space-y-1.5">
          <!-- 1. Pacientes (Dashboard) -->
          <a
            routerLink="/triage"
            routerLinkActive="bg-rose-50 text-brand font-bold"
            class="flex items-center px-3.5 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition group"
          >
            <svg class="w-5 h-5 mr-3 transition group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Pacientes
          </a>

          <!-- 2. Flujos (Process Mining) -->
          <a
            routerLink="/process-audit"
            routerLinkActive="bg-rose-50 text-brand font-bold"
            class="flex items-center px-3.5 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition group"
          >
            <svg class="w-5 h-5 mr-3 transition group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <path d="M18 9a9 9 0 0 1-9 9"></path>
            </svg>
            Flujos
          </a>

          <!-- 3. Ajustes (ajustes-medicos.png) -->
          <a
            routerLink="/ajustes"
            routerLinkActive="bg-rose-50 text-brand font-bold"
            class="flex items-center px-3.5 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition group"
          >
            <svg class="w-5 h-5 mr-3 transition group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Ajustes
          </a>
        </nav>
      </div>

      <!-- Sección Inferior: Cerrar Sesión -->
      <div class="pt-4 border-t border-slate-100">
        <button
          (click)="logout()"
          class="w-full flex items-center px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-brand transition group"
        >
          <svg class="w-5 h-5 mr-3 text-slate-400 group-hover:text-brand transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  private authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
