import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Patient } from '../../../models/patient.model';
import { TelemetryLive } from '../../../models/telemetry.model';
import { ReportService } from '../../../services/report.service';
import Swal from 'sweetalert2';

export interface ClinicalComparisonRow {
  parametro: string;
  valorRegistrado: string;
  limiteSeguro: string;
  impacto: 'Alto' | 'Moderado' | 'Bajo';
}

@Component({
  selector: 'app-risk-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Overlay del Modal -->
    <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 p-7 sm:p-8 space-y-6">

        <!-- Encabezado del Modal (risk-detail-modal.png) -->
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-xl font-black text-slate-900 tracking-tight">Detalle de Riesgo</h3>
            <p class="text-xs text-slate-500 mt-1 font-medium">Análisis clínico de {{ patientName }}</p>
          </div>
          <button
            type="button"
            (click)="close()"
            class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Cerrar modal"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Tarjeta de Clasificación de Riesgo Actual y Puntaje Dinámico -->
        <div
          [ngClass]="riskClassification.bgClass"
          class="border rounded-2xl p-4 flex items-center justify-between transition-all"
        >
          <div class="flex items-center space-x-3">
            <div
              [ngClass]="riskClassification.iconBgClass"
              class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div>
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Clasificación actual</span>
              <span [ngClass]="riskClassification.textClass" class="text-base font-extrabold">
                {{ riskClassification.label }}
              </span>
            </div>
          </div>
          <div class="text-right">
            <span [ngClass]="riskClassification.scoreClass" class="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {{ riskScore }}/100
            </span>
          </div>
        </div>

        <!-- Sección: Impacto por Factor (SHAP Feature Importance Dinámico) -->
        <div class="space-y-3.5">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-900 tracking-tight">Impacto por factor</h4>
            <span class="text-[11px] text-slate-400 font-medium">Mayor longitud = mayor incidencia</span>
          </div>

          <div class="space-y-3">
            <!-- Factor 1: Frecuencia Cardíaca -->
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-slate-700">Frecuencia Cardíaca</span>
                <span [ngClass]="isPulseAbnormal ? 'font-bold text-brand' : 'font-bold text-slate-700'">
                  {{ currentBpm }} BPM
                </span>
              </div>
              <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  [ngClass]="isPulseAbnormal ? 'bg-brand' : 'bg-emerald-500'"
                  [style.width]="heartRateBarWidth"
                  class="h-full rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>

            <!-- Factor 2: IMC -->
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-slate-700">IMC</span>
                <span
                  [ngClass]="patientImc >= 30 ? 'text-amber-600 font-bold' : (patientImc >= 25 ? 'text-amber-600 font-bold' : 'text-slate-600 font-semibold')"
                >
                  {{ patientImc }}
                </span>
              </div>
              <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  [ngClass]="patientImc >= 30 ? 'bg-amber-500' : (patientImc >= 25 ? 'bg-amber-400' : 'bg-slate-300')"
                  [style.width]="imcBarWidth"
                  class="h-full rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>

            <!-- Factor 3: Tabaquismo -->
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-slate-700">Tabaquismo</span>
                <span [ngClass]="patient?.tabaquismo ? 'text-amber-600 font-bold' : 'text-slate-500 font-semibold'">
                  {{ patient?.tabaquismo ? 'Sí' : 'No' }}
                </span>
              </div>
              <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  [ngClass]="patient?.tabaquismo ? 'bg-amber-500' : 'bg-slate-300'"
                  [style.width]="patient?.tabaquismo ? '55%' : '18%'"
                  class="h-full rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>

            <!-- Factor 4: Diabetes -->
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-slate-700">Diabetes</span>
                <span [ngClass]="patient?.diabetes ? 'text-brand font-bold' : 'text-slate-500 font-semibold'">
                  {{ patient?.diabetes ? 'Sí' : 'No' }}
                </span>
              </div>
              <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  [ngClass]="patient?.diabetes ? 'bg-brand' : 'bg-slate-300'"
                  [style.width]="patient?.diabetes ? '60%' : '15%'"
                  class="h-full rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabla Dinámica de Comparación de Parámetros Clínicos -->
        <div class="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th class="py-3 px-4">Valor registrado</th>
                <th class="py-3 px-4">Límite clínico seguro</th>
                <th class="py-3 px-4 text-right">Impacto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
              @for (row of comparisonRows; track row.parametro) {
                <tr>
                  <td
                    class="py-3 px-4 font-bold"
                    [ngClass]="row.impacto === 'Alto' ? 'text-brand' : 'text-slate-800'"
                  >
                    {{ row.valorRegistrado }}
                  </td>
                  <td class="py-3 px-4 text-slate-600">{{ row.limiteSeguro }}</td>
                  <td class="py-3 px-4 text-right">
                    <span
                      [ngClass]="{
                        'text-brand bg-rose-50 border-rose-100': row.impacto === 'Alto',
                        'text-amber-700 bg-amber-50 border-amber-100': row.impacto === 'Moderado',
                        'text-emerald-700 bg-emerald-50 border-emerald-100': row.impacto === 'Bajo'
                      }"
                      class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                    >
                      {{ row.impacto }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pie del Modal -->
        <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <p class="text-[11px] text-slate-400 font-medium max-w-xs leading-tight">
            Este resultado apoya la evaluación médica y no reemplaza el criterio clínico profesional.
          </p>

          <div class="flex items-center space-x-2.5 shrink-0">
            <button
              type="button"
              (click)="exportReport()"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center space-x-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              <span>Exportar Reporte</span>
            </button>

            <button
              type="button"
              (click)="close()"
              class="px-6 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RiskDetailModalComponent {
  @Input() patientId!: number;
  @Input() patientName!: string;
  @Input() patient: Patient | null = null;
  @Input() liveData: TelemetryLive | null = null;
  @Input() currentPulse: number = 110;
  @Output() closeModal = new EventEmitter<void>();

  private reportService = inject(ReportService);

  get currentBpm(): number {
    return this.currentPulse || this.liveData?.pulsoPpm || 110;
  }

  get isPulseAbnormal(): boolean {
    const maxBpm = this.patient?.frecuenciaMax || 100;
    const minBpm = this.patient?.frecuenciaMin || 60;
    return this.currentBpm > maxBpm || this.currentBpm < minBpm;
  }

  get patientImc(): number {
    if (this.patient?.imc) {
      return Number(this.patient.imc);
    }
    if (this.patient?.pesoKg && this.patient?.tallaCm) {
      const metros = this.patient.tallaCm / 100;
      return Math.round((this.patient.pesoKg / (metros * metros)) * 10) / 10;
    }
    return 31.0;
  }

  // Algoritmo de Simulación Predictiva Clínica (SHAP & Biomarcadores)
  get riskScore(): number {
    // Si viene scoreRiesgo del backend (ej. 0.82 o 0.96)
    if (this.liveData?.scoreRiesgo && this.liveData.scoreRiesgo > 0) {
      return Math.min(99, Math.round(Number(this.liveData.scoreRiesgo) * 100));
    }

    let score = 15; // Calibración basal

    // 1. Incidencia de Frecuencia Cardíaca
    const bpm = this.currentBpm;
    const maxBpm = this.patient?.frecuenciaMax || 100;
    const minBpm = this.patient?.frecuenciaMin || 60;
    if (bpm > maxBpm) {
      const exceso = bpm - maxBpm;
      score += Math.min(48, Math.round(20 + exceso * 0.9));
    } else if (bpm < minBpm) {
      const deficit = minBpm - bpm;
      score += Math.min(40, Math.round(15 + deficit * 0.9));
    } else {
      score += 5;
    }

    // 2. Incidencia de IMC
    const imc = this.patientImc;
    if (imc >= 30) {
      score += Math.min(24, Math.round(18 + (imc - 30) * 1.5));
    } else if (imc >= 25) {
      score += Math.round(8 + (imc - 25) * 1.6);
    } else {
      score += 2;
    }

    // 3. Incidencia de Diabetes
    if (this.patient?.diabetes) {
      score += 18;
    }

    // 4. Incidencia de Tabaquismo
    if (this.patient?.tabaquismo) {
      score += 14;
    }

    // 5. Incidencia de Hipertensión
    if (this.patient?.hipertension) {
      score += 10;
    }

    // 6. Incidencia de Edad avanzada
    if (this.patient?.edad && this.patient.edad > 60) {
      score += 6;
    }

    return Math.min(99, Math.max(15, score));
  }

  get riskClassification(): {
    label: string;
    textClass: string;
    bgClass: string;
    iconBgClass: string;
    scoreClass: string;
  } {
    const score = this.riskScore;
    if (score >= 70) {
      return {
        label: 'Riesgo Alto',
        textClass: 'text-brand',
        bgClass: 'bg-rose-50/70 border-rose-100',
        iconBgClass: 'bg-brand text-white',
        scoreClass: 'text-brand'
      };
    } else if (score >= 45) {
      return {
        label: 'Riesgo Moderado',
        textClass: 'text-amber-700',
        bgClass: 'bg-amber-50/70 border-amber-100',
        iconBgClass: 'bg-amber-500 text-white',
        scoreClass: 'text-amber-600'
      };
    } else {
      return {
        label: 'Riesgo Bajo',
        textClass: 'text-emerald-700',
        bgClass: 'bg-emerald-50/70 border-emerald-100',
        iconBgClass: 'bg-emerald-600 text-white',
        scoreClass: 'text-emerald-600'
      };
    }
  }

  get heartRateBarWidth(): string {
    const bpm = this.currentBpm;
    if (bpm > 100) {
      return `${Math.min(96, Math.max(50, Math.round(55 + (bpm - 100) * 0.95)))}%`;
    } else if (bpm < 60) {
      return `${Math.min(90, Math.max(40, Math.round(45 + (60 - bpm) * 1.2)))}%`;
    }
    return `${Math.max(15, Math.round(((bpm - 60) / 40) * 35))}%`;
  }

  get imcBarWidth(): string {
    const imc = this.patientImc;
    if (imc >= 30) {
      return `${Math.min(88, Math.max(45, Math.round(45 + (imc - 30) * 3.5)))}%`;
    } else if (imc >= 25) {
      return `${Math.round(25 + (imc - 25) * 3.5)}%`;
    }
    return `${Math.max(14, Math.round((imc / 25) * 22))}%`;
  }

  get comparisonRows(): ClinicalComparisonRow[] {
    const rows: ClinicalComparisonRow[] = [];

    // Frecuencia Cardíaca
    const maxBpm = this.patient?.frecuenciaMax || 100;
    const minBpm = this.patient?.frecuenciaMin || 60;
    const bpm = this.currentBpm;
    const bpmImpact = (bpm > maxBpm || bpm < minBpm) ? 'Alto' : 'Bajo';
    rows.push({
      parametro: 'Frecuencia Cardíaca',
      valorRegistrado: `${bpm} BPM`,
      limiteSeguro: `${minBpm}–${maxBpm} BPM`,
      impacto: bpmImpact
    });

    // IMC
    const imc = this.patientImc;
    const imcImpact = imc >= 30 ? 'Moderado' : (imc >= 25 ? 'Moderado' : 'Bajo');
    rows.push({
      parametro: 'IMC',
      valorRegistrado: `IMC ${imc}`,
      limiteSeguro: '< 25',
      impacto: imcImpact
    });

    // Diabetes
    if (this.patient?.diabetes) {
      rows.push({
        parametro: 'Diabetes',
        valorRegistrado: 'Diabetes: Sí',
        limiteSeguro: 'No',
        impacto: 'Alto'
      });
    }

    // Tabaquismo
    if (this.patient?.tabaquismo) {
      rows.push({
        parametro: 'Tabaquismo',
        valorRegistrado: 'Tabaquismo: Activo',
        limiteSeguro: 'No',
        impacto: 'Moderado'
      });
    }

    // Hipertensión
    if (this.patient?.hipertension) {
      rows.push({
        parametro: 'Hipertensión',
        valorRegistrado: 'Hipertensión: Sí',
        limiteSeguro: 'No',
        impacto: 'Moderado'
      });
    }

    return rows;
  }

  close(): void {
    this.closeModal.emit();
  }

  exportReport(): void {
    this.reportService.generateRiskExplanationPdf({
      patientName: this.patientName,
      dni: this.patient?.dni || '',
      edad: this.patient?.edad,
      genero: this.patient?.genero,
      imc: this.patientImc,
      currentBpm: this.currentBpm,
      riskScore: this.riskScore,
      riskClassification: this.riskClassification.label,
      tabaquismo: !!this.patient?.tabaquismo,
      diabetes: !!this.patient?.diabetes,
      hipertension: !!this.patient?.hipertension,
      comparisonRows: this.comparisonRows
    });
  }
}
