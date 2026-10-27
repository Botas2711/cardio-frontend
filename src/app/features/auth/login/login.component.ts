import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthBrandPanelComponent } from '../components/auth-brand-panel.component';
import Swal from 'sweetalert2';

const DEFAULT_LOGIN_ERROR_MESSAGE = 'Credenciales incorrectas';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AuthBrandPanelComponent],
  template: `
    <div class="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      <!-- Columna izquierda: Identidad corporativa de la marca PonteCorazonPe (50% de ancho) -->
      <app-auth-brand-panel class="w-full lg:w-1/2 block shrink-0"></app-auth-brand-panel>

      <!-- Columna derecha: Formulario de inicio de sesión -->
      <main class="w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12">
        <div class="w-full max-w-md mx-auto">
          <!-- Encabezado de la vista -->
          <header class="mb-8">
            <h1 class="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Iniciar Sesión
            </h1>
            <p class="mt-2 text-sm text-slate-500 font-normal">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </header>

          <!-- Formulario de autenticación -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5" novalidate>
            <!-- Campo: Correo electrónico -->
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
                placeholder="ejemplo@gmail.com"
                (input)="clearLoginError()"
                class="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E11D48] focus:border-transparent transition text-sm"
              />
              @if (loginForm.get('correo')?.touched && loginForm.get('correo')?.invalid) {
                <span class="text-xs text-[#E11D48] mt-1.5 block">
                  Ingrese un correo electrónico válido
                </span>
              }
            </div>

            <!-- Campo: Contraseña -->
            <div>
              <label for="password" class="block text-sm font-semibold text-slate-800 mb-2">
                Contraseña
              </label>
              <div class="relative">
                <input
                  id="password"
                  name="password"
                  [type]="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  formControlName="password"
                  placeholder="••••••••"
                  (input)="clearLoginError()"
                  [ngClass]="{
                    'border-[#E11D48] focus:ring-[#E11D48]': hasLoginError,
                    'border-slate-300 focus:ring-[#E11D48] focus:border-transparent': !hasLoginError
                  }"
                  class="w-full px-4 py-3 pr-12 rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition text-sm"
                />

                <!-- Botón para alternar visibilidad de contraseña -->
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded transition"
                  [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                >
                  @if (showPassword) {
                    <!-- Icono Ojo tachado (Ocultar) -->
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  } @else {
                    <!-- Icono Ojo (Mostrar) -->
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  }
                </button>
              </div>

              <!-- Mensaje de error de credenciales incorrectas (Mockup login-error.png) -->
              @if (hasLoginError) {
                <p class="text-xs text-[#E11D48] font-medium mt-1.5">
                  {{ loginErrorMessage }}
                </p>
              }
            </div>

            <!-- Enlace: ¿Olvidaste tu contraseña? -->
            <div class="pt-1">
              <a
                routerLink="/forgot-password"
                class="text-sm font-semibold text-[#E11D48] hover:text-[#BE123C] hover:underline transition"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <!-- Botón de acción: Iniciar Sesión -->
            <div>
              <button
                type="submit"
                [disabled]="loginForm.invalid || isLoading"
                class="w-full flex justify-center items-center py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E11D48] disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm"
              >
                @if (isLoading) {
                  <svg class="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                } @else {
                  Iniciar Sesión
                }
              </button>
            </div>
          </form>

          <!-- Acceso rápido para pruebas clínicas (Discreto para desarrollo y evaluación) -->
          <footer class="mt-8 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              (click)="fillDemoCredentials()"
              class="text-xs text-slate-400 hover:text-[#E11D48] transition"
            >
              Completar datos de prueba: agustinalex14&#64;gmail.com
            </button>
          </footer>
        </div>
      </main>
    </div>
  `
})
export class LoginComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public isLoading: boolean = false;
  public showPassword: boolean = false;
  public hasLoginError: boolean = false;
  public loginErrorMessage: string = DEFAULT_LOGIN_ERROR_MESSAGE;

  public loginForm = this.formBuilder.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public clearLoginError(): void {
    if (this.hasLoginError) {
      this.hasLoginError = false;
      this.loginErrorMessage = DEFAULT_LOGIN_ERROR_MESSAGE;
    }
  }

  public fillDemoCredentials(): void {
    this.loginForm.patchValue({
      correo: 'agustinalex14@gmail.com',
      password: 'Botas2311@'
    });
    this.clearLoginError();
  }

  public onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.hasLoginError = false;

    const { correo, password } = this.loginForm.value;

    this.authService.login({ correo: correo!.trim(), password: password! }).subscribe({
      next: response => {
        this.isLoading = false;

        // HU001: Verificación de acceso exclusivo al personal médico cardiólogo
        if (response.rol !== 'CARDIOLOGO') {
          Swal.fire({
            icon: 'error',
            title: 'Acceso Restringido',
            text: 'Este portal está destinado exclusivamente al personal médico cardiólogo.',
            confirmButtonColor: '#E11D48'
          });
          this.authService.logout();
          return;
        }

        // HU001 Escenario 1: Redirección exitosa al panel clínico
        this.router.navigate(['/triage']);
      },
      error: errorResponse => {
        this.isLoading = false;
        // HU001 Escenario 2: Visualización de error inline conforme a mockup login-error.png
        this.hasLoginError = true;
        this.loginErrorMessage = DEFAULT_LOGIN_ERROR_MESSAGE;
      }
    });
  }
}
