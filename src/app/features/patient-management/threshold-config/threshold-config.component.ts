import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PatientService } from '../../../services/patient.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-threshold-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <!-- Encabezado del Modal -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-lg font-black text-slate-900">Personalizar Umbrales Clínicos</h3>
            <p class="text-xs text-slate-500">Paciente: <span class="font-bold text-slate-700">{{ patientName }}</span> (HU027)</p>
          </div>
          <button (click)="closeModal.emit()" class="text-slate-400 hover:text-slate-600 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Formulario de Calibración -->
        <form [formGroup]="thresholdForm" (ngSubmit)="onSubmit()" class="mt-5 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Pulso Mínimo -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Pulso Mínimo (ppm)</label>
              <input
                type="number"
                formControlName="frecuenciaMin"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <!-- Pulso Máximo -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Pulso Máximo (ppm)</label>
              <input
                type="number"
                formControlName="frecuenciaMax"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <!-- Presión Sistólica Máx -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">PA Sistólica Máx (mmHg)</label>
              <input
                type="number"
                formControlName="presionSisMax"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <!-- Presión Diastólica Máx -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">PA Diastólica Máx (mmHg)</label>
              <input
                type="number"
                formControlName="presionDiaMax"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            💡 Las lecturas que superen estos límites personalizados generarán alertas clínicas automáticas para el médico y auxilio al familiar registrado.
          </div>

          <!-- Botones -->
          <div class="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              (click)="closeModal.emit()"
              class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="thresholdForm.invalid || isSaving"
              class="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow disabled:opacity-50 transition"
            >
              {{ isSaving ? 'Guardando...' : 'Guardar Umbrales' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ThresholdConfigComponent implements OnInit {
  @Input({ required: true }) patientId!: number;
  @Input({ required: true }) patientName!: string;
  @Output() closeModal = new EventEmitter<void>();
  @Output() thresholdsUpdated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);

  isSaving = false;

  thresholdForm = this.fb.group({
    frecuenciaMin: [60, [Validators.required, Validators.min(30), Validators.max(150)]],
    frecuenciaMax: [100, [Validators.required, Validators.min(50), Validators.max(220)]],
    presionSisMax: [140, [Validators.required, Validators.min(80), Validators.max(250)]],
    presionDiaMax: [90, [Validators.required, Validators.min(40), Validators.max(150)]]
  });

  ngOnInit(): void {
    this.patientService.getById(this.patientId).subscribe(p => {
      this.thresholdForm.patchValue({
        frecuenciaMin: p.frecuenciaMin,
        frecuenciaMax: p.frecuenciaMax,
        presionSisMax: p.presionSisMax,
        presionDiaMax: p.presionDiaMax
      });
    });
  }

  onSubmit(): void {
    if (this.thresholdForm.invalid) return;

    const val = this.thresholdForm.value;

    // HU027 Escenario 2: Ingreso de valores fuera de rango fisiológico
    if (val.frecuenciaMax! <= val.frecuenciaMin! || val.presionSisMax! <= val.presionDiaMax!) {
      Swal.fire({
        icon: 'warning',
        title: 'Rango Inválido',
        text: 'Rango inválido. El valor máximo debe ser superior al mínimo',
        confirmButtonColor: '#0284C7'
      });
      return;
    }

    this.isSaving = true;

    this.patientService.updateThresholds(this.patientId, {
      frecuenciaMin: val.frecuenciaMin!,
      frecuenciaMax: val.frecuenciaMax!,
      presionSisMax: val.presionSisMax!,
      presionDiaMax: val.presionDiaMax!
    }).subscribe({
      next: () => {
        this.isSaving = false;
        // HU027 Escenario 1: Modificación exitosa
        Swal.fire({
          icon: 'success',
          title: 'Configuración Guardada',
          text: 'Se actualizaron los límites basales personalizados del paciente.',
          confirmButtonColor: '#0284C7',
          timer: 2000
        });
        this.thresholdsUpdated.emit();
        this.closeModal.emit();
      },
      error: err => {
        this.isSaving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'No se pudieron actualizar los umbrales.',
          confirmButtonColor: '#0284C7'
        });
      }
    });
  }
}
