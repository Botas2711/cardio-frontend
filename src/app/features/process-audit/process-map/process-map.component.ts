import { Component, ElementRef, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessMiningService } from '../../../services/process-mining.service';
import { ProcessMap } from '../../../models/process-event.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

@Component({
  selector: 'app-process-map',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="space-y-4">
      <!-- Filtro por Nivel de Riesgo (HU024) -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div class="text-xs text-slate-600">
          Total de casos analizados: <span class="font-bold font-mono">{{ processMap?.totalCasos || 0 }}</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs font-semibold text-slate-500">Filtrar flujo por riesgo (HU024):</span>
          <select
            [(ngModel)]="filtroRiesgo"
            (change)="loadProcessMap()"
            class="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
          >
            <option value="TODOS">Todos los Pacientes</option>
            <option value="CRITICO">Pacientes Críticos (Riesgo Alto)</option>
            <option value="MODERADO">Pacientes Moderados</option>
            <option value="NORMAL">Pacientes Estables (Normal)</option>
          </select>
        </div>
      </div>

      <!-- Contenedor del Grafo Interactivo con Vis-Network (HU021) -->
      <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 relative">
        @if (isLoading) {
          <div class="p-12">
            <app-loading-spinner message="Descubriendo grafo asistencial con PM4Py..."></app-loading-spinner>
          </div>
        } @else if (!processMap || processMap.totalCasos === 0) {
          <!-- HU021 Escenario 2: Sin datos para graficar -->
          <div class="p-16 text-center text-slate-400">
            <p class="font-medium text-slate-300">No hay registros disponibles para generar el mapa de atención</p>
            <p class="text-xs text-slate-500 mt-1">Seleccione otra categoría de riesgo o registre nuevos eventos asistenciales.</p>
          </div>
        } @else {
          <div #networkContainer class="w-full h-[450px]"></div>
          <!-- Leyenda del Grafo -->
          <div class="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700 text-[11px] text-slate-300 flex items-center space-x-4">
            <div class="flex items-center"><span class="w-2.5 h-2.5 rounded-full bg-sky-500 mr-1.5"></span>Etapa Asistencial</div>
            <div class="flex items-center"><span class="w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5"></span>Transición de Pacientes</div>
          </div>
        }
      </div>
    </div>
  `
})
export class ProcessMapComponent implements OnInit {
  @ViewChild('networkContainer', { static: false }) networkContainer!: ElementRef;

  private processService = inject(ProcessMiningService);
  private cdr = inject(ChangeDetectorRef);

  processMap: ProcessMap | null = null;
  isLoading = true;
  filtroRiesgo = 'TODOS';

  private networkInstance: Network | null = null;

  ngOnInit(): void {
    this.loadProcessMap();
  }

  loadProcessMap(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.processService.getProcessMap(this.filtroRiesgo).subscribe({
      next: data => {
        this.processMap = data;
        this.isLoading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.renderNetwork(), 50);
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  renderNetwork(): void {
    if (!this.networkContainer || !this.processMap || this.processMap.actividades.length === 0) return;

    const nodesArray = this.processMap.actividades.map((act) => ({
      id: act.actividad,
      label: `${act.actividad}\n(${act.cantidadPacientes} pac)`,
      shape: 'box',
      margin: 12,
      color: {
        background: '#0369a1',
        border: '#38bdf8',
        highlight: { background: '#0284c7', border: '#7dd3fc' }
      },
      font: { color: '#ffffff', size: 12 }
    }));

    const edgesArray = this.processMap.transiciones.map((t, index) => ({
      id: `e-${index}`,
      from: t.origen,
      to: t.destino,
      label: `${t.cantidadCasos} casos`,
      arrows: 'to',
      color: { color: '#94a3b8', highlight: '#38bdf8' },
      font: { color: '#cbd5e1', size: 10, align: 'top', strokeWidth: 0 }
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
          nodeSpacing: 160,
          levelSeparation: 120
        }
      },
      physics: false,
      interaction: { hover: true, zoomView: true, dragView: true }
    };

    if (this.networkInstance) {
      this.networkInstance.destroy();
    }

    this.networkInstance = new Network(this.networkContainer.nativeElement, data, options);
  }
}
