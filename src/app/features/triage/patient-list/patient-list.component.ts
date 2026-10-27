import { Component, OnInit, OnDestroy, inject, computed, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientService } from '../../../services/patient.service';
import { SearchStateService } from '../../../core/services/search-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { PatientTriage } from '../../../models/patient.model';
import { NewPatientModalComponent } from '../../patient-management/new-patient-modal/new-patient-modal.component';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NewPatientModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Encabezado Principal y Botón + Agregar Paciente (dashboard.png) -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Monitoreo de Pacientes</h2>
          <p class="text-xs text-slate-500 mt-1 font-medium">
            Visualiza el estado de riesgo cardíaco de los pacientes asignados
          </p>
        </div>
        <button
          (click)="showAddModal = true"
          class="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition active:scale-98 flex items-center justify-center space-x-2 shrink-0"
        >
          <svg class="w-4 h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Agregar Paciente</span>
        </button>
      </div>

      <!-- Tarjetas de Métricas de Resumen (dashboard.png: Pacientes, Riesgo bajo, Riesgo alto) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- Tarjeta 1: Total Pacientes -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-400 block mb-1">Pacientes</span>
            <span class="text-3xl font-black text-slate-900 leading-none">{{ patients.length }}</span>
          </div>
          <div class="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
        </div>

        <!-- Tarjeta 2: Riesgo Bajo -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-400 block mb-1">Riesgo bajo</span>
            <span class="text-3xl font-black text-emerald-600 leading-none">{{ lowRiskCount }}</span>
          </div>
          <div class="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>

        <!-- Tarjeta 3: Riesgo Alto -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-400 block mb-1">Riesgo alto</span>
            <span class="text-3xl font-black text-brand leading-none">{{ highRiskCount }}</span>
          </div>
          <div class="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-brand">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Tarjeta Principal con Tabla o Estado Vacío (dashboard.png / empty-search.png) -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        @if (isLoading) {
          <div class="py-20 text-center">
            <div class="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-xs font-semibold text-slate-400">Actualizando monitoreo de pacientes...</p>
          </div>
        } @else if (filteredPatients.length === 0) {
          <!-- ESTADO VACÍO (empty-search.png) -->
          <div class="py-24 px-6 flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-5">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-black text-slate-900 tracking-tight mb-2">No se encontraron resultados</h3>
            <p class="text-xs text-slate-500 max-w-sm font-medium mb-6">
              No pudimos encontrar ningún paciente que coincida con "{{ searchStateService.searchQuery() }}".
            </p>
            <button
              (click)="clearSearch()"
              class="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition active:scale-98"
            >
              Limpiar búsqueda
            </button>
          </div>
        } @else {
          <!-- TABLA DE MONITOREO CLÍNICO EN TIEMPO REAL (dashboard.png) -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider bg-white">
                  <th class="py-4 px-6">Paciente</th>
                  <th class="py-4 px-6">DNI</th>
                  <th class="py-4 px-6">Pulso Actual</th>
                  <th class="py-4 px-6">Enlace Smarthwatch</th>
                  <th class="py-4 px-6">Riesgo</th>
                  <th class="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                @for (p of filteredPatients; track p.idPaciente) {
                  <tr class="hover:bg-slate-50/60 transition">
                    <!-- Nombre del Paciente -->
                    <td class="py-4 px-6 font-bold text-slate-900">
                      {{ p.nombres }} {{ p.apellidos }}
                    </td>

                    <!-- DNI -->
                    <td class="py-4 px-6 font-medium text-slate-600 font-mono">
                      {{ p.dni }}
                    </td>

                    <!-- Pulso Actual -->
                    <td class="py-4 px-6 font-bold">
                      <div class="flex items-center space-x-2">
                        <!-- Ícono de Onda de Pulso -->
                        <svg
                          [ngClass]="p.enlaceActivo && isHighRisk(p) ? 'text-brand' : 'text-slate-400'"
                          class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>

                        @if (p.enlaceActivo && p.ultimoPulso) {
                          <span [ngClass]="isHighRisk(p) ? 'text-brand' : 'text-slate-900'">
                            {{ p.ultimoPulso }} BPM
                          </span>
                        } @else if (p.ultimoPulso) {
                          <span class="text-slate-400 font-medium">
                            {{ p.ultimoPulso }} BPM
                          </span>
                        } @else {
                          <span class="text-slate-400">-- BPM</span>
                        }
                      </div>
                    </td>

                    <!-- Enlace Smartwatch -->
                    <td class="py-4 px-6">
                      @if (p.enlaceActivo) {
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                          Conectado
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200">
                          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>
                          Desconectado
                        </span>
                      }
                    </td>

                    <!-- Nivel de Riesgo -->
                    <td class="py-4 px-6">
                      @if (!p.enlaceActivo) {
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-slate-400 bg-slate-100">
                          ---
                        </span>
                      } @else if (isHighRisk(p)) {
                        <span class="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold text-brand bg-rose-50 border border-rose-100">
                          Alto
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                          Bajo
                        </span>
                      }
                    </td>

                    <!-- Botón Ver (Abre Ficha Médica) -->
                    <td class="py-4 px-6 text-right">
                      <button
                        (click)="viewPatient(p.idPaciente)"
                        class="px-5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-95"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Modal para Agregar Paciente en 2 Pasos (new-patient-modal-1.png & new-patient-modal-2.png) -->
    @if (showAddModal) {
      <app-new-patient-modal
        (closeModal)="showAddModal = false"
        (patientCreated)="onPatientCreated()"
      ></app-new-patient-modal>
    }
  `
})
export class PatientListComponent implements OnInit, OnDestroy {
  private patientService = inject(PatientService);
  public searchStateService = inject(SearchStateService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  patients: PatientTriage[] = [];
  isLoading = true;
  showAddModal = false;
  private pollInterval: any;

  constructor() {
    // Reacciona en tiempo real a los cambios en el buscador del navbar
    effect(() => {
      const q = this.searchStateService.searchQuery();
      // activa el re-renderizado
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    // Sondeo periódico en tiempo real cada 2 segundos
    this.pollInterval = setInterval(() => {
      this.refreshPatientsSilently();
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  loadPatients(): void {
    this.isLoading = true;
    this.patientService.getTriage().subscribe({
      next: data => {
        this.patients = [...data];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Refresco silencioso en segundo plano para actualizar en tiempo real
   * el estado de enlace Bluetooth, BPM y nivel de riesgo sin recargar la pantalla.
   */
  refreshPatientsSilently(): void {
    this.patientService.getTriage().subscribe({
      next: data => {
        this.patients = [...data];
        this.cdr.markForCheck();
      },
      error: err => {
        console.warn('Aviso al refrescar lista de pacientes en tiempo real:', err);
        if (err.status === 401) {
          this.authService.logout('Sesión no autorizada o expirada. Inicie sesión nuevamente.');
        }
      }
    });
  }

  get filteredPatients(): PatientTriage[] {
    const q = this.searchStateService.searchQuery().toLowerCase().trim();
    if (!q) return this.patients;

    return this.patients.filter(p =>
      p.dni.toLowerCase().includes(q) ||
      p.nombres.toLowerCase().includes(q) ||
      p.apellidos.toLowerCase().includes(q)
    );
  }

  get lowRiskCount(): number {
    return this.patients.filter(p => p.enlaceActivo && !this.isHighRisk(p)).length;
  }

  get highRiskCount(): number {
    return this.patients.filter(p => p.enlaceActivo && this.isHighRisk(p)).length;
  }

  isHighRisk(p: PatientTriage): boolean {
    if (!p.enlaceActivo || !p.ultimoPulso) return false;
    const maxThreshold = p.frecuenciaMax || 100;
    const minThreshold = p.frecuenciaMin || 60;

    // Si el pulso actual se encuentra dentro del rango de umbrales configurado por el médico, está estable (Bajo riesgo)
    if (p.ultimoPulso >= minThreshold && p.ultimoPulso <= maxThreshold) {
      return false;
    }

    // Si excede el máximo o cae por debajo del mínimo, es Alto Riesgo
    return true;
  }

  viewPatient(patientId: number): void {
    this.router.navigate(['/live-monitoring', patientId]);
  }

  clearSearch(): void {
    this.searchStateService.clearQuery();
  }

  onPatientCreated(): void {
    this.loadPatients();
  }
}
