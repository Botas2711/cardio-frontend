import { Component, OnInit, ElementRef, ViewChild, inject, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessMiningService } from '../../services/process-mining.service';
import { ProcessMap, ProcessTimes, ConformityReport } from '../../models/process-event.model';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const COLOR_BRAND_RED = '#E11D48';
const COLOR_BRAND_GREEN = '#10B981';
const COLOR_BRAND_GRAY = '#94A3B8';

@Component({
  selector: 'app-process-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 select-none font-sans max-w-7xl mx-auto">
      <!-- Encabezado Principal y Selector Unificado de Riesgo -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Flujos y Minería de Procesos</h1>
          </div>
          <p class="text-sm text-slate-500 mt-1 font-medium">
            Descubrimiento algorítmico de rutas asistenciales, tiempos de espera y auditoría de conformidad
          </p>
        </div>

        <!-- Filtro por Nivel de Riesgo Clínico -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold text-slate-500 mr-1">Filtro Clínico:</span>
          <button
            type="button"
            (click)="setFiltroRiesgo('TODOS')"
            [ngClass]="filtroRiesgo === 'TODOS'
              ? 'bg-slate-900 text-white shadow-xs font-bold'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
            class="px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
          >
            Todos
          </button>
          <button
            type="button"
            (click)="setFiltroRiesgo('CRITICO')"
            [ngClass]="filtroRiesgo === 'CRITICO'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'"
            class="px-3 py-1.5 rounded-xl text-xs transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <span class="w-2 h-2 rounded-full bg-current"></span>
            Críticos (Riesgo Alto)
          </button>
          <button
            type="button"
            (click)="setFiltroRiesgo('MODERADO')"
            [ngClass]="filtroRiesgo === 'MODERADO'
              ? 'bg-amber-500 text-white shadow-xs font-bold'
              : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'"
            class="px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
          >
            Moderados
          </button>
          <button
            type="button"
            (click)="setFiltroRiesgo('NORMAL')"
            [ngClass]="filtroRiesgo === 'NORMAL'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'"
            class="px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
          >
            Normal
          </button>
        </div>
      </div>

      <!-- Tarjetas de Métricas KPI Reales (Directo de la Base de Datos) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- KPI 1: Total Eventos Asistenciales -->
        <div class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span class="text-xs font-bold text-slate-500 tracking-tight block">
            Eventos Registrados
          </span>
          <span class="text-3xl font-extrabold text-slate-900 mt-2 block tracking-tight">
            {{ totalEventosRegistrados }}
          </span>
          <span class="text-[11px] text-slate-400 font-medium mt-1 block">
            Base de datos PostgreSQL
          </span>
        </div>

        <!-- KPI 2: Casos / Trazas Analizadas -->
        <div class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span class="text-xs font-bold text-slate-500 tracking-tight block">
            Casos / Ciclos Analizados
          </span>
          <span class="text-3xl font-extrabold text-sky-700 mt-2 block tracking-tight">
            {{ processMap?.totalCasos || 0 }}
          </span>
          <span class="text-[11px] text-slate-400 font-medium mt-1 block">
            Trazas clínicas descubiertas
          </span>
        </div>

        <!-- KPI 3: Conformidad Clínica -->
        <div class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span class="text-xs font-bold text-slate-500 tracking-tight block">
            Conformidad del Protocolo
          </span>
          <span
            [ngClass]="(conformityReport?.porcentajeCumplimiento ?? 100) >= 90 ? 'text-emerald-600' : 'text-amber-600'"
            class="text-3xl font-extrabold mt-2 block tracking-tight"
          >
            {{ conformityReport?.porcentajeCumplimiento || 100 }}%
          </span>
          <span class="text-[11px] text-slate-400 font-medium mt-1 block">
            {{ conformityReport?.casosConDesvios || 0 }} desvíos detectados
          </span>
        </div>

        <!-- KPI 4: Estado General de Tiempos -->
        <div class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span class="text-xs font-bold text-slate-500 tracking-tight block">
            Diagnóstico de Cuellos de Botella
          </span>
          <div class="mt-2 flex items-center space-x-2">
            <span
              [ngClass]="processTimes?.estadoGeneral === 'CUELLO_DE_BOTELLA_DETECTADO' ? 'bg-rose-500' : 'bg-emerald-500'"
              class="w-3 h-3 rounded-full animate-pulse"
            ></span>
            <span
              [ngClass]="processTimes?.estadoGeneral === 'CUELLO_DE_BOTELLA_DETECTADO' ? 'text-rose-700' : 'text-emerald-700'"
              class="text-xl font-extrabold tracking-tight"
            >
              {{ processTimes?.estadoGeneral === 'CUELLO_DE_BOTELLA_DETECTADO' ? 'Demoras Detectadas' : 'Flujo Óptimo' }}
            </span>
          </div>
          <span class="text-[11px] text-slate-400 font-medium mt-1 block">
            Límites clínicos habituales
          </span>
        </div>
      </div>

      <!-- Barra de Pestañas de Auditoría -->
      <div class="flex items-center space-x-2 border-b border-slate-200">
        <button
          type="button"
          (click)="setActiveTab('mapa')"
          [ngClass]="activeTab === 'mapa'
            ? 'border-brand text-brand font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'"
          class="pb-3 px-3 text-sm border-b-2 transition cursor-pointer flex items-center gap-2"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Grafo de Procesos
        </button>

        <button
          type="button"
          (click)="setActiveTab('tiempos')"
          [ngClass]="activeTab === 'tiempos'
            ? 'border-brand text-brand font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'"
          class="pb-3 px-3 text-sm border-b-2 transition cursor-pointer flex items-center gap-2"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Cuellos de Botella y Tiempos
        </button>

        <button
          type="button"
          (click)="setActiveTab('conformidad')"
          [ngClass]="activeTab === 'conformidad'
            ? 'border-brand text-brand font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'"
          class="pb-3 px-3 text-sm border-b-2 transition cursor-pointer flex items-center gap-2"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Conformidad y Desvíos
        </button>
      </div>

      <!-- PESTAÑA 1: Grafo de Procesos Interactivo con Vis-Network -->
      @if (activeTab === 'mapa') {
        <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Grafo Asistencial Directamente Seguido (DFG)
              </h2>
              <p class="text-xs text-slate-500">
                Flujo real de pacientes entre etapas del protocolo. Arrastre los nodos o haga zoom para explorar.
              </p>
            </div>
            <button
              type="button"
              (click)="fitNetworkView()"
              class="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              Centrar Vista
            </button>
          </div>

          <!-- Contenedor del Grafo Interactivo con Vis-Network -->
          <div class="relative w-full h-[460px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
            @if (isLoading) {
              <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10 text-white">
                <div class="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span class="text-xs text-slate-300 font-medium">Ejecutando algoritmo de descubrimiento...</span>
              </div>
            }

            @if (!isLoading && (!processMap || processMap.totalCasos === 0)) {
              <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 z-10">
                <svg class="w-12 h-12 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="font-bold text-slate-200 text-sm">No hay registros disponibles para generar el mapa de atención</p>
                <p class="text-xs text-slate-500 mt-1 max-w-md">
                  No se registran eventos asistenciales para la categoría seleccionada ({{ filtroRiesgo }}). Seleccione otra categoría o registre nuevas lecturas.
                </p>
              </div>
            }

            <div #networkContainer class="w-full h-full"></div>

            <!-- Leyenda Flotante -->
            <div class="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex flex-wrap items-center gap-4">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#0284C7]"></span>
                <span>Etapa Regular</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#E11D48]"></span>
                <span>Alerta Despachada</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                <span>Revisión Médica Cerrada</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 bg-slate-400"></span>
                <span>Transición con volumen de casos</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- PESTAÑA 2: Cuellos de Botella y Tiempos de Espera -->
      @if (activeTab === 'tiempos') {
        <div class="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div class="pb-3 border-b border-slate-100">
            <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Auditoría de Tiempos de Espera y Cuellos de Botella
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Duraciones promedio entre etapas calculadas matemáticamente (Performance DFG)
            </p>
          </div>

          @if (!processTimes || processTimes.pasos.length === 0) {
            <div class="p-12 text-center text-slate-400 text-xs">
              No se registran suficientes transiciones en la categoría seleccionada para calcular tiempos de atención.
            </div>
          } @else {
            <div class="space-y-3">
              @for (paso of processTimes.pasos; track paso.etapaOrigen + '-' + paso.etapaDestino) {
                <div
                  [ngClass]="paso.demorado
                    ? 'bg-rose-50/60 border-rose-300'
                    : 'bg-emerald-50/60 border-emerald-300'"
                  class="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div>
                    <div class="flex items-center space-x-2">
                      <span
                        [ngClass]="paso.demorado ? 'bg-rose-600' : 'bg-emerald-600'"
                        class="w-2.5 h-2.5 rounded-full shrink-0"
                      ></span>
                      <span class="font-extrabold text-slate-900 text-sm">
                        {{ paso.etapaOrigen }} → {{ paso.etapaDestino }}
                      </span>
                      @if (paso.demorado) {
                        <span class="px-2 py-0.5 bg-rose-200 text-rose-800 rounded-md text-[10px] font-black uppercase">
                          Cuello de Botella
                        </span>
                      } @else {
                        <span class="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-md text-[10px] font-black uppercase">
                          Conforme
                        </span>
                      }
                    </div>
                    <p
                      [ngClass]="paso.demorado ? 'text-rose-800' : 'text-emerald-800'"
                      class="text-xs mt-1.5 font-medium"
                    >
                      {{ paso.mensajeEstado }}
                    </p>
                  </div>

                  <div class="text-right shrink-0">
                    <div class="font-mono text-base font-black text-slate-900">
                      {{ formatTimeLabel(paso.duracionPromedioMinutos) }}
                    </div>
                    <p class="text-[11px] text-slate-500 font-medium">
                      Límite clínico: &lt; {{ formatTimeLabel(paso.duracionLimiteNormalMinutos) }}
                    </p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- PESTAÑA 3: Conformidad y Desvíos de Protocolo -->
      @if (activeTab === 'conformidad') {
        <div class="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Conformidad del Protocolo Clínico
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">{{ conformityReport?.mensaje }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-semibold text-slate-500">Tasa de Cumplimiento:</span>
              <span
                [ngClass]="(conformityReport?.porcentajeCumplimiento ?? 100) >= 100
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'"
                class="px-3.5 py-1 rounded-full text-sm font-black font-mono border"
              >
                {{ conformityReport?.porcentajeCumplimiento || 100 }}%
              </span>
            </div>
          </div>

          <!-- Casos con Desvío o Incompletos -->
          @if (conformityReport && conformityReport.casosIncompletos && conformityReport.casosIncompletos.length > 0) {
            <div>
              <p class="text-xs font-bold text-slate-800 mb-2">
                Casos auditados con desviaciones u omisiones en el protocolo:
              </p>
              <div class="space-y-2">
                @for (caso of conformityReport.casosIncompletos; track caso.idPaciente + '-' + caso.motivoDesvio) {
                  <div class="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span class="font-bold text-amber-950">{{ caso.nombrePaciente }}</span>
                      <span class="text-amber-800 ml-1 font-mono">(DNI: {{ caso.dniPaciente }})</span>
                    </div>
                    <span class="text-amber-900 font-medium text-right">{{ caso.motivoDesvio }}</span>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="p-8 text-center bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <svg class="w-10 h-10 text-emerald-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="font-bold text-emerald-900 text-sm">Cumplimiento total de la ruta clínica (100%)</p>
              <p class="text-xs text-emerald-700 mt-1">No se detectaron desvíos ni omisiones en los pasos asistenciales auditados.</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ProcessAuditComponent implements OnInit, AfterViewInit {
  @ViewChild('networkContainer', { static: false }) networkContainer!: ElementRef;

  private processMiningService = inject(ProcessMiningService);
  private cdr = inject(ChangeDetectorRef);

  readonly COLOR_BRAND_RED = COLOR_BRAND_RED;
  readonly COLOR_BRAND_GREEN = COLOR_BRAND_GREEN;
  readonly COLOR_BRAND_GRAY = COLOR_BRAND_GRAY;

  filtroRiesgo = 'TODOS';
  activeTab: 'mapa' | 'tiempos' | 'conformidad' = 'mapa';
  isLoading = false;

  totalEventosRegistrados = 0;
  processMap: ProcessMap | null = null;
  processTimes: ProcessTimes | null = null;
  conformityReport: ConformityReport | null = null;

  private networkInstance: Network | null = null;

  ngOnInit(): void {
    this.loadAllProcessData();
  }

  ngAfterViewInit(): void {
    if (this.activeTab === 'mapa' && this.processMap && this.processMap.actividades.length > 0) {
      setTimeout(() => this.renderNetwork(), 100);
    }
  }

  get isHighRiskFilterActive(): boolean {
    return this.filtroRiesgo === 'CRITICO';
  }

  setFiltroRiesgo(nuevoFiltro: string): void {
    this.filtroRiesgo = nuevoFiltro;
    this.loadAllProcessData();
  }

  toggleHighRiskFilter(): void {
    this.filtroRiesgo = this.filtroRiesgo === 'CRITICO' ? 'TODOS' : 'CRITICO';
    this.loadAllProcessData();
  }

  setActiveTab(tab: 'mapa' | 'tiempos' | 'conformidad'): void {
    this.activeTab = tab;
    if (tab === 'mapa') {
      setTimeout(() => this.renderNetwork(), 100);
    }
  }

  loadAllProcessData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    // 1. Cargar Mapa de Procesos
    this.processMiningService.getProcessMap(this.filtroRiesgo).subscribe({
      next: (mapData: ProcessMap) => {
        this.processMap = mapData;
        if (this.activeTab === 'mapa') {
          setTimeout(() => this.renderNetwork(), 100);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.processMap = null;
        this.cdr.markForCheck();
      }
    });

    // 2. Cargar Tiempos de Espera y Cuellos de Botella
    this.processMiningService.getProcessTimes(this.filtroRiesgo).subscribe({
      next: (timesData: ProcessTimes) => {
        this.processTimes = timesData;
        this.cdr.markForCheck();
      },
      error: () => {
        this.processTimes = null;
        this.cdr.markForCheck();
      }
    });

    // 3. Cargar Reporte de Conformidad del Protocolo
    this.processMiningService.getConformityReport(this.filtroRiesgo).subscribe({
      next: (confData: ConformityReport) => {
        this.conformityReport = confData;
        this.cdr.markForCheck();
      },
      error: () => {
        this.conformityReport = null;
        this.cdr.markForCheck();
      }
    });

    // 4. Contar eventos reales directamente desde la base de datos
    this.processMiningService.getEventos(this.filtroRiesgo).subscribe({
      next: (eventos) => {
        this.totalEventosRegistrados = eventos ? eventos.length : 0;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.totalEventosRegistrados = 0;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  renderNetwork(): void {
    if (!this.networkContainer || !this.processMap || !this.processMap.actividades || this.processMap.actividades.length === 0) {
      if (this.networkInstance) {
        this.networkInstance.destroy();
        this.networkInstance = null;
      }
      return;
    }

    const nodesArray = this.processMap.actividades.map((act) => {
      let bgColor = '#0284C7';
      let borderColor = '#38BDF8';
      let fontColor = '#FFFFFF';

      if (act.actividad === 'ALERTA_DESPACHADA') {
        bgColor = '#E11D48';
        borderColor = '#FDA4AF';
      } else if (act.actividad === 'REVISION_MEDICA_CERRADA') {
        bgColor = '#10B981';
        borderColor = '#6EE7B7';
      } else if (act.actividad === 'CAPTURA_INICIADA') {
        bgColor = '#2563EB';
        borderColor = '#93C5FD';
      } else if (act.actividad === 'INFERENCIA_IA_COMPLETADA') {
        bgColor = '#4F46E5';
        borderColor = '#A5B4FC';
      }

      return {
        id: act.actividad,
        label: `${act.actividad}\n(${act.cantidadPacientes} pac | ${act.totalOcurrencias} ev)`,
        shape: 'box',
        margin: 12,
        color: {
          background: bgColor,
          border: borderColor,
          highlight: { background: bgColor, border: '#FFFFFF' }
        },
        font: { color: fontColor, size: 12, face: 'system-ui, sans-serif' }
      };
    });

    const edgesArray = this.processMap.transiciones.map((t, index) => ({
      id: `e-${index}`,
      from: t.origen,
      to: t.destino,
      label: `${t.cantidadCasos} casos`,
      arrows: 'to',
      color: { color: '#94A3B8', highlight: '#38BDF8' },
      font: { color: '#CBD5E1', size: 11, align: 'top', strokeWidth: 0 }
    }));

    const data: any = {
      nodes: new DataSet(nodesArray as any),
      edges: new DataSet(edgesArray as any)
    };

    const options: any = {
      layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed',
          nodeSpacing: 180,
          levelSeparation: 120
        }
      },
      physics: false,
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true
      }
    };

    if (this.networkInstance) {
      this.networkInstance.destroy();
    }

    this.networkInstance = new Network(this.networkContainer.nativeElement, data, options);
  }

  fitNetworkView(): void {
    if (this.networkInstance) {
      this.networkInstance.fit({ animation: true });
    }
  }

  formatTimeLabel(minutos: number): string {
    if (!minutos || minutos <= 0) return '0 s';
    if (minutos < 0.0167) {
      return `${Math.round(minutos * 60000)} ms`;
    }
    if (minutos < 1.0) {
      return `${Math.round(minutos * 60)} s`;
    }
    return `${minutos.toFixed(1)} min`;
  }
}
