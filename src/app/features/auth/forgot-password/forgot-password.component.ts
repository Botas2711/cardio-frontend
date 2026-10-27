import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthBrandPanelComponent } from '../components/auth-brand-panel.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AuthBrandPanelComponent],
  template: `
    <div class="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      <!-- Columna izquierda: Identidad corporativa de la marca PonteCorazonPe (50% de ancho) -->
      <app-auth-brand-panel class="w-full lg:w-1/2 block shrink-0"></app-auth-brand-panel>

      <!-- Columna derecha: Formulario de recuperación de cuenta -->
      <main class="w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12">
        <div class="w-full max-w-md mx-auto">
          @if (!emailSent) {
            <!-- Icono de candado con badge circular rosado claro (Mockup password-recovery.png) -->
            <div class="w-14 h-14 rounded-full bg-[#FFE4E6] flex items-center justify-center mx-auto mb-5">
              <svg
                class="w-6 h-6 text-[#E11D48]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2.2"
                aria-hidden="true"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </div>

            <!-- Encabezado de la vista -->
            <header class="text-center mb-8">
              <h1 class="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                Recuperar Contraseña
              </h1>
              <p class="mt-2 text-sm text-slate-500 font-normal">
                Te enviaremos un enlace para restablecer tu cuenta
              </p>
            </header>

            <!-- Formulario de solicitud -->
            <form [formGroup]="requestForm" (ngSubmit)="onRequestToken()" class="space-y-6" novalidate>
              <div>
                <label for="correo" class="block text-sm font-semibold text-slate-800 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  autocomplete="username"
                  formControlName="correo"
                  placeholder="admin@gmail.com"
                  class="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E11D48] focus:border-transparent transition text-sm"
                />
                @if (requestForm.get('correo')?.touched && requestForm.get('correo')?.invalid) {
                  <span class="text-xs text-[#E11D48] mt-1.5 block">
                    Ingrese un correo electrónico válido
                  </span>
                }
              </div>

              <!-- Botón: Enviar enlace -->
              <div>
                <button
                  type="submit"
                  [disabled]="requestForm.invalid || isLoading"
                  class="w-full flex justify-center items-center py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E11D48] disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm"
                >
                  @if (isLoading) {
                    <svg class="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando enlace...
                  } @else {
                    Enviar enlace
                  }
                </button>
              </div>

              <!-- Enlace inferior: Volver al inicio de sesión -->
              <div class="text-center pt-2">
                <a
                  routerLink="/login"
                  class="inline-block text-sm font-medium text-[#E11D48] hover:text-[#BE123C] hover:underline transition"
                >
                  Volver al inicio de sesión
                </a>
              </div>
            </form>
          } @else {
            <!-- Estado de éxito: Correo enviado con la nueva contraseña provisional -->
            <div class="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <svg class="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <header class="text-center mb-6">
              <h1 class="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                ¡Correo Enviado!
              </h1>
              <p class="mt-2 text-sm text-slate-500 font-normal">
                Hemos enviado su nueva contraseña provisional a su correo registrado
              </p>
            </header>

            <div class="space-y-6">
              <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm leading-relaxed">
                <p class="font-semibold">Revisa tu bandeja de entrada o Mailtrap</p>
                <p class="mt-1 text-xs text-emerald-700">
                  Se generó y envió la contraseña provisional para <strong class="text-emerald-950">{{ sentEmail }}</strong>. Utilízala para acceder al sistema.
                </p>
              </div>

              <!-- Botón principal directo hacia el inicio de sesión -->
              <div>
                <a
                  routerLink="/login"
                  class="w-full flex justify-center items-center py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] transition shadow-sm text-center"
                >
                  Iniciar Sesión
                </a>
              </div>

              <div class="text-center pt-2">
                <button
                  type="button"
                  (click)="emailSent = false"
                  class="text-xs text-slate-500 hover:text-[#E11D48] hover:underline transition"
                >
                  ← Intentar con otro correo
                </button>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `
})
export class ForgotPasswordComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public isLoading: boolean = false;
  public emailSent: boolean = false;
  public sentEmail: string = '';

  public requestForm = this.formBuilder.group({
    correo: ['', [Validators.required, Validators.email]]
  });

  public onRequestToken(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const correo = this.requestForm.value.correo!.trim();

    this.authService.solicitarRecuperacionClave({ correo }).subscribe({
      next: response => {
        this.isLoading = false;
        this.sentEmail = correo;
        this.emailSent = true;
      },
      error: errorResponse => {
        this.isLoading = false;
        // HU004 Escenario 2: Correo no registrado
        Swal.fire({
          icon: 'error',
          title: 'Correo no registrado',
          text: errorResponse.error?.message || 'No existe una cuenta asociada al correo proporcionado.',
          confirmButtonColor: '#E11D48'
        });
      }
    });
  }
}
