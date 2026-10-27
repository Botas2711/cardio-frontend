import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, SystemSettings } from '../../../core/services/settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-6xl select-none">
      <!-- Encabezado Principal y Botón Guardar Cambios (ajustes-medicos.png) -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Configuración del Sistema
        </h2>

        <button
          type="button"
          (click)="saveChanges()"
          [disabled]="isThresholdInvalid"
          [ngClass]="isThresholdInvalid ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-brand hover:bg-brand-dark text-white cursor-pointer shadow-xs active:scale-95'"
          class="inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition"
        >
          <!-- Ícono de Guardar / Floppy Disk -->
          <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
          </svg>
          <span>Guardar Cambios</span>
        </button>
      </div>

      <!-- Tarjeta 1: Perfil Profesional (ajustes-medicos.png) -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 class="text-base font-bold text-slate-900">Perfil Profesional</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Campo: Nombres -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-2">Nombres</label>
            <input
              type="text"
              [(ngModel)]="nombres"
              placeholder="Ej. Pablo"
              class="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition"
            />
          </div>

          <!-- Campo: Apellidos -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-2">Apellidos</label>
            <input
              type="text"
              [(ngModel)]="apellidos"
              placeholder="Ej. Rojas"
              class="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition"
            />
          </div>

          <!-- Campo: DNI -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-2">DNI</label>
            <input
              type="text"
              [(ngModel)]="dni"
              maxlength="8"
              placeholder="Ej. 91705963"
              class="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition font-mono"
            />
          </div>

          <!-- Campo: Correo electrónico -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-2">Correo electrónico</label>
            <input
              type="email"
              [(ngModel)]="correo"
              placeholder="Ej. pablorojas01@gmail.com"
              class="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition"
            />
          </div>
        </div>
      </div>

      <!-- Tarjeta 2: Gestión de Notificaciones (ajustes-medicos.png) -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <h3 class="text-base font-bold text-slate-900 mb-6">Gestión de Notificaciones</h3>

        <div class="flex items-center justify-between gap-4 py-1">
          <span class="text-sm font-semibold text-slate-800">
            Reproducir sonido al recibir una alerta crítica
          </span>

          <!-- Switch Toggle Verde Esmeralda (#10B981) -->
          <button
            type="button"
            role="switch"
            [attr.aria-checked]="sonidoAlerta"
            (click)="toggleSonidoAlerta()"
            [ngClass]="sonidoAlerta ? 'bg-emerald-500' : 'bg-slate-300'"
            class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            title="Activar/Desactivar sonido"
          >
            <span class="sr-only">Reproducir sonido al recibir una alerta crítica</span>
            <span
              [ngClass]="sonidoAlerta ? 'translate-x-5' : 'translate-x-0'"
              class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>
      </div>

      <!-- Tarjeta 3: Umbrales Clínicos por Defecto (ajustes-medicos.png) -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 class="text-base font-bold text-slate-900">Umbrales Clínicos por Defecto</h3>
          <p class="text-xs text-slate-400 font-medium mt-1">
            Valores base aplicados a nuevos pacientes
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Campo: Límite Mínimo (ppm) -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-2">Límite Mínimo (ppm)</label>
            <input
              type="number"
              [(ngModel)]="frecuenciaMinDefecto"
              (ngModelChange)="validateThresholds()"
              [ngClass]="isThresholdInvalid ? 'border-brand text-brand ring-1 ring-brand' : 'border-slate-200/80 focus:border-brand'"
              class="w-full px-4 py-3 bg-slate-50/70 border rounded-xl text-sm font-medium text-slate-900 outline-none transition"
            />
          </div>

          <!-- Campo: Límite Máximo (ppm) -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-2">Límite Máximo (ppm)</label>
            <input
              type="number"
              [(ngModel)]="frecuenciaMaxDefecto"
              (ngModelChange)="validateThresholds()"
              [ngClass]="isThresholdInvalid ? 'border-brand text-brand ring-1 ring-brand' : 'border-slate-200/80 focus:border-brand'"
              class="w-full px-4 py-3 bg-slate-50/70 border rounded-xl text-sm font-medium text-slate-900 outline-none transition"
            />
          </div>
        </div>

        <!-- Banner de Validación si Umbrales son Inválidos -->
        @if (isThresholdInvalid) {
          <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2.5 text-brand text-xs font-bold animate-in fade-in">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>Rango inválido: el límite máximo debe ser superior al límite mínimo.</span>
          </div>
        }
      </div>
    </div>
  `
})
export class SystemSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  // Perfil Profesional
  nombres = 'Pablo';
  apellidos = 'Rojas';
  dni = '91705963';
  correo = 'pablorojas01@gmail.com';

  // Gestión de Notificaciones
  sonidoAlerta = true;

  // Umbrales Clínicos por Defecto
  frecuenciaMinDefecto = 60;
  frecuenciaMaxDefecto = 100;

  isThresholdInvalid = false;

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    const s = this.settingsService.getSettings();
    this.nombres = s.nombres;
    this.apellidos = s.apellidos;
    this.dni = s.dni;
    this.correo = s.correo;
    this.sonidoAlerta = s.sonidoAlerta;
    this.frecuenciaMinDefecto = s.frecuenciaMinDefecto;
    this.frecuenciaMaxDefecto = s.frecuenciaMaxDefecto;
    this.validateThresholds();
  }

  toggleSonidoAlerta(): void {
    this.sonidoAlerta = !this.sonidoAlerta;
    if (this.sonidoAlerta) {
      this.settingsService.playAlertSound();
    }
  }

  validateThresholds(): void {
    this.isThresholdInvalid = Number(this.frecuenciaMaxDefecto) <= Number(this.frecuenciaMinDefecto);
  }

  saveChanges(): void {
    this.validateThresholds();
    if (this.isThresholdInvalid) {
      Swal.fire({
        icon: 'error',
        title: 'Umbrales Inválidos',
        text: 'El límite máximo debe ser estrictamente mayor que el límite mínimo.',
        confirmButtonColor: '#E11D48'
      });
      return;
    }

    const payload: SystemSettings = {
      nombres: this.nombres.trim() || 'Pablo',
      apellidos: this.apellidos.trim() || 'Rojas',
      dni: this.dni.trim() || '91705963',
      correo: this.correo.trim() || 'pablorojas01@gmail.com',
      sonidoAlerta: this.sonidoAlerta,
      frecuenciaMinDefecto: Number(this.frecuenciaMinDefecto) || 60,
      frecuenciaMaxDefecto: Number(this.frecuenciaMaxDefecto) || 100
    };

    this.settingsService.saveSettings(payload);

    Swal.fire({
      icon: 'success',
      title: 'Cambios Guardados',
      text: 'La configuración del sistema, perfil profesional y umbrales base fueron actualizados con éxito.',
      confirmButtonColor: '#E11D48',
      timer: 2000
    });
  }
}
