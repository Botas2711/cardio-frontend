import { Component, ElementRef, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TelemetryService } from '../../../services/telemetry.service';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../models/patient.model';
import { HistoricalSummary } from '../../../models/telemetry.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { MedicalUnitPipe } from '../../../shared/pipes/medical-unit.pipe';
import { XaiExplanationComponent } from '../xai-explanation/xai-explanation.component';
import * as echarts from 'echarts';

@Component({
  selector: 'app-telemetry-charts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoadingSpinnerComponent,
    MedicalUnitPipe,
    XaiExplanationComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Encabezado -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex items-center space-x-3">
          <a [routerLink]="['/live-monitoring', patientId]" class="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </a>
          <div>
            <h2 class="text-2xl font-black text-slate-900">Análisis Histórico y Tendencias</h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Paciente: <span class="font-bold text-slate-700">{{ patient?.nombres }} {{ patient?.apellidos }}</span> (DNI: {{ patient?.dni }})
            </p>
          </div>
        </div>

        <button
          (click)="showShap = true"
          class="px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg shadow-sm transition flex items-center"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          Ver Explicabilidad SHAP del Modelo (HU016)
        </button>
      </div>

      <!-- Filtros de Intervalo Temporal (HU015) -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <!-- Selector Agrupación -->
        <div class="flex items-center space-x-2">
          <span class="text-xs font-bold uppercase text-slate-500">Agrupar por:</span>
          <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              (click)="setAggregation('DIARIO')"
              [ngClass]="agrupacion === 'DIARIO' ? 'bg-white text-sky-600 font-bold shadow-sm' : 'text-slate-600'"
              class="px-3 py-1.5 text-xs rounded-md transition"
            >
              Días
            </button>
            <button
              (click)="setAggregation('SEMANAL')"
              [ngClass]="agrupacion === 'SEMANAL' ? 'bg-white text-sky-600 font-bold shadow-sm' : 'text-slate-600'"
              class="px-3 py-1.5 text-xs rounded-md transition"
            >
              Semanas
            </button>
            <button
              (click)="setAggregation('MENSUAL')"
              [ngClass]="agrupacion === 'MENSUAL' ? 'bg-white text-sky-600 font-bold shadow-sm' : 'text-slate-600'"
              class="px-3 py-1.5 text-xs rounded-md transition"
            >
              Meses
            </button>
          </div>
        </div>

        <!-- Rango de Fechas -->
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-1.5">
            <label class="text-xs text-slate-500">Desde:</label>
            <input
              type="date"
              [(ngModel)]="fechaInicio"
              (change)="loadHistoricalData()"
              class="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div class="flex items-center space-x-1.5">
            <label class="text-xs text-slate-500">Hasta:</label>
            <input
              type="date"
              [(ngModel)]="fechaFin"
              (change)="loadHistoricalData()"
              class="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      <!-- Resumen Estadístico (Promedio, Máximo, Mínimo) -->
      @if (historical && historical.totalRegistros > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200">
            <p class="text-xs font-bold text-slate-500 uppercase">Pulso Cardíaco</p>
            <p class="text-2xl font-black text-slate-900 mt-1 font-mono">
              {{ historical.promedioPulso | medicalUnit:'ppm' }}
            </p>
            <p class="text-xs text-slate-400 mt-1">
              Mín: {{ historical.minPulso }} ppm | Máx: {{ historical.maxPulso }} ppm
            </p>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200">
            <p class="text-xs font-bold text-slate-500 uppercase">Presión Sistólica</p>
            <p class="text-2xl font-black text-sky-700 mt-1 font-mono">
              {{ historical.promedioPresionSistolica | medicalUnit:'mmHg' }}
            </p>
            <p class="text-xs text-slate-400 mt-1">
              Mín: {{ historical.minPresionSistolica }} | Máx: {{ historical.maxPresionSistolica }} mmHg
            </p>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200">
            <p class="text-xs font-bold text-slate-500 uppercase">Presión Diastólica</p>
            <p class="text-2xl font-black text-indigo-700 mt-1 font-mono">
              {{ historical.promedioPresionDiastolica | medicalUnit:'mmHg' }}
            </p>
            <p class="text-xs text-slate-400 mt-1">
              Mín: {{ historical.minPresionDiastolica }} | Máx: {{ historical.maxPresionDiastolica }} mmHg
            </p>
          </div>
        </div>
      }

      <!-- Gráfico de Curvas Temporales con ECharts -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="text-base font-bold text-slate-900 mb-1">Evolución Cronológica y Series Temporales</h3>
        <p class="text-xs text-slate-500 mb-4">Comportamiento del pulso periférico y presión estimada (HU015)</p>

        @if (isLoading) {
          <app-loading-spinner message="Cargando series históricas..."></app-loading-spinner>
        } @else if (!historical || historical.totalRegistros === 0) {
          <!-- HU015 Escenario 2: Intervalo temporal sin registros -->
          <div class="p-12 text-center text-slate-500">
            <p class="font-medium text-slate-600">No existen registros en el intervalo seleccionado</p>
            <p class="text-xs text-slate-400 mt-1">Modifique el rango de fechas para consultar mediciones previas.</p>
          </div>
        } @else {
          <div #historyChartContainer class="w-full h-80"></div>
        }
      </div>
    </div>

    <!-- Modal SHAP -->
    @if (showShap && patient) {
      <app-xai-explanation
        [patientId]="patient.idPaciente"
        [patientName]="patient.nombres + ' ' + patient.apellidos"
        (closeModal)="showShap = false"
      ></app-xai-explanation>
    }
  `
})
export class TelemetryChartsComponent implements OnInit {
  @ViewChild('historyChartContainer', { static: false }) historyChartContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  private telemetryService = inject(TelemetryService);
  private patientService = inject(PatientService);
  private cdr = inject(ChangeDetectorRef);

  patientId!: number;
  patient: Patient | null = null;
  historical: HistoricalSummary | null = null;
  isLoading = true;
  showShap = false;

  agrupacion = 'DIARIO';
  fechaInicio = '';
  fechaFin = '';

  private chartInstance: echarts.ECharts | null = null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.patientId = +params['id'];
      this.loadPatientInfo();
      this.setDefaultDates();
      this.loadHistoricalData();
    });
  }

  setDefaultDates(): void {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 14);

    this.fechaFin = today.toISOString().split('T')[0];
    this.fechaInicio = lastWeek.toISOString().split('T')[0];
  }

  loadPatientInfo(): void {
    this.patientService.getById(this.patientId).subscribe(p => {
      this.patient = p;
      this.cdr.markForCheck();
    });
  }

  setAggregation(agg: string): void {
    this.agrupacion = agg;
    this.loadHistoricalData();
  }

  loadHistoricalData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.telemetryService.getHistorical(this.patientId, this.agrupacion, this.fechaInicio, this.fechaFin).subscribe({
      next: data => {
        this.historical = data;
        this.isLoading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.renderHistoryChart(), 50);
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  renderHistoryChart(): void {
    if (!this.historyChartContainer || !this.historical || this.historical.mediciones.length === 0) return;

    if (!this.chartInstance) {
      this.chartInstance = echarts.init(this.historyChartContainer.nativeElement);
    }

    const fechas = this.historical.mediciones.map(m => {
      const d = new Date(m.fechaHora);
      return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    });
    const pulsoData = this.historical.mediciones.map(m => m.pulsoPpm);
    const sisData = this.historical.mediciones.map(m => m.presionSistolica || 0);
    const diaData = this.historical.mediciones.map(m => m.presionDiastolica || 0);

    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Frecuencia Cardíaca (ppm)', 'PA Sistólica (mmHg)', 'PA Diastólica (mmHg)'], bottom: 0 },
      grid: { top: 20, right: 30, bottom: 45, left: 45 },
      xAxis: {
        type: 'category',
        data: fechas,
        axisLine: { lineStyle: { color: '#cbd5e1' } }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      series: [
        {
          name: 'Frecuencia Cardíaca (ppm)',
          type: 'line',
          data: pulsoData,
          smooth: true,
          lineStyle: { color: '#EF4444', width: 2 },
          itemStyle: { color: '#EF4444' }
        },
        {
          name: 'PA Sistólica (mmHg)',
          type: 'line',
          data: sisData,
          smooth: true,
          lineStyle: { color: '#0284C7', width: 2 },
          itemStyle: { color: '#0284C7' }
        },
        {
          name: 'PA Diastólica (mmHg)',
          type: 'line',
          data: diaData,
          smooth: true,
          lineStyle: { color: '#6366F1', width: 2 },
          itemStyle: { color: '#6366F1' }
        }
      ]
    };

    this.chartInstance.setOption(option);
  }
}
