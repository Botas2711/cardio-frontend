import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-brand-panel',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'w-full lg:w-1/2 min-h-screen bg-brand flex flex-col items-center justify-center p-8 sm:p-12 text-white select-none shrink-0'
  },
  template: `
    <div class="flex items-center space-x-3.5">
      <!-- Isotipo: Corazón con trazo de pulso electrocardiográfico (ECG) -->
      <svg
        class="w-12 h-12 text-white shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        aria-hidden="true"
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
        <polyline
          points="3 12 8 12 10 8 13 16 15 11 17 12 21 12"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <!-- Nombre de la marca oficial -->
      <span class="text-3xl sm:text-4xl font-bold tracking-tight text-white whitespace-nowrap">
        PonteCorazonPe
      </span>
    </div>

    <!-- Lema corporativo -->
    <p class="mt-4 text-base sm:text-lg text-white/95 font-medium tracking-wide text-center">
      “Cuidando tu corazón a cada latido”
    </p>
  `
})
export class AuthBrandPanelComponent {}
