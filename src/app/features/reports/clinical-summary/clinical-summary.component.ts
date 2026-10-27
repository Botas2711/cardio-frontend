import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../services/patient.service';
import { ReportService } from '../../../services/report.service';
import { Patient } from '../../../models/patient.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clinical-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">Generador de Informes Clínicos</h2>
        <p class="text-sm text-slate-500">
          Descarga de resúmenes médicos consolidados en formato PDF (HU017)
        </p>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <!-- 1. Selección del Paciente -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Seleccionar Paciente *
          </label>
          <select
            [(ngModel)]="selectedPatientId"
            class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option [ngValue]="null" disabled>Elija un paciente registrado...</option>
            @for (p of patients; track p.idPaciente) {
              <option [ngValue]="p.idPaciente">
                {{ p.nombres }} {{ p.apellidos }} (DNI: {{ p.dni }})
              </option>
            }
          </select>
        </div>

        <!-- 2. Rango de Fechas del Informe (HU017 Escenario 3) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Fecha de Inicio
            </label>
            <input
              type="date"
              [(ngModel)]="fechaInicio"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Fecha de Término
            </label>
            <input
              type="date"
              [(ngModel)]="fechaFin"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <!-- Información sobre el Reporte -->
        <div class="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 space-y-1.5">
          <p class="font-bold flex items-center">
            <span class="mr-1.5">📋</span> El informe clínico en PDF incluye:
          </p>
          <ul class="list-disc list-inside space-y-0.5 text-sky-800 ml-2">
            <li>Ficha de identificación clínica y umbrales basales del paciente.</li>
            <li>Promedios y métricas fisiológicas calculadas bajo la norma IEEE 1708-2014.</li>
            <li>Registro cronológico de alertas críticas atendidas con observaciones médicas.</li>
            <li>Sello de conformidad con la Ley N.° 29733 de Protección de Datos Personales en el Perú.</li>
          </ul>
        </div>

        <!-- Botón de Descarga (HU017 Escenario 1) -->
        <div class="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            (click)="onDownload()"
            [disabled]="!selectedPatientId || isDownloading"
            class="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow disabled:opacity-50 transition flex items-center"
          >
            @if (isDownloading) {
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Compilando PDF...
            } @else {
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Descargar Informe Clínico PDF
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class ClinicalSummaryComponent implements OnInit {
  private patientService = inject(PatientService);
  private reportService = inject(ReportService);

  patients: Patient[] = [];
  selectedPatientId: number | null = null;
  fechaInicio = '';
  fechaFin = '';
  isDownloading = false;

  ngOnInit(): void {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    this.fechaFin = today.toISOString().split('T')[0];
    this.fechaInicio = lastMonth.toISOString().split('T')[0];

    this.patientService.getAll().subscribe(list => {
      this.patients = list;
      if (list.length > 0) {
        this.selectedPatientId = list[0].idPaciente;
      }
    });
  }

  onDownload(): void {
    if (!this.selectedPatientId) return;

    this.isDownloading = true;

    this.reportService.downloadPdfReport(this.selectedPatientId, this.fechaInicio, this.fechaFin).subscribe({
      next: blob => {
        this.isDownloading = false;
        const patient = this.patients.find(p => p.idPaciente === this.selectedPatientId);
        const name = patient ? `${patient.nombres}_${patient.apellidos}` : 'paciente';
        this.reportService.saveBlobToFile(blob, `informe_clinico_${name}.pdf`);
        Swal.fire({
          icon: 'success',
          title: 'Informe Descargado',
          text: 'El documento clínico oficial fue generado exitosamente.',
          confirmButtonColor: '#0284C7',
          timer: 2000
        });
      },
      error: err => {
        this.isDownloading = false;
        // HU017 Escenario 2: Paciente sin registros clínicos suficientes
        const msg = err.error?.message || 'El paciente aún no cuenta con lecturas registradas en el período seleccionado.';
        Swal.fire({
          icon: 'warning',
          title: 'Aviso Clínico',
          text: msg,
          confirmButtonColor: '#0284C7'
        });
      }
    });
  }
}
