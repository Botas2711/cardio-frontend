import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientService } from '../../../services/patient.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Encabezado -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Alta y Registro Clínico de Paciente</h2>
          <p class="text-sm text-slate-500">
            Habilita el acceso a la app móvil y parametriza el monitoreo ambulatorio (HU028)
          </p>
        </div>
        <a
          routerLink="/triage"
          class="px-3.5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          ← Volver al Triage
        </a>
      </div>

      <!-- Tarjeta del Formulario -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form [formGroup]="patientForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Sección 1: Datos Personales e Identificación -->
          <div>
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center">
              <span class="w-2 h-2 rounded-full bg-sky-600 mr-2"></span>
              1. Datos de Identificación y Contacto
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- DNI -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Documento de Identidad (DNI) *
                </label>
                <input
                  type="text"
                  formControlName="dni"
                  maxlength="15"
                  placeholder="8 dígitos"
                  class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                @if (patientForm.get('dni')?.touched && patientForm.get('dni')?.invalid) {
                  <span class="text-xs text-red-500 mt-1 block">El DNI es obligatorio (8 a 15 dígitos)</span>
                }
              </div>

              <!-- Correo Electrónico -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Correo Electrónico (Acceso App Móvil) *
                </label>
                <input
                  type="email"
                  formControlName="correo"
                  placeholder="paciente@correo.com"
                  class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                @if (patientForm.get('correo')?.touched && patientForm.get('correo')?.invalid) {
                  <span class="text-xs text-red-500 mt-1 block">Ingrese un formato de correo válido</span>
                }
              </div>

              <!-- Nombres -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombres *</label>
                <input
                  type="text"
                  formControlName="nombres"
                  placeholder="Ej. Juan Carlos"
                  class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <!-- Apellidos -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Apellidos *</label>
                <input
                  type="text"
                  formControlName="apellidos"
                  placeholder="Ej. Pérez Gómez"
                  class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <!-- Fecha de Nacimiento -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  formControlName="fechaNacimiento"
                  class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <!-- Género -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Género *</label>
                <select
                  formControlName="genero"
                  class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                >
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Sección 2: Calibración de Umbrales Basales Iniciales (HU027) -->
          <div>
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center">
              <span class="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
              2. Parámetros y Límites Hemodinámicos Basales (HU027)
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Frecuencia Mínima -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Pulso Mínimo (ppm)</label>
                <input
                  type="number"
                  formControlName="frecuenciaMin"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <!-- Frecuencia Máxima -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Pulso Máximo (ppm)</label>
                <input
                  type="number"
                  formControlName="frecuenciaMax"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <!-- Presión Sistólica Máx -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">PA Sistólica Máx (mmHg)</label>
                <input
                  type="number"
                  formControlName="presionSisMax"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <!-- Presión Diastólica Máx -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">PA Diastólica Máx (mmHg)</label>
                <input
                  type="number"
                  formControlName="presionDiaMax"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              routerLink="/triage"
              class="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="patientForm.invalid || isSubmitting"
              class="px-6 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow disabled:opacity-50 transition"
            >
              {{ isSubmitting ? 'Registrando...' : 'Registrar Paciente' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PatientFormComponent {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private router = inject(Router);

  isSubmitting = false;

  patientForm = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(15)]],
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    fechaNacimiento: ['', Validators.required],
    genero: ['MASCULINO', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    frecuenciaMin: [60, [Validators.required, Validators.min(30)]],
    frecuenciaMax: [100, [Validators.required, Validators.max(220)]],
    presionSisMax: [140, [Validators.required, Validators.max(250)]],
    presionDiaMax: [90, [Validators.required, Validators.max(150)]]
  });

  onSubmit(): void {
    if (this.patientForm.invalid) {
      // HU028 Escenario 3: Campos obligatorios incompletos
      Swal.fire({
        icon: 'error',
        title: 'Formulario Incompleto',
        text: 'Por favor, complete todos los campos obligatorios con un formato válido.',
        confirmButtonColor: '#0284C7'
      });
      return;
    }

    const val = this.patientForm.value;

    // Validación fisiológica (HU027)
    if (val.frecuenciaMax! <= val.frecuenciaMin! || val.presionSisMax! <= val.presionDiaMax!) {
      Swal.fire({
        icon: 'warning',
        title: 'Rango Inválido',
        text: 'Rango inválido. El valor máximo debe ser superior al mínimo.',
        confirmButtonColor: '#0284C7'
      });
      return;
    }

    this.isSubmitting = true;

    this.patientService.create({
      dni: val.dni!,
      nombres: val.nombres!,
      apellidos: val.apellidos!,
      fechaNacimiento: val.fechaNacimiento!,
      genero: val.genero!,
      correo: val.correo!,
      frecuenciaMin: val.frecuenciaMin!,
      frecuenciaMax: val.frecuenciaMax!,
      presionSisMax: val.presionSisMax!,
      presionDiaMax: val.presionDiaMax!
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        // HU028 Escenario 1: Registro exitoso
        Swal.fire({
          icon: 'success',
          title: 'Paciente registrado exitosamente',
          text: `Se crearon las credenciales de acceso para ${val.nombres} ${val.apellidos}.`,
          confirmButtonColor: '#0284C7'
        }).then(() => {
          this.router.navigate(['/triage']);
        });
      },
      error: err => {
        this.isSubmitting = false;
        // HU028 Escenario 2: Intento de registro con documento duplicado
        const errorMsg = err.error?.message || 'Ocurrió un error al intentar registrar el paciente.';
        Swal.fire({
          icon: 'error',
          title: 'Error de Registro',
          text: errorMsg,
          confirmButtonColor: '#0284C7'
        });
      }
    });
  }
}
