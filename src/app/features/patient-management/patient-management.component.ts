import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ThresholdConfigComponent } from './threshold-config/threshold-config.component';

@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, ThresholdConfigComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Gestión y Parámetros de Pacientes</h2>
          <p class="text-sm text-slate-500">
            Administración de perfiles clínicos y umbrales basales de pulso y presión (HU027, HU028)
          </p>
        </div>
        <a
          routerLink="/patient-management/new"
          class="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow transition"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Paciente
        </a>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        @if (isLoading) {
          <app-loading-spinner message="Cargando pacientes..."></app-loading-spinner>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th class="px-5 py-3.5">Paciente</th>
                  <th class="px-4 py-3.5">DNI</th>
                  <th class="px-4 py-3.5">Edad / Género</th>
                  <th class="px-4 py-3.5">Umbral Pulso</th>
                  <th class="px-4 py-3.5">Umbral PA Máx</th>
                  <th class="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                @for (p of patients; track p.idPaciente) {
                  <tr class="hover:bg-slate-50 transition">
                    <td class="px-5 py-4 font-bold text-slate-900">
                      {{ p.nombres }} {{ p.apellidos }}
                      <span class="block text-xs font-normal text-slate-500">{{ p.correo }}</span>
                    </td>
                    <td class="px-4 py-4 font-mono font-medium text-slate-700">{{ p.dni }}</td>
                    <td class="px-4 py-4 text-slate-600">{{ p.edad }} años ({{ p.genero }})</td>
                    <td class="px-4 py-4 font-mono text-slate-800">{{ p.frecuenciaMin }} - {{ p.frecuenciaMax }} ppm</td>
                    <td class="px-4 py-4 font-mono text-slate-800">{{ p.presionSisMax }} / {{ p.presionDiaMax }} mmHg</td>
                    <td class="px-5 py-4 text-right">
                      <button
                        (click)="selectedPatient = p"
                        class="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
                      >
                        Calibrar Umbrales
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

    @if (selectedPatient) {
      <app-threshold-config
        [patientId]="selectedPatient.idPaciente"
        [patientName]="selectedPatient.nombres + ' ' + selectedPatient.apellidos"
        (closeModal)="selectedPatient = null"
        (thresholdsUpdated)="loadPatients()"
      ></app-threshold-config>
    }
  `
})
export class PatientManagementComponent implements OnInit {
  private patientService = inject(PatientService);
  private cdr = inject(ChangeDetectorRef);

  patients: Patient[] = [];
  isLoading = true;
  selectedPatient: Patient | null = null;

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.patientService.getAll().subscribe({
      next: list => {
        this.patients = list;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
