import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XaiService } from '../../../services/xai.service';
import { AlertExplanation, ShapFactor } from '../../../models/alert.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { RiskBadgeComponent } from '../../../shared/components/risk-badge/risk-badge.component';
import * as echarts from 'echarts';

@Component({
  selector: 'app-xai-explanation',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, RiskBadgeComponent],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <!-- Encabezado -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-lg font-black text-slate-900">Explicabilidad Clínica XAI (Valores SHAP)</h3>
              @if (explanation?.nivelRiesgo) {
                <app-risk-badge [level]="explanation!.nivelRiesgo"></app-risk-badge>
              }
            </div>
            <p class="text-xs text-slate-500">Paciente: <span class="font-bold text-slate-700">{{ patientName }}</span> (HU016)</p>
          </div>
          <button (click)="closeModal.emit()" class="text-slate-400 hover:text-slate-600 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        @if (isLoading) {
          <app-loading-spinner message="Calculando pesos SHAP del modelo Voting Ensemble..."></app-loading-spinner>
        } @else if (explanation) {
          <div class="mt-4 space-y-4">
            <!-- Mensaje Clínico Resumido -->
            <div class="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start space-x-2.5">
              <span class="text-base">🧠</span>
              <div>
                <p class="font-bold text-purple-950 mb-0.5">Diagnóstico Predictivo Explicable:</p>
                <p>{{ explanation.mensajeClinico }}</p>
              </div>
            </div>

            <!-- Gráfico de Barras SHAP con ECharts (HU016 Escenario 1) -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Peso Relativo e Impacto de Variables Fisiológicas (SHAP)
              </h4>
              <div #shapChartContainer class="w-full h-44"></div>
            </div>

            <!-- Desglose por Signo Vital Individual frente a Límites Seguros (HU016 Escenario 3) -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th class="px-3 py-2">Variable Clínica</th>
                    <th class="px-3 py-2">Valor Registrado</th>
                    <th class="px-3 py-2">Límite Clínico Seguro</th>
                    <th class="px-3 py-2">Impacto</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (f of explanation.factores; track f.factor) {
                    <tr class="hover:bg-slate-50 transition cursor-pointer" (click)="selectedFactor = f">
                      <td class="px-3 py-2.5 font-semibold text-slate-800">{{ f.factor }}</td>
                      <td class="px-3 py-2.5 font-mono font-bold">{{ f.valorRegistrado }}</td>
                      <td class="px-3 py-2.5 text-slate-500 font-mono">{{ f.limiteSeguro }}</td>
                      <td class="px-3 py-2.5">
                        <span
                          [ngClass]="{
                            'bg-red-100 text-red-800 font-bold': f.impacto === 'ALTO',
                            'bg-amber-100 text-amber-800 font-bold': f.impacto === 'MODERADO',
                            'bg-emerald-100 text-emerald-800': f.impacto === 'NORMAL'
                          }"
                          class="px-2 py-0.5 rounded text-[11px]"
                        >
                          {{ f.impacto }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (selectedFactor) {
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <span class="font-bold text-slate-800">{{ selectedFactor.factor }}:</span> {{ selectedFactor.descripcion }}
              </div>
            }
          </div>
        }

        <!-- Botón de Cierre -->
        <div class="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            (click)="closeModal.emit()"
            class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cerrar Ficha SHAP
          </button>
        </div>
      </div>
    </div>
  `
})
export class XaiExplanationComponent implements OnInit {
  @Input({ required: true }) patientId!: number;
  @Input({ required: true }) patientName!: string;
  @Output() closeModal = new EventEmitter<void>();

  @ViewChild('shapChartContainer', { static: false }) shapChartContainer!: ElementRef;

  private xaiService = inject(XaiService);
  private cdr = inject(ChangeDetectorRef);

  explanation: AlertExplanation | null = null;
  selectedFactor: ShapFactor | null = null;
  isLoading = true;

  private chartInstance: echarts.ECharts | null = null;

  ngOnInit(): void {
    // Buscar la última alerta clínica del paciente para obtener su explicación SHAP
    this.xaiService.getPatientAlerts(this.patientId).subscribe({
      next: alerts => {
        if (alerts.length > 0) {
          this.loadShap(alerts[0].idAlerta);
        } else {
          // Fallback con alerta id 1 o estructura estable
          this.loadShap(1);
        }
      },
      error: () => {
        this.loadShap(1);
      }
    });
  }

  loadShap(idAlerta: number): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.xaiService.getShapExplanation(idAlerta).subscribe({
      next: data => {
        this.explanation = data;
        this.isLoading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.renderShapChart(), 50);
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  renderShapChart(): void {
    if (!this.shapChartContainer || !this.explanation) return;

    if (!this.chartInstance) {
      this.chartInstance = echarts.init(this.shapChartContainer.nativeElement);
    }

    const factores = [...this.explanation.factores].reverse();
    const categories = factores.map(f => f.factor);
    const weights = factores.map(f => Math.round(f.pesoShap * 100));

    const option: echarts.EChartsOption = {
      grid: { top: 10, right: 35, bottom: 20, left: 130 },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#cbd5e1' } }
      },
      series: [
        {
          name: 'Peso de Impacto',
          type: 'bar',
          data: weights,
          itemStyle: {
            color: (params: any) => {
              const val = params.value as number;
              if (val >= 35) return '#EF4444'; // Crítico
              if (val >= 20) return '#F59E0B'; // Moderado
              return '#10B981'; // Normal
            },
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            fontSize: 11
          }
        }
      ]
    };

    this.chartInstance.setOption(option);
  }
}
