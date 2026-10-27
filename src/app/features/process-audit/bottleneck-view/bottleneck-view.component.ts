import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessMiningService } from '../../../services/process-mining.service';
import { ConformityReport, ProcessTimes } from '../../../models/process-event.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-bottleneck-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="space-y-6">
      <!-- Filtro por Riesgo -->
      <div class="flex justify-end bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div class="flex items-center space-x-2">
          <span class="text-xs font-semibold text-slate-500">Filtrar por riesgo:</span>
          <select
            [(ngModel)]="filtroRiesgo"
            (change)="loadData()"
            class="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
          >
            <option value="TODOS">Todos los Pacientes</option>
            <option value="CRITICO">Pacientes Críticos</option>
            <option value="MODERADO">Pacientes Moderados</option>
            <option value="NORMAL">Pacientes Estables</option>
          </select>
        </div>
      </div>

      <!-- Sección 1: Tasa de Conformidad de la Ruta Asistencial (HU023) -->
      @if (conformity) {
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Conformidad del Protocolo Clínico (HU023)
              </h3>
              <p class="text-xs text-slate-500">{{ conformity.mensaje }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-semibold text-slate-500">Tasa de Cumplimiento:</span>
              <span
                [ngClass]="conformity.porcentajeCumplimiento >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                class="px-3 py-1 rounded-full text-sm font-black font-mono border"
              >
                {{ conformity.porcentajeCumplimiento }}%
              </span>
            </div>
          </div>

          <!-- Casos con Desvío o Incompletos (HU023 Escenario 1) -->
          @if (conformity.casosIncompletos.length > 0) {
            <div class="mt-4">
              <p class="text-xs font-bold text-slate-700 mb-2">Pacientes con desvíos en el protocolo asistencial:</p>
              <div class="space-y-2">
                @for (caso of conformity.casosIncompletos; track caso.idPaciente) {
                  <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <span class="font-bold text-amber-900">{{ caso.nombrePaciente }}</span>
                      <span class="text-amber-700 ml-1.5">(DNI: {{ caso.dniPaciente }})</span>
                    </div>
                    <span class="text-amber-800 font-medium">{{ caso.motivoDesvio }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Sección 2: Tiempos de Espera y Cuellos de Botella (HU022) -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div class="pb-3 border-b border-slate-100 mb-4">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Auditoría de Tiempos de Espera y Cuellos de Botella (HU022)
          </h3>
          <p class="text-xs text-slate-500">Duración promedio entre etapas asistenciales calculadas con PM4Py</p>
        </div>

        @if (isLoading) {
          <app-loading-spinner message="Calculando tiempos de espera..."></app-loading-spinner>
        } @else if (!times || times.pasos.length === 0) {
          <div class="p-8 text-center text-slate-400 text-xs">
            No se registran suficientes transiciones en el intervalo seleccionado.
          </div>
        } @else {
          <div class="space-y-3">
            @for (paso of times.pasos; track paso.etapaOrigen + paso.etapaDestino) {
              <!-- HU022: Resaltado cromático Rojo (Demora) / Verde (Normal) -->
              <div
                [ngClass]="{
                  'bg-red-50 border-red-300': paso.demorado,
                  'bg-emerald-50 border-emerald-300': !paso.demorado
                }"
                class="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
              >
                <div>
                  <div class="flex items-center space-x-2">
                    <span
                      [ngClass]="paso.demorado ? 'bg-red-500' : 'bg-emerald-500'"
                      class="w-2.5 h-2.5 rounded-full"
                    ></span>
                    <span class="font-bold text-slate-900 text-sm">
                      {{ paso.etapaOrigen }} → {{ paso.etapaDestino }}
                    </span>
                  </div>
                  <p
                    [ngClass]="paso.demorado ? 'text-red-700' : 'text-emerald-700'"
                    class="text-xs mt-1 font-medium"
                  >
                    {{ paso.mensajeEstado }}
                  </p>
                </div>

                <div class="text-right">
                  <div class="font-mono text-base font-black text-slate-900">
                    {{ paso.duracionPromedioMinutos }} min
                  </div>
                  <p class="text-[11px] text-slate-500">
                    Límite esperado: &lt; {{ paso.duracionLimiteNormalMinutos }} min
                  </p>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class BottleneckViewComponent implements OnInit {
  private processService = inject(ProcessMiningService);
  private cdr = inject(ChangeDetectorRef);

  times: ProcessTimes | null = null;
  conformity: ConformityReport | null = null;
  isLoading = true;
  filtroRiesgo = 'TODOS';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.processService.getProcessTimes(this.filtroRiesgo).subscribe({
      next: data => {
        this.times = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });

    this.processService.getConformityReport(this.filtroRiesgo).subscribe({
      next: data => {
        this.conformity = data;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }
}
