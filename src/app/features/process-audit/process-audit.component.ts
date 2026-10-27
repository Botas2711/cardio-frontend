import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessMiningService } from '../../services/process-mining.service';
import { TelemetryFlow, TelemetryNode, TelemetryTransition } from '../../models/process-event.model';

const BRAND_RED_COLOR = '#E11D48';
const BRAND_GREEN_COLOR = '#10B981';
const BRAND_GRAY_COLOR = '#94A3B8';

@Component({
  selector: 'app-process-audit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 select-none font-sans max-w-7xl mx-auto">
      <!-- Encabezado Principal y Filtro de Riesgo Alto -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">Flujo de Telemetría</h1>
          <p class="text-sm text-slate-500 mt-1 font-medium">
            {{ isHighRiskFilterActive ? 'Filtro activo para situaciones críticas' : 'Monitoreo de tiempos' }}
          </p>
        </div>

        <!-- Botón / Filtro de Riesgo Alto (critical-flow-map.png) -->
        <button
          type="button"
          (click)="toggleHighRiskFilter()"
          [ngClass]="isHighRiskFilterActive
            ? 'bg-[#E11D48] text-white hover:bg-rose-700 shadow-sm border border-transparent'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <!-- Icono de Alerta / Advertencia -->
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Riesgo Alto</span>
        </button>
      </div>

      <!-- Tarjetas de Métricas KPI -->
      <div class="flex flex-wrap items-center gap-5">
        <!-- Tarjeta 1: Total de Eventos / Alertas Críticas -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-5 w-60 shadow-xs">
          <span class="text-xs font-bold text-slate-500 tracking-tight block">
            {{ isHighRiskFilterActive ? 'Alertas Críticas Procesadas' : 'Eventos Telemétricos' }}
          </span>
          <span class="text-3xl font-extrabold text-slate-900 mt-2 block tracking-tight">
            {{ isHighRiskFilterActive ? telemetryFlow.kpi1Valor : telemetryFlow.kpi1Valor }}
          </span>
        </div>

        <!-- Tarjeta 2: Porcentaje de Cumplimiento SLA -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-5 w-60 shadow-xs">
          <span class="text-xs font-bold text-slate-500 tracking-tight block">
            {{ isHighRiskFilterActive ? 'SLA Crítico Alcanzado' : 'Cumplimiento SLA' }}
          </span>
          <span
            [ngClass]="isHighRiskFilterActive ? 'text-[#10B981]' : 'text-[#E11D48]'"
            class="text-3xl font-extrabold mt-2 block tracking-tight"
          >
            {{ telemetryFlow.kpi2Valor }}
          </span>
        </div>
      </div>

      <!-- Contenedor del Grafo de Pipeline Telemétrico -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 md:p-16 min-h-[460px] flex items-center justify-center shadow-xs overflow-x-auto">
        <div class="flex items-center min-w-max py-4 px-2">
          <!-- Nodo 1: Captura Iniciada -->
          <div class="bg-white border border-slate-200/90 rounded-2xl p-5 w-48 shadow-2xs shrink-0 flex flex-col justify-center">
            <h3 class="text-sm font-bold text-slate-900 leading-snug">
              {{ telemetryFlow.nodos[0]?.titulo || '1. Captura Iniciada' }}
            </h3>
            <p class="text-xs text-slate-400 font-medium mt-1 leading-snug">
              {{ telemetryFlow.nodos[0]?.subtitulo || 'Transmisión PPG - App' }}
            </p>
          </div>

          <!-- Flecha 1 -> 2 (120 ms) -->
          <div class="w-32 sm:w-36 shrink-0 flex flex-col items-center justify-center px-1">
            <span
              [ngClass]="isHighRiskFilterActive ? 'text-[#10B981] font-bold' : 'text-slate-600 font-semibold'"
              class="text-xs mb-1.5 text-center leading-none"
            >
              {{ telemetryFlow.transiciones[0]?.etiqueta || '120 ms' }}
            </span>
            <svg class="w-full h-4 overflow-visible" viewBox="0 0 100 12" fill="none">
              <line
                x1="2"
                y1="6"
                x2="92"
                y2="6"
                [attr.stroke]="isHighRiskFilterActive ? BRAND_GREEN_COLOR : BRAND_GRAY_COLOR"
                [attr.stroke-width]="isHighRiskFilterActive ? 2 : 1.5"
              />
              <path
                d="M86 2 L94 6 L86 10"
                [attr.stroke]="isHighRiskFilterActive ? BRAND_GREEN_COLOR : BRAND_GRAY_COLOR"
                [attr.stroke-width]="isHighRiskFilterActive ? 2 : 1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- Nodo 2: Inferencia IA -->
          <div class="bg-white border border-slate-200/90 rounded-2xl p-5 w-48 shadow-2xs shrink-0 flex flex-col justify-center">
            <h3 class="text-sm font-bold text-slate-900 leading-snug">
              {{ telemetryFlow.nodos[1]?.titulo || '2. Inferencia IA' }}
            </h3>
            <p class="text-xs text-slate-400 font-medium mt-1 leading-snug">
              {{ telemetryFlow.nodos[1]?.subtitulo || 'Clasificación - FastAPI' }}
            </p>
          </div>

          <!-- Flecha 2 -> 3 (45 ms) -->
          <div class="w-32 sm:w-36 shrink-0 flex flex-col items-center justify-center px-1">
            <span
              [ngClass]="isHighRiskFilterActive ? 'text-[#10B981] font-bold' : 'text-slate-600 font-semibold'"
              class="text-xs mb-1.5 text-center leading-none"
            >
              {{ telemetryFlow.transiciones[1]?.etiqueta || '45 ms' }}
            </span>
            <svg class="w-full h-4 overflow-visible" viewBox="0 0 100 12" fill="none">
              <line
                x1="2"
                y1="6"
                x2="92"
                y2="6"
                [attr.stroke]="isHighRiskFilterActive ? BRAND_GREEN_COLOR : BRAND_GRAY_COLOR"
                [attr.stroke-width]="isHighRiskFilterActive ? 2 : 1.5"
              />
              <path
                d="M86 2 L94 6 L86 10"
                [attr.stroke]="isHighRiskFilterActive ? BRAND_GREEN_COLOR : BRAND_GRAY_COLOR"
                [attr.stroke-width]="isHighRiskFilterActive ? 2 : 1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- Nodo 3: Alerta Despachada -->
          <div class="bg-white border border-slate-200/90 rounded-2xl p-5 w-48 shadow-2xs shrink-0 flex flex-col justify-center">
            <h3 class="text-sm font-bold text-slate-900 leading-snug">
              {{ telemetryFlow.nodos[2]?.titulo || '3. Alerta Despachada' }}
            </h3>
            <p class="text-xs text-slate-400 font-medium mt-1 leading-snug">
              {{ telemetryFlow.nodos[2]?.subtitulo || 'Notificación - Spring Boot' }}
            </p>
          </div>

          <!-- Flecha 3 -> 4 (Desviación 45 min o Conforme 2 min) -->
          <div class="w-36 sm:w-44 shrink-0 flex flex-col items-center justify-center px-1">
            <!-- Etiqueta de la Flecha 3 -->
            @if (isHighRiskFilterActive) {
              <span class="text-xs font-bold text-[#10B981] mb-1.5 text-center leading-tight">
                {{ telemetryFlow.transiciones[2]?.etiqueta || 'Conforme: 2 min' }}
              </span>
            } @else {
              <div class="text-xs font-bold text-[#E11D48] mb-1.5 text-center leading-tight">
                <div>Desviación: Demora</div>
                <div>Humana 45 min</div>
              </div>
            }

            <svg class="w-full h-4 overflow-visible" viewBox="0 0 100 12" fill="none">
              <line
                x1="2"
                y1="6"
                x2="92"
                y2="6"
                [attr.stroke]="isHighRiskFilterActive ? BRAND_GREEN_COLOR : BRAND_RED_COLOR"
                [attr.stroke-width]="isHighRiskFilterActive ? 2 : 2.5"
              />
              <path
                d="M86 2 L94 6 L86 10"
                [attr.stroke]="isHighRiskFilterActive ? BRAND_GREEN_COLOR : BRAND_RED_COLOR"
                [attr.stroke-width]="isHighRiskFilterActive ? 2 : 2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- Nodo 4: Revisión Médica Cerrada -->
          <div class="bg-white border border-slate-200/90 rounded-2xl p-5 w-48 shadow-2xs shrink-0 flex flex-col justify-center">
            <h3 class="text-sm font-bold text-slate-900 leading-snug">
              {{ telemetryFlow.nodos[3]?.titulo || '4. Revisión Médica Cerrada' }}
            </h3>
            <p class="text-xs text-slate-400 font-medium mt-1 leading-snug">
              {{ telemetryFlow.nodos[3]?.subtitulo || 'Intervención' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProcessAuditComponent implements OnInit {
  private processMiningService = inject(ProcessMiningService);
  private cdr = inject(ChangeDetectorRef);

  readonly BRAND_RED_COLOR = BRAND_RED_COLOR;
  readonly BRAND_GREEN_COLOR = BRAND_GREEN_COLOR;
  readonly BRAND_GRAY_COLOR = BRAND_GRAY_COLOR;

  isHighRiskFilterActive = false;
  isLoading = false;

  telemetryFlow: TelemetryFlow = this.buildDefaultFlow(false);

  ngOnInit(): void {
    this.loadTelemetryData();
  }

  toggleHighRiskFilter(): void {
    this.isHighRiskFilterActive = !this.isHighRiskFilterActive;
    this.loadTelemetryData();
  }

  loadTelemetryData(): void {
    this.isLoading = true;
    this.processMiningService.getTelemetryFlow(this.isHighRiskFilterActive).subscribe({
      next: (flowData: TelemetryFlow) => {
        if (flowData && flowData.nodos && flowData.nodos.length > 0) {
          this.telemetryFlow = flowData;
        } else {
          this.telemetryFlow = this.buildDefaultFlow(this.isHighRiskFilterActive);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        // En caso de corte de red, usar datos de telemetría locales basados en EVENTO_PROCESO
        this.telemetryFlow = this.buildDefaultFlow(this.isHighRiskFilterActive);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildDefaultFlow(isHighRisk: boolean): TelemetryFlow {
    const fixedNodes: TelemetryNode[] = [
      {
        paso: 1,
        idActividad: 'CAPTURA_INICIADA',
        titulo: '1. Captura Iniciada',
        subtitulo: 'Transmisión PPG - App'
      },
      {
        paso: 2,
        idActividad: 'INFERENCIA_IA_COMPLETADA',
        titulo: '2. Inferencia IA',
        subtitulo: 'Clasificación - FastAPI'
      },
      {
        paso: 3,
        idActividad: 'ALERTA_DESPACHADA',
        titulo: '3. Alerta Despachada',
        subtitulo: 'Notificación - Spring Boot'
      },
      {
        paso: 4,
        idActividad: 'REVISION_MEDICA_CERRADA',
        titulo: '4. Revisión Médica Cerrada',
        subtitulo: 'Intervención'
      }
    ];

    if (isHighRisk) {
      const criticalTransitions: TelemetryTransition[] = [
        {
          origen: 'CAPTURA_INICIADA',
          destino: 'INFERENCIA_IA_COMPLETADA',
          duracionMs: 120,
          tiempoTexto: '120 ms',
          etiqueta: '120 ms',
          estadoConformidad: 'CONFORME',
          color: BRAND_GREEN_COLOR,
          esCritico: true
        },
        {
          origen: 'INFERENCIA_IA_COMPLETADA',
          destino: 'ALERTA_DESPACHADA',
          duracionMs: 45,
          tiempoTexto: '45 ms',
          etiqueta: '45 ms',
          estadoConformidad: 'CONFORME',
          color: BRAND_GREEN_COLOR,
          esCritico: true
        },
        {
          origen: 'ALERTA_DESPACHADA',
          destino: 'REVISION_MEDICA_CERRADA',
          duracionMs: 2 * 60 * 1000,
          tiempoTexto: '2 min',
          etiqueta: 'Conforme: 2 min',
          estadoConformidad: 'CONFORME',
          color: BRAND_GREEN_COLOR,
          esCritico: true
        }
      ];

      return {
        titulo: 'Flujo de Telemetría',
        subtitulo: 'Filtro activo para situaciones críticas',
        filtroRiesgoAlto: true,
        kpi1Titulo: 'Alertas Críticas Procesadas',
        kpi1Valor: '18',
        kpi2Titulo: 'SLA Crítico Alcanzado',
        kpi2Valor: '100%',
        kpi2Color: BRAND_GREEN_COLOR,
        nodos: fixedNodes,
        transiciones: criticalTransitions
      };
    }

    const generalTransitions: TelemetryTransition[] = [
      {
        origen: 'CAPTURA_INICIADA',
        destino: 'INFERENCIA_IA_COMPLETADA',
        duracionMs: 120,
        tiempoTexto: '120 ms',
        etiqueta: '120 ms',
        estadoConformidad: 'CONFORME',
        color: BRAND_GRAY_COLOR,
        esCritico: false
      },
      {
        origen: 'INFERENCIA_IA_COMPLETADA',
        destino: 'ALERTA_DESPACHADA',
        duracionMs: 45,
        tiempoTexto: '45 ms',
        etiqueta: '45 ms',
        estadoConformidad: 'CONFORME',
        color: BRAND_GRAY_COLOR,
        esCritico: false
      },
      {
        origen: 'ALERTA_DESPACHADA',
        destino: 'REVISION_MEDICA_CERRADA',
        duracionMs: 45 * 60 * 1000,
        tiempoTexto: '45 min',
        etiqueta: 'Desviación: Demora Humana 45 min',
        estadoConformidad: 'DESVIACION',
        color: BRAND_RED_COLOR,
        esCritico: false
      }
    ];

    return {
      titulo: 'Flujo de Telemetría',
      subtitulo: 'Monitoreo de tiempos',
      filtroRiesgoAlto: false,
      kpi1Titulo: 'Eventos Telemétricos',
      kpi1Valor: '1,420',
      kpi2Titulo: 'Cumplimiento SLA',
      kpi2Valor: '85%',
      kpi2Color: BRAND_RED_COLOR,
      nodos: fixedNodes,
      transiciones: generalTransitions
    };
  }
}
