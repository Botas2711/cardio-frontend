import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../services/patient.service';
import { SettingsService } from '../../../core/services/settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-patient-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Overlay de Fondo Oscuro -->
    <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <!-- Contenedor del Modal -->
      <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 transition-all">

        <!-- ========================================== -->
        <!-- PASO 1: INFORMACIÓN PERSONAL (new-patient-modal-1.png / dni-error-modal.png) -->
        <!-- ========================================== -->
        @if (currentStep === 1) {
          <div class="p-7 sm:p-8 space-y-6">
            <!-- Encabezado con Botón de Cierre -->
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-xl font-black text-slate-900 tracking-tight">Step 1 de 2: Información Personal</h3>
                <p class="text-xs text-slate-500 mt-1 font-medium">Completa los datos de identificación y contacto del paciente.</p>
              </div>
              <button
                (click)="close()"
                class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Cerrar modal"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Barra de Progreso 50% -->
            <div class="flex items-center space-x-3">
              <div class="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden flex">
                <div class="bg-brand h-full w-1/2 rounded-full transition-all duration-300"></div>
                <div class="bg-slate-200 h-full w-1/2"></div>
              </div>
              <span class="text-xs font-bold text-slate-400">50%</span>
            </div>

            <!-- Campos del Formulario Paso 1 -->
            <div class="space-y-4">
              <!-- Nombres y Apellidos en Grilla -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-800 mb-1.5">Nombres *</label>
                  <input
                    type="text"
                    [(ngModel)]="nombres"
                    placeholder="Ej. Piero"
                    class="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-800 mb-1.5">Apellidos *</label>
                  <input
                    type="text"
                    [(ngModel)]="apellidos"
                    placeholder="Ej. Aguirre Ellen"
                    class="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <!-- DNI y Correo en Grilla -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- DNI con Validación Única en Vivo (dni-error-modal.png) -->
                <div>
                  <label class="block text-xs font-bold text-slate-800 mb-1.5">DNI *</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg
                        [ngClass]="isDniDuplicate ? 'text-brand' : 'text-slate-400'"
                        class="w-4 h-4 transition"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      maxlength="8"
                      [(ngModel)]="dni"
                      (ngModelChange)="checkDniUniqueness()"
                      placeholder="8 dígitos"
                      [ngClass]="isDniDuplicate ? 'border-brand text-brand focus:ring-brand' : 'border-slate-200 focus:border-brand focus:ring-brand'"
                      class="w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition font-medium"
                    />
                  </div>
                  @if (isDniDuplicate) {
                    <p class="text-xs text-brand font-semibold mt-1.5 flex items-center">
                      Este DNI ya está registrado
                    </p>
                  }
                </div>

                <!-- Correo Electrónico -->
                <div>
                  <label class="block text-xs font-bold text-slate-800 mb-1.5">Correo</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <input
                      type="email"
                      [(ngModel)]="correo"
                      placeholder="paciente&#64;correo.com"
                      class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <!-- Celular -->
              <div>
                <label class="block text-xs font-bold text-slate-800 mb-1.5">Celular *</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  </div>
                  <input
                    type="tel"
                    [(ngModel)]="celular"
                    placeholder="999 999 999"
                    class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <!-- Tarjeta de Confidencialidad y Seguridad -->
              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center space-x-3 text-slate-600">
                <svg class="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <p class="text-xs leading-relaxed">
                  Los datos personales se almacenan de forma segura y se utilizan únicamente para el monitoreo clínico.
                </p>
              </div>
            </div>

            <!-- Pie del Modal: Botón Siguiente -->
            <div class="pt-2 flex items-center justify-between border-t border-slate-100">
              <span class="text-xs text-slate-400 font-medium">* Campos obligatorios</span>
              <button
                type="button"
                [disabled]="!isStep1Valid() || isDniDuplicate"
                (click)="goToStep2()"
                [ngClass]="(!isStep1Valid() || isDniDuplicate) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand hover:bg-brand-dark text-white cursor-pointer shadow-md active:scale-98'"
                class="px-6 py-2.5 rounded-xl font-bold text-sm transition flex items-center space-x-1.5"
              >
                <span>Siguiente</span>
                <span class="text-sm font-bold">&gt;</span>
              </button>
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- PASO 2: INFORMACIÓN CLÍNICA (new-patient-modal-2.png) -->
        <!-- ========================================== -->
        @if (currentStep === 2) {
          <div class="p-7 sm:p-8 space-y-6">
            <!-- Encabezado -->
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-xl font-black text-slate-900 tracking-tight">Step 2 de 2: Información Clínica</h3>
                <p class="text-xs text-slate-500 mt-1 font-medium">Registra antecedentes y factores relevantes para calcular el riesgo.</p>
              </div>
              <button
                (click)="close()"
                class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Cerrar modal"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Barra de Progreso 100% -->
            <div class="flex items-center space-x-3">
              <div class="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden flex">
                <div class="bg-brand h-full w-full rounded-full transition-all duration-300"></div>
              </div>
              <span class="text-xs font-bold text-brand">100%</span>
            </div>

            <!-- Medidas Básicas -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800">Medidas básicas</h4>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Edad *</label>
                  <input
                    type="number"
                    [(ngModel)]="edad"
                    placeholder="38"
                    class="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm text-slate-900 outline-none text-center font-semibold"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Peso (kg) *</label>
                  <input
                    type="number"
                    [(ngModel)]="pesoKg"
                    placeholder="82"
                    class="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm text-slate-900 outline-none text-center font-semibold"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Talla (cm) *</label>
                  <input
                    type="number"
                    [(ngModel)]="tallaCm"
                    placeholder="174"
                    class="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm text-slate-900 outline-none text-center font-semibold"
                  />
                </div>
              </div>

              <!-- Factores y Síntomas (Botones Segmentados SÍ / NO) -->
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800 pt-2">Factores y síntomas</h4>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <!-- Obesidad -->
                <div>
                  <span class="block text-xs font-semibold text-slate-600 mb-1">Obesidad</span>
                  <div class="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      (click)="obesidad = true"
                      [ngClass]="obesidad ? 'bg-brand text-white shadow-xs font-bold' : 'text-slate-500 font-medium'"
                      class="flex-1 py-1 text-xs rounded-lg transition"
                    >SÍ</button>
                    <button
                      type="button"
                      (click)="obesidad = false"
                      [ngClass]="!obesidad ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500 font-medium'"
                      class="flex-1 py-1 text-xs rounded-lg transition"
                    >NO</button>
                  </div>
                </div>

                <!-- Fuma -->
                <div>
                  <span class="block text-xs font-semibold text-slate-600 mb-1">Fuma</span>
                  <div class="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      (click)="tabaquismo = true"
                      [ngClass]="tabaquismo ? 'bg-brand text-white shadow-xs font-bold' : 'text-slate-500 font-medium'"
                      class="flex-1 py-1 text-xs rounded-lg transition"
                    >SÍ</button>
                    <button
                      type="button"
                      (click)="tabaquismo = false"
                      [ngClass]="!tabaquismo ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500 font-medium'"
                      class="flex-1 py-1 text-xs rounded-lg transition"
                    >NO</button>
                  </div>
                </div>

                <!-- Consume Alcohol -->
                <div>
                  <span class="block text-xs font-semibold text-slate-600 mb-1">Consume Alcohol</span>
                  <div class="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      (click)="consumoAlcohol = true"
                      [ngClass]="consumoAlcohol ? 'bg-brand text-white shadow-xs font-bold' : 'text-slate-500 font-medium'"
                      class="flex-1 py-1 text-xs rounded-lg transition"
                    >SÍ</button>
                    <button
                      type="button"
                      (click)="consumoAlcohol = false"
                      [ngClass]="!consumoAlcohol ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500 font-medium'"
                      class="flex-1 py-1 text-xs rounded-lg transition"
                    >NO</button>
                  </div>
                </div>

                <!-- Antecedentes CV -->
                <div>
                  <span class="block text-xs font-semibold text-slate-600 mb-1">Antecedentes CV</span>
                  <div class="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      (click)="antecedentesCv = true"
                      [ngClass]="antecedentesCv ? 'bg-brand text-white shadow-xs font-bold' : 'text-slate-500 font-medium'"
                      class="flex-1 py-1 text-xs rounded-lg transition"
                    >SÍ</button>
                    <button
                      type="button"
                      (click)="antecedentesCv = false"
                      [ngClass]="!antecedentesCv ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500 font-medium'"
                      class="flex-1 py-1 text-xs rounded-lg transition"
                    >NO</button>
                  </div>
                </div>
              </div>

              <!-- Enfermedades Previas (Checkboxes) -->
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800 pt-2">Enfermedades Previas</h4>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label class="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="diabetes"
                    class="w-4 h-4 text-brand rounded focus:ring-brand accent-brand border-slate-300"
                  />
                  <span>Diabetes</span>
                </label>
                <label class="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="hipertension"
                    class="w-4 h-4 text-brand rounded focus:ring-brand accent-brand border-slate-300"
                  />
                  <span>Hipertensión</span>
                </label>
                <label class="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="acv"
                    class="w-4 h-4 text-brand rounded focus:ring-brand accent-brand border-slate-300"
                  />
                  <span>ACV</span>
                </label>
                <label class="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="tiroides"
                    class="w-4 h-4 text-brand rounded focus:ring-brand accent-brand border-slate-300"
                  />
                  <span>Tiroides</span>
                </label>
              </div>
            </div>

            <!-- Pie del Modal: Botón Atrás y Registrar Paciente -->
            <div class="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                (click)="goToStep1()"
                class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition flex items-center space-x-1"
              >
                <span>&larr;</span>
                <span>Atrás</span>
              </button>

              <button
                type="button"
                [disabled]="!isStep2Valid() || isSubmitting"
                (click)="submitPatient()"
                class="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm shadow-md transition flex items-center space-x-2 disabled:opacity-50"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                <span>{{ isSubmitting ? 'Registrando...' : 'Registrar Paciente' }}</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class NewPatientModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() patientCreated = new EventEmitter<void>();

  private patientService = inject(PatientService);
  private settingsService = inject(SettingsService);

  currentStep = 1;
  isSubmitting = false;
  isDniDuplicate = false;

  // Paso 1
  nombres = '';
  apellidos = '';
  dni = '';
  correo = '';
  celular = '';

  // Paso 2
  edad: number | null = null;
  pesoKg: number | null = null;
  tallaCm: number | null = null;

  obesidad = false;
  tabaquismo = false;
  consumoAlcohol = false;
  antecedentesCv = false;

  diabetes = false;
  hipertension = false;
  acv = false;
  tiroides = false;

  checkDniUniqueness(): void {
    if (this.dni && this.dni.trim().length === 8) {
      this.patientService.verificarDni(this.dni.trim()).subscribe({
        next: res => {
          this.isDniDuplicate = res.existe;
        },
        error: () => {
          this.isDniDuplicate = false;
        }
      });
    } else {
      this.isDniDuplicate = false;
    }
  }

  isStep1Valid(): boolean {
    return (
      this.nombres.trim().length > 0 &&
      this.apellidos.trim().length > 0 &&
      this.dni.trim().length === 8 &&
      this.celular.trim().length >= 9
    );
  }

  isStep2Valid(): boolean {
    return (
      this.edad !== null && this.edad > 0 &&
      this.pesoKg !== null && this.pesoKg > 0 &&
      this.tallaCm !== null && this.tallaCm > 0
    );
  }

  goToStep1(): void {
    this.currentStep = 1;
  }

  goToStep2(): void {
    if (!this.isStep1Valid() || this.isDniDuplicate) return;
    this.currentStep = 2;
  }

  close(): void {
    this.closeModal.emit();
  }

  submitPatient(): void {
    if (!this.isStep2Valid()) return;

    this.isSubmitting = true;
    const finalCorreo = this.correo.trim() !== '' ? this.correo.trim() : `${this.dni.trim()}@pontecorazonpe.com`;

    this.patientService.create({
      dni: this.dni.trim(),
      nombres: this.nombres.trim(),
      apellidos: this.apellidos.trim(),
      correo: finalCorreo,
      celular: this.celular.trim(),
      edad: Number(this.edad),
      pesoKg: Number(this.pesoKg),
      tallaCm: Number(this.tallaCm),
      obesidad: this.obesidad,
      tabaquismo: this.tabaquismo,
      consumoAlcohol: this.consumoAlcohol,
      antecedentesCv: this.antecedentesCv,
      diabetes: this.diabetes,
      hipertension: this.hipertension,
      acv: this.acv,
      tiroides: this.tiroides,
      frecuenciaMin: this.settingsService.getDefaultMinBpm(),
      frecuenciaMax: this.settingsService.getDefaultMaxBpm()
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: 'Paciente Registrado Exitosamente',
          text: `Se ha registrado a ${this.nombres} ${this.apellidos}. Las credenciales de acceso para la aplicación móvil fueron enviadas al correo ${finalCorreo} a través de Mailtrap.`,
          confirmButtonColor: '#E11D48',
          confirmButtonText: 'Entendido'
        }).then(() => {
          this.patientCreated.emit();
          this.close();
        });
      },
      error: err => {
        this.isSubmitting = false;
        const msg = err.error?.message || 'Ocurrió un error al registrar el paciente.';
        Swal.fire({
          icon: 'error',
          title: 'Error de Registro',
          text: msg,
          confirmButtonColor: '#E11D48'
        });
      }
    });
  }
}
